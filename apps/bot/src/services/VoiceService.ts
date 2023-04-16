import {
	type AudioPlayer,
	AudioPlayerStatus,
	type AudioResource,
	type VoiceConnection,
	VoiceConnectionStatus,
	createAudioPlayer,
	joinVoiceChannel
} from '@discordjs/voice';
import type { Guild, VoiceBasedChannel } from 'discord.js';
import { DatabaseService } from './DatabaseService';
import type { Percent } from '../types';
import { singleton } from 'tsyringe';

@singleton()
export class VoiceService {
	constructor(private dbService: DatabaseService) {}

	voiceConnections = new Map<Guild['id'], VoiceConnection>();

	audioPlayers = new Map<Guild['id'], AudioPlayer>();

	audioResources = new Map<Guild['id'], AudioResource>();

	/**
	 * Get an audio player that has at least one subscribed connection
	 */
	getActiveAudioPlayer(guild: Guild): AudioPlayer | undefined {
		const currentAudioPlayer = this.audioPlayers.get(guild.id);

		if (currentAudioPlayer?.playable.length) {
			return currentAudioPlayer;
		}
	}

	// Do not worry! Does not cause a memory leak
	onVoiceIdle(audioPlayer: AudioPlayer, callback: () => void): void {
		audioPlayer.on('stateChange', (oldState, newState) => {
			const wasPlaying = oldState.status === AudioPlayerStatus.Playing;
			const isIdle = newState.status === AudioPlayerStatus.Idle;

			if (wasPlaying && isIdle) {
				callback();
			}
		});
	}

	/**
	 * Destroy a voice connection if it exists and is not already destroyed.
	 */
	destroyConnection(guildId: string) {
		const potentialVoiceConnection = this.voiceConnections.get(guildId);

		if (potentialVoiceConnection?.state.status !== VoiceConnectionStatus.Destroyed) {
			potentialVoiceConnection?.destroy();
		}
	}

	/**
	 * Make the bot join the voice channel.
	 *
	 * Wrapper over the @discordjs/voice joinVoiceChannel function, discards and destroys previous
	 * voice connections to hopefully prevent memory leaks.
	 */
	createVoiceConnection(guild: Guild, channel: VoiceBasedChannel): VoiceConnection {
		this.destroyConnection(guild.id);

		const voiceConnection = joinVoiceChannel({
			guildId: guild.id,
			channelId: channel.id,
			adapterCreator: guild.voiceAdapterCreator
		}).on('stateChange', (oldState, newState) => {
			console.info(`📶 Voice status update for guild "${guild.name}": ${oldState.status} -> ${newState.status}.`);
		});

		this.voiceConnections.set(guild.id, voiceConnection);

		return voiceConnection;
	}

	/**
	 * Gets the volume, but if provided a setPercent will set the volume for the guild and return that instead.
	 *
	 * Performs an access to the database and upserts the guild if one does not exist.
	 */
	async guildVolume<T extends Percent>(guild: Guild, setPercent?: T): Promise<T> {
		const volumePercent = await this.dbService.prisma.discordGuild.upsert({
			where: { id: guild.id },
			update: { volumePercent: setPercent as number },
			create: { id: guild.id, volumePercent: 80 }
		});

		return volumePercent.volumePercent as T;
	}

	/**
	 * Sets the volume of the last created audio resource.
	 */
	setAudioResourceVolume(guild: Guild, setPercent: Percent): boolean {
		const audioResourceVolumeProperty = this.audioResources.get(guild.id)?.volume;

		if (audioResourceVolumeProperty) {
			audioResourceVolumeProperty.setVolumeLogarithmic(setPercent / 100);

			return true;
		}

		return false;
	}

	/**
	 * Create and cache the audio player.
	 */
	createAudioPlayer(guild: Guild, voiceConnectionToSubscribe: VoiceConnection): AudioPlayer {
		const audioPlayer = createAudioPlayer()
			.setMaxListeners(2)
			.on('stateChange', (oldState, newState) => {
				console.info(`🎵 Audio player update for guild "${guild.name}": ${oldState.status} -> ${newState.status}.`);
			});

		this.audioPlayers.set(guild.id, audioPlayer);
		voiceConnectionToSubscribe.subscribe(audioPlayer);

		return audioPlayer;
	}

	getAudioResource(guild: Guild): AudioResource | undefined {
		return this.audioResources.get(guild.id);
	}

	setAudioResource(guild: Guild, audioResource: AudioResource): void {
		this.audioResources.set(guild.id, audioResource);
	}

	/**
	 * This function will join the voice channel and handles the new voice session.
	 *
	 * The return value of resolver() must be an async generator function which will yield the next audio resource.
	 * If no audio resource is yielded/returned, it is assumed the session is over and the voice connection will be destroyed.
	 */
	async startVoiceSession({
		guild,
		voiceBasedChannel,
		nextAudioResourceResolver
	}: {
		guild: Guild;
		voiceBasedChannel: VoiceBasedChannel;
		nextAudioResourceResolver: () => AsyncGenerator<AudioResource, void>;
	}): Promise<boolean> {
		const voiceConnection = this.createVoiceConnection(guild, voiceBasedChannel);
		const audioPlayer = this.createAudioPlayer(guild, voiceConnection);
		const resolverGenerator = nextAudioResourceResolver();

		const resolveNextAudioResource = async (): Promise<boolean> => {
			const { value: nextAudioResource } = await resolverGenerator.next();

			if (!nextAudioResource) {
				this.destroyConnection(guild.id);

				return false;
			}

			this.setAudioResource(guild, nextAudioResource);
			this.setAudioResourceVolume(guild, await this.guildVolume(guild));

			audioPlayer.play(nextAudioResource);

			return true;
		};

		const hasFirstResource = await resolveNextAudioResource();

		if (hasFirstResource) {
			this.onVoiceIdle(audioPlayer, resolveNextAudioResource);
		}

		return hasFirstResource;
	}
}
