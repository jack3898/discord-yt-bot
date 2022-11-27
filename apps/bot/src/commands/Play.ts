import { AudioPlayerStatus, createAudioPlayer, joinVoiceChannel } from '@discordjs/voice';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { BotService } from '../services';
import { YouTubeService } from '../services/YouTubeService';
import { ICommand } from '../types/ICommand';

@injectable()
export class Play implements ICommand {
	constructor(public botService: BotService, public youtubeService: YouTubeService) {}

	definition = new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play an audio resource in a voice channel you are connected to.')
		.addStringOption((option) =>
			option.setName('resource').setDescription('A YouTube video URL or ID.').setRequired(true)
		)
		.setDMPermission(false);

	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		try {
			const commandAuthor = interaction.member;
			const commandAuthorVoiceChannel = commandAuthor.voice.channel;

			if (!commandAuthorVoiceChannel?.id) {
				return void interaction.reply({
					content: 'You must be connected to a voice channel to use this command.',
					ephemeral: true
				});
			}

			const commandAuthorCanSpeak = commandAuthorVoiceChannel.permissionsFor(commandAuthor).has('Speak');

			if (!commandAuthorCanSpeak) {
				return void interaction.reply({
					content: 'You do not have voice permission for this voice channel.',
					ephemeral: true
				});
			}

			const resource = interaction.options.getString('resource', true);
			const [url] = this.youtubeService.getVideoUrls(resource);

			if (!url) {
				return void interaction.reply({
					content: 'The provided resource is invalid.',
					ephemeral: true
				});
			}

			const botVoiceConnection = joinVoiceChannel({
				guildId: interaction.guildId,
				channelId: commandAuthorVoiceChannel.id,
				adapterCreator: commandAuthorVoiceChannel.guild.voiceAdapterCreator
			});

			const stream = await this.youtubeService.createAudioResourceFromUrl(url);
			const [info] = await this.youtubeService.getVideoInfos(url);
			const audioPlayer = createAudioPlayer();

			botVoiceConnection.subscribe(audioPlayer);

			// Do not worry! Does not cause a memory leak
			// Unless the console.log is ran two or more times for a single connection 🤔
			audioPlayer.on('stateChange', (oldState, newState) => {
				const wasPlaying = oldState.status === AudioPlayerStatus.Playing;
				const isIdle = newState.status === AudioPlayerStatus.Idle;

				if (wasPlaying && isIdle) {
					botVoiceConnection.destroy();

					console.log(`🟨 Voice connection destroyed for guild ${interaction.guild.name}.`);
				}
			});

			audioPlayer.play(stream);

			interaction.reply(`Now playing \`${info.videoDetails.title}\``);
		} catch (error) {
			console.error(error);

			const message =
				'There was an internal server problem. There is a chance this is because the video is private or age restricted.';

			interaction.replied ? interaction.editReply(message) : interaction.reply(message);
		}
	}
}
