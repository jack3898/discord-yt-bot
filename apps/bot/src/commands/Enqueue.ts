import { ENTITY_TYPES, RESOURCE_TYPES } from '@yt-bot/constants';
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

			const [, dbGuild] = await this.dbService.createEntitiesIfNotExists(interaction.user.id, interaction.guildId);

			await this.queueService.addItemToQueue(
				video.videoDetails.videoId,
				dbGuild,
				ENTITY_TYPES.GUILD,
				RESOURCE_TYPES.YOUTUBE_VIDEO
			);

			await interaction.reply(`Added \`${video.videoDetails.title}\` to the server queue.`);
		} catch (error) {
			console.error(error);

			const message = 'There was an internal server problem.';

			interaction.replied ? interaction.editReply(message) : interaction.reply(message);
		}
	}
}
