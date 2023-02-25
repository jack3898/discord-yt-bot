import { ConstantsTypes, ENTITY_TYPES, RESOURCE_TYPES } from '@yt-bot/constants';
import { t } from '@yt-bot/i18n';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { LANG } from '../langpacks';
import { BotService, DatabaseService, QueueService, ShardManagerService } from '../services';
import { YouTubeService } from '../services/YouTubeService';
import { ICommand } from '../types/ICommand';

const COMMAND = LANG.COMMANDS.ENQUEUE;

@injectable()
export class Enqueue implements ICommand {
	constructor(
		public botService: BotService,
		public shardManagerService: ShardManagerService,
		public dbService: DatabaseService,
		public youtubeService: YouTubeService,
		public queueService: QueueService
	) {}

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
				.addChoices({
					name: COMMAND.OPTION.TARGET.CHOICES.DEFAULT,
					value: ENTITY_TYPES.EPHEMERAL
				})
				.setRequired(false)
		);

	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		try {
			const resource = interaction.options.getString(COMMAND.OPTION.RESOURCE.NAME, true);
			const [video] = await this.youtubeService.getVideoInfos(resource);

			if (!video) {
				return void interaction.reply({
					content: COMMAND.ERROR.INVALID_RESOURCE,
					ephemeral: true
				});
			}

			const entityType = interaction.options.getString(COMMAND.OPTION.TARGET.NAME) || ENTITY_TYPES.EPHEMERAL;
			const [dbUser, dbGuild] = await this.dbService.createEntitiesIfNotExists({
				userId: interaction.user.id,
				guildId: interaction.guildId
			});

			const entityTranslation = {
				[ENTITY_TYPES.EPHEMERAL]: {
					entity: undefined,
					feedback: COMMAND.DESTINATIONS.DEFAULT
				},
				[ENTITY_TYPES.GUILD]: {
					entity: dbGuild,
					feedback: COMMAND.DESTINATIONS.SERVER
				},
				[ENTITY_TYPES.USER]: {
					entity: dbUser,
					feedback: COMMAND.DESTINATIONS.USER
				}
			}[entityType];

			await this.queueService.addItemToQueue(
				video.videoDetails.videoId,
				entityType as ConstantsTypes.EntityType,
				RESOURCE_TYPES.YOUTUBE_VIDEO,
				entityTranslation?.entity
			);

			await interaction.reply(
				t(COMMAND.RESPONSE.SUCCESS, {
					title: video.videoDetails.title,
					destination: entityTranslation?.feedback
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
