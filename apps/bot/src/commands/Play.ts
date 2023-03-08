import { createAudioPlayer, joinVoiceChannel } from '@discordjs/voice';
import { t } from '@yt-bot/i18n';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { LANG } from '../langpacks';
import { BotService } from '../services';
import { YouTubeService } from '../services/YouTubeService';
import { ICommand } from '../types/ICommand';

const COMMAND = LANG.COMMANDS.PLAY;

@injectable()
export class Play implements ICommand {
	constructor(public botService: BotService, public youtubeService: YouTubeService) {}

	definition = new SlashCommandBuilder()
		.setName(COMMAND.NAME)
		.setDescription(COMMAND.DESC)
		.addStringOption((option) =>
			option.setName(COMMAND.OPTION.RESOURCE.NAME).setDescription(COMMAND.OPTION.RESOURCE.DESC).setRequired(true)
		)
		.setDMPermission(false);

	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		try {
			const commandAuthor = interaction.member;
			const commandAuthorVoiceChannel = commandAuthor.voice.channel;

			if (!commandAuthorVoiceChannel?.id) {
				return void interaction.reply({
					content: COMMAND.ERROR.NO_VOICE_CONN,
					ephemeral: true
				});
			}

			const commandAuthorCanSpeak = commandAuthorVoiceChannel.permissionsFor(commandAuthor).has('Speak');

			if (!commandAuthorCanSpeak) {
				return void interaction.reply({
					content: COMMAND.ERROR.NO_VOICE_PERM,
					ephemeral: true
				});
			}

			const resource = interaction.options.getString('resource', true);
			const [url] = this.youtubeService.getVideoUrls(resource);

			if (!url) {
				return void interaction.reply({
					content: COMMAND.ERROR.INVALID_RESOURCE,
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

			this.botService.onVoiceIdle(audioPlayer, () => {
				botVoiceConnection.destroy();

				console.log(`🟨 Voice connection destroyed for guild ${interaction.guild.name}.`);
			});

			audioPlayer.play(stream);

			interaction.reply(t(COMMAND.RESPONSE.SUCCESS, { title: info.videoDetails.title }));
		} catch (error) {
			console.error(error);

			interaction.replied
				? interaction.editReply(COMMAND.ERROR.INTERNAL_ERROR)
				: interaction.reply(COMMAND.ERROR.INTERNAL_ERROR);
		}
	}
}
