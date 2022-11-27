import { createAudioPlayer } from '@discordjs/voice';
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
			const guildMember = interaction.member;
			const voiceChannel = guildMember.voice.channel;

			if (!voiceChannel?.id) {
				return void interaction.reply({
					content: 'You must be connected to a voice channel to use this command.',
					ephemeral: true
				});
			}

			const commandAuthorCanSpeak = voiceChannel.permissionsFor(guildMember).has('Speak');

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

			const voiceConnection = this.botService.joinVoiceChannel({
				guildId: interaction.guildId,
				channelId: voiceChannel.id,
				adapterCreator: voiceChannel.guild.voiceAdapterCreator
			});

			const stream = await this.youtubeService.createAudioResourceFromUrl(url);
			const [info] = await this.youtubeService.getVideoInfos(url);
			const player = createAudioPlayer();

			voiceConnection.subscribe(player);

			player.play(stream);

			interaction.reply(`Now playing \`${info.videoDetails.title}\``);
		} catch (error) {
			console.error(error);

			const message =
				'There was an internal server problem. There is a chance this is because the video is private or age restricted.';

			interaction.replied ? interaction.editReply(message) : interaction.reply(message);
		}
	}
}
