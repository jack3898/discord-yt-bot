import { ENTITY_TYPES, RESOURCE_TYPES } from '@yt-bot/constants';
import { EntityType } from '@yt-bot/constants/src/types';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { BotService, DatabaseService, QueueService, ShardManagerService } from '../services';
import { YouTubeService } from '../services/YouTubeService';
import { ICommand } from '../types/ICommand';

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
		.setName('enqueue')
		.setDescription('Enqueue a video or playlist to a queue.')
		.addStringOption((option) =>
			option.setName('resource').setDescription('A YouTube video URL or ID.').setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('target')
				.setDescription('Where should the item go? By default it is in a temporary internal queue.')
				.setChoices()
				.addChoices({
					name: 'This server',
					value: ENTITY_TYPES.GUILD
				})
				.addChoices({
					name: 'Your profile',
					value: ENTITY_TYPES.USER
				})
				.addChoices({
					name: 'Internal (default)',
					value: ENTITY_TYPES.EPHEMERAL
				})
				.setRequired(false)
		);

	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		try {
			const resource = interaction.options.getString('resource', true);
			const [video] = await this.youtubeService.getVideoInfos(resource);

			if (!video) {
				return void interaction.reply({
					content: 'The provided resource is invalid.',
					ephemeral: true
				});
			}

			const entityType = (interaction.options.getString('target') || 'ephemeral') as EntityType;
			const [dbUser, dbGuild] = await this.dbService.createEntitiesIfNotExists(
				interaction.user.id,
				interaction.guildId
			);

			const entityTranslation = {
				[ENTITY_TYPES.EPHEMERAL]: {
					entity: undefined,
					feedback: 'a temporary'
				},
				[ENTITY_TYPES.GUILD]: {
					entity: dbGuild,
					feedback: "this server's"
				},
				[ENTITY_TYPES.USER]: {
					entity: dbUser,
					feedback: 'your'
				}
			}[entityType];

			await this.queueService.addItemToQueue(
				video.videoDetails.videoId,
				entityType,
				RESOURCE_TYPES.YOUTUBE_VIDEO,
				entityTranslation.entity
			);

			await interaction.reply(`Added \`${video.videoDetails.title}\` to ${entityTranslation.feedback} queue.`);
		} catch (error) {
			console.error(error);

			const message = 'There was an internal server problem.';

			interaction.replied ? interaction.editReply(message) : interaction.reply(message);
		}
	}
}
