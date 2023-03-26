import {
	AudioPlayer,
	AudioPlayerStatus,
	AudioResource,
	createAudioPlayer,
	joinVoiceChannel,
	VoiceConnection
} from '@discordjs/voice';
import { ConstantsTypes, VOICE_CONNECTION_SIGNALS } from '@yt-bot/constants';
import { Guild, VoiceBasedChannel } from 'discord.js';
import { injectable } from 'tsyringe';

@injectable()
export class VoiceService {
	private static readonly voiceCache = new Map<
		Guild['id'],
		{ voiceConnection: VoiceConnection; audioPlayer: AudioPlayer }
	>();

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

	joinVoice(
		guild: Guild,
		voiceBasedChannel: VoiceBasedChannel
	): { audioPlayer: AudioPlayer; voiceConnection: VoiceConnection } {
		const voiceConnection = joinVoiceChannel({
			guildId: guild.id,
			channelId: voiceBasedChannel.id,
			adapterCreator: guild.voiceAdapterCreator
		});

		const audioPlayer = createAudioPlayer();

		audioPlayer.setMaxListeners(1);

		VoiceService.voiceCache.set(guild.id, { voiceConnection, audioPlayer });
		voiceConnection.subscribe(audioPlayer);

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
		resolveAudioResource
	}: {
		guild: Guild;
		voiceBasedChannel: VoiceBasedChannel;
		resolveAudioResource: () => Promise<AudioResource | ConstantsTypes.VoiceConnectionSignals>;
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

		this.onVoiceIdle(audioPlayer, playNextQueueItem);
	}
}
