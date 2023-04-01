import {
	AudioPlayer,
	AudioPlayerStatus,
	AudioResource,
	createAudioPlayer,
	joinVoiceChannel,
	VoiceConnection,
	VoiceConnectionStatus
} from '@discordjs/voice';
import { ConstantsTypes, VOICE_CONNECTION_SIGNALS } from '@yt-bot/constants';
import { Guild, VoiceBasedChannel } from 'discord.js';
import { injectable } from 'tsyringe';

@injectable()
export class VoiceService {
	static voiceConnections = new Map<Guild['id'], VoiceConnection>();

	static audioPlayers = new Map<Guild['id'], AudioPlayer>();

	/**
	 * Get an audio player that has at least one subscribed connection
	 */
	getActiveAudioPlayer(guildId: Guild['id']): AudioPlayer | undefined {
		const currentAudioPlayer = VoiceService.audioPlayers.get(guildId);

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
		const potentialVoiceConnection = VoiceService.voiceConnections.get(guildId);

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

		VoiceService.voiceConnections.set(guild.id, voiceConnection);

		return voiceConnection;
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

		VoiceService.audioPlayers.set(guild.id, audioPlayer);
		voiceConnectionToSubscribe.subscribe(audioPlayer);

		return audioPlayer;
	}

	/**
	 * This function will join the voice channel and handles the new voice session.
	 *
	 * The return value of resolveAudioResource() tells the bot what to play both at the start of the voice connection and when the voice goes idle
	 * (basically, when the audio ends).
	 */
	async startVoiceSession({
		guild,
		voiceBasedChannel,
		resolveAudioResource,
		disconnectOnFirstIdle = false
	}: {
		guild: Guild;
		voiceBasedChannel: VoiceBasedChannel;
		resolveAudioResource: () => Promise<AudioResource | ConstantsTypes.VoiceConnectionSignals>;
		disconnectOnFirstIdle?: boolean;
	}): Promise<{ voiceConnection: VoiceConnection; audioPlayer: AudioPlayer } | null> {
		const resolveAudioResourceResult = await resolveAudioResource();

		if (!(resolveAudioResourceResult instanceof AudioResource)) {
			return null;
		}

		const voiceConnection = this.createVoiceConnection(guild, voiceBasedChannel);
		const audioPlayer = this.createAudioPlayer(guild, voiceConnection);

		audioPlayer.play(resolveAudioResourceResult);

		const onVoiceIdleFn = async (): Promise<void> => {
			if (disconnectOnFirstIdle) {
				console.info(`🟨 Disconnect on first idle for guild ${guild.name}.`);

				return this.destroyConnection(guild.id);
			}

			const resolveAudioResourceOnIdleResult = await resolveAudioResource();

			if (resolveAudioResourceOnIdleResult === VOICE_CONNECTION_SIGNALS.DISCONNECT) {
				console.info(`🟨 Signal disconnect received for guild ${guild.name}.`);

				return this.destroyConnection(guild.id);
			}

			if (resolveAudioResourceOnIdleResult === VOICE_CONNECTION_SIGNALS.COMPLETE) {
				console.info(`🟨 Signal complete received for guild ${guild.name}.`);

				return onVoiceIdleFn();
			}

			this.getActiveAudioPlayer(guild.id)?.play(resolveAudioResourceOnIdleResult);
		};

		this.onVoiceIdle(audioPlayer, onVoiceIdleFn);

		return { voiceConnection, audioPlayer };
	}
}
