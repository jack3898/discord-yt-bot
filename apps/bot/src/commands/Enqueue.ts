import type { CommandInteraction, ICommand } from '../types';
import { ENTITY_TYPES, RESOURCE_TYPES } from '@yt-bot/constants';
import { LANG } from '../langpacks';
import { QueueService } from '../services';
import { SlashCommandBuilder } from 'discord.js';
import { YouTubeService } from '../services/YouTubeService';
import { injectable } from 'tsyringe';
import { t } from '@yt-bot/i18n';

const COMMAND = LANG.COMMANDS.ENQUEUE;

@injectable()
export class Enqueue implements ICommand {
	constructor(private youtubeService: YouTubeService, private queueService: QueueService) {}

	definition = new SlashCommandBuilder()
		.setName(COMMAND.NAME)
		.setDescription(COMMAND.DESC)
		.addStringOption((option) =>
			option.setName(COMMAND.OPTION.RESOURCE.NAME).setDescription(COMMAND.OPTION.RESOURCE.DESC).setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName(COMMAND.OPTION.TARGET.NAME)
				.setDescription(COMMAND.OPTION.TARGET.DESC)
				.setChoices()
				.addChoices({
					name: COMMAND.OPTION.TARGET.CHOICES.SERVER,
					value: ENTITY_TYPES.GUILD
				})
				.addChoices({
					name: COMMAND.OPTION.TARGET.CHOICES.USER,
					value: ENTITY_TYPES.USER
				})
				.setRequired(false)
		);

	async execute(interaction: CommandInteraction) {
		try {
			const resource = interaction.options.getString(COMMAND.OPTION.RESOURCE.NAME, true);
			const [{ video_details: videoDetails = null } = {}] = await this.youtubeService.getVideoInfos(resource);

			if (!videoDetails || !videoDetails?.id) {
				return void interaction.reply({
					content: COMMAND.ERROR.INVALID_RESOURCE,
					ephemeral: true
				});
			}

			const entityType = interaction.options.getString(COMMAND.OPTION.TARGET.NAME) || ENTITY_TYPES.GUILD;

			await this.queueService.addItemToQueue(
				videoDetails.id,
				RESOURCE_TYPES.YOUTUBE_VIDEO,
				interaction.member.id,
				entityType === ENTITY_TYPES.GUILD ? interaction.guild.id : undefined
			);

			await interaction.reply(
				t(COMMAND.RESPONSE.SUCCESS, {
					title: videoDetails.title
				})
			);
		} catch (error) {
			console.error(error);

			interaction.replied
				? interaction.editReply(COMMAND.ERROR.INTERNAL_ERROR)
				: interaction.reply(COMMAND.ERROR.INTERNAL_ERROR);
		}
	}
}
