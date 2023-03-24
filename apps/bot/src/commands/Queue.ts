import { t } from '@yt-bot/i18n';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { LANG } from '../langpacks';
import { BotService, DatabaseService } from '../services';
import { YouTubeService } from '../services/YouTubeService';
import { ICommand } from '../types/ICommand';

const COMMAND = LANG.COMMANDS.QUEUE;

@injectable()
export class Queue implements ICommand {
	constructor(
		private botService: BotService,
		private dbService: DatabaseService,
		private youtubeService: YouTubeService
	) {}

	definition = new SlashCommandBuilder().setName(COMMAND.NAME).setDescription(COMMAND.DESC);

	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		const guildId = interaction.guildId;

		await this.dbService.createEntitiesIfNotExists({ userId: interaction.member.id, guildId });

		const queueLen = 10;

		const queue = await this.dbService.queue.findMany({
			where: { discordGuildId: guildId },
			select: { resource: { select: { resource: true } } },
			take: queueLen
		});

		const count = await this.dbService.queue.count({
			where: { discordGuildId: guildId }
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
					resources.map((item, index) => ({
						name: t(COMMAND.RESPONSE.SUCCESS_EMBED.ITEM_TITLE, {
							index: index + 1,
							videotitle: item.videoDetails.title
						}),
						value: t(COMMAND.RESPONSE.SUCCESS_EMBED.ITEM_DETAILS, {
							channel: item.videoDetails.author.name,
							channelurl: item.videoDetails.author.channel_url,
							views: this.botService.formatters.numberFormat.format(+item.videoDetails.viewCount),
							videourl: item.videoDetails.video_url
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
