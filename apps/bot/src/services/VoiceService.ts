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

type VoiceCacheValue = { voiceConnection: VoiceConnection; audioPlayer: AudioPlayer };

@injectable()
export class VoiceService {
	private static readonly voiceCache = new Map<Guild['id'], VoiceCacheValue>();

	/**
	 * Get an audio player that has at least one subscribed connection
	 */
	getActiveAudioPlayer(guildId: Guild['id']): AudioPlayer | undefined {
		const voiceCacheItem = VoiceService.voiceCache.get(guildId);

		if (voiceCacheItem?.audioPlayer.playable.length) {
			return voiceCacheItem?.audioPlayer;
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
		const potentialVoiceConnection = VoiceService.voiceCache.get(guildId)?.voiceConnection;

		if (potentialVoiceConnection?.state.status !== VoiceConnectionStatus.Destroyed) {
			potentialVoiceConnection?.destroy();
		}
	}

	joinVoice(
		guild: Guild,
		voiceBasedChannel: VoiceBasedChannel
	): { audioPlayer: AudioPlayer; voiceConnection: VoiceConnection } {
		// Prevent duplicate connections
		this.destroyConnection(guild.id);

		const voiceConnection = joinVoiceChannel({
			guildId: guild.id,
			channelId: voiceBasedChannel.id,
			adapterCreator: guild.voiceAdapterCreator
		});

		const audioPlayer = createAudioPlayer().setMaxListeners(2);

		VoiceService.voiceCache.set(guild.id, { voiceConnection, audioPlayer });
		voiceConnection.subscribe(audioPlayer);

		voiceConnection.on('stateChange', (oldState, newState) => {
			console.info(`📶 Voice status update for guild "${guild.name}": ${oldState.status} -> ${newState.status}`);
		});

		audioPlayer.on('stateChange', (oldState, newState) => {
			console.info(`🎵 Audio player update for guild "${guild.name}": ${oldState.status} -> ${newState.status}`);
		});

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return VoiceService.voiceCache.get(guild.id)!;
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
		disconnectOnIdle = false
	}: {
		guild: Guild;
		voiceBasedChannel: VoiceBasedChannel;
		resolveAudioResource: () => Promise<AudioResource | ConstantsTypes.VoiceConnectionSignals>;
		disconnectOnIdle?: boolean;
	}) {
		const { audioPlayer, voiceConnection } = this.joinVoice(guild, voiceBasedChannel);

		async function playNextQueueItem() {
			const nextResource = await resolveAudioResource();

			if (nextResource === VOICE_CONNECTION_SIGNALS.DISCONNECT || !nextResource) {
				return void voiceConnection.destroy();
			}

			// Prevents the 'signalling' state that seems to happen after a while
			// (seems to happen when audioPlayer.play has been invoked more than once for a single connection)
			voiceConnection.configureNetworking();

			audioPlayer.play(nextResource);
		}

		await playNextQueueItem();

		this.onVoiceIdle(audioPlayer, () => {
			if (disconnectOnIdle) {
				this.destroyConnection(guild.id);
			} else {
				playNextQueueItem();
			}
		});
	}
}
