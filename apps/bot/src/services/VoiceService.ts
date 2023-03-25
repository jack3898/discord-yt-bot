import {
	AudioPlayer,
	AudioPlayerStatus,
	AudioResource,
	createAudioPlayer,
	joinVoiceChannel,
	VoiceConnection
} from '@discordjs/voice';
import { Guild, VoiceBasedChannel } from 'discord.js';
import { injectable } from 'tsyringe';

@injectable()
export class VoiceService {
	private static readonly audioPlayers = new Map<Guild['id'], AudioPlayer>();

	/**
	 * Get an audio player that has at least one subscribed connection
	 */
	getActiveAudioPlayer(guildId: Guild['id']): AudioPlayer | undefined {
		const audioPlayer = VoiceService.audioPlayers.get(guildId);

		if (audioPlayer?.playable.length) {
			return audioPlayer;
		}
	}

	// Do not worry! Does not cause a memory leak
	// Unless the console.log is ran two or more times for a single connection 🤔
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
		voiceChannel: VoiceBasedChannel
	): { audioPlayer: AudioPlayer; voiceConnection: VoiceConnection } {
		const voiceConnection = joinVoiceChannel({
			guildId: guild.id,
			channelId: voiceChannel.id,
			adapterCreator: guild.voiceAdapterCreator
		});

		const audioPlayer = createAudioPlayer();

		VoiceService.audioPlayers.set(guild.id, audioPlayer);
		voiceConnection.subscribe(audioPlayer);

		return { audioPlayer, voiceConnection };
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
		resolveAudioResource: () => Promise<AudioResource | 'DISCONNECT'>;
	}) {
		const { audioPlayer, voiceConnection } = this.joinVoice(guild, voiceBasedChannel);

		async function playNextQueueItem() {
			const nextResource = await resolveAudioResource();

			if (nextResource === 'DISCONNECT' || !nextResource) {
				return void voiceConnection.destroy();
			}

			audioPlayer.play(nextResource);
		}

		playNextQueueItem();

		this.onVoiceIdle(audioPlayer, playNextQueueItem);
	}
}
