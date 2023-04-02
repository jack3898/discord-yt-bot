import { BotService, DatabaseService, QueueService } from '../services';
import type { CommandInteraction, ICommand } from '../types';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { LANG } from '../langpacks';
import { YouTubeService } from '../services/YouTubeService';
import { injectable } from 'tsyringe';
import { t } from '@yt-bot/i18n';

const COMMAND = LANG.COMMANDS.MYQUEUE;

@injectable()
export class Myqueue implements ICommand {
	constructor(
		private botService: BotService,
		private dbService: DatabaseService,
		private queueService: QueueService,
		private youtubeService: YouTubeService
	) {}

	definition = new SlashCommandBuilder().setName(COMMAND.NAME).setDescription(COMMAND.DESC);

	async execute(interaction: CommandInteraction) {
		const userId = interaction.user.id;

		const queueLen = 10;

		const queue = await this.queueService.getQueue(interaction.user.id);

		const count = await this.dbService.queue.count({
			where: { discordUserId: userId }
		});

		const resourcePromises = queue.map(async (queueItem) => {
			const [info] = await this.youtubeService.getVideoInfos(queueItem.resource.resource);

			return info;
		});

		const resources = await Promise.all(resourcePromises);

		const messageEmbed = new EmbedBuilder().setTitle(COMMAND.RESPONSE.SUCCESS_EMBED.TITLE);

		if (resources.length) {
			messageEmbed
				.addFields(
					resources.map(({ video_details: videoDetails }, index) => ({
						name: t(COMMAND.RESPONSE.SUCCESS_EMBED.ITEM_TITLE, {
							index: index + 1,
							videotitle: videoDetails.title
						}),
						value: t(COMMAND.RESPONSE.SUCCESS_EMBED.ITEM_DETAILS, {
							channel: videoDetails.channel?.name,
							channelurl: videoDetails.channel?.url,
							views: this.botService.formatters.numberFormat.format(+videoDetails.views),
							videourl: videoDetails.url
						})
					}))
				)
				.setFooter({
					text: t(COMMAND.RESPONSE.SUCCESS_EMBED.FOOTER, {
						defaultcount: this.botService.formatters.numberFormat.format(queueLen),
						count
					})
				});
		} else {
			messageEmbed.addFields([
				{
					name: COMMAND.RESPONSE.SUCCESS_EMBED.ITEM_TITLE_EMPTY,
					value: COMMAND.RESPONSE.SUCCESS_EMBED.ITEM_DETAILS_EMPTY
				}
			]);
		}

		interaction.reply({ embeds: [messageEmbed] });
	}
}
