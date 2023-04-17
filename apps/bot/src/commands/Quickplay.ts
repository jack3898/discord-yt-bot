import { BotService, VoiceService, YouTubeService } from '../services';
import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { ICommand } from '../types/ICommand';
import { LANG } from '../langpacks';
import type { InfoData as PlaydlInfoData } from 'play-dl';
import { injectable } from 'tsyringe';
import { t } from '@yt-bot/i18n';

const COMMAND = LANG.COMMANDS.QUICKPLAY;

@injectable()
export class Quickplay implements ICommand {
	constructor(
		private voiceService: VoiceService,
		private youtubeService: YouTubeService,
		private botService: BotService
	) {}

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

			const resource = interaction.options.getString(COMMAND.OPTION.RESOURCE.NAME, true);
			const urls = await this.youtubeService.getVideoUrls(resource);

			const startVoiceSessionResult = await this.voiceService.startVoiceSession({
				guild: interaction.guild,
				voiceBasedChannel: commandAuthorVoiceChannel,
				nextAudioResourceResolver: async function* (this: Quickplay) {
					for (const url of urls) {
						if (!url) {
							return;
						}

						const audioResource = await this.youtubeService.createAudioResourceFromUrl(url);

						if (!audioResource) {
							continue; // There was a problem just move on
						}

						yield audioResource;
					}
				}.bind(this)
			});

			const info = await this.youtubeService.getVideoInfos(urls[0] || '');

			if (startVoiceSessionResult && info?.[0]) {
				const successEmbed = this.createVideoDetailsEmbed(info[0], urls.length);

				return await interaction.reply({
					embeds: [successEmbed]
				});
			}

			return interaction.reply({
				content: COMMAND.ERROR.INVALID_RESOURCE,
				ephemeral: true
			});
		} catch (error) {
			console.error(error);

			interaction.replied
				? interaction.editReply(COMMAND.ERROR.INTERNAL_ERROR)
				: interaction.reply(COMMAND.ERROR.INTERNAL_ERROR);
		}
	}

	createVideoDetailsEmbed({ video_details: videoDetails }: PlaydlInfoData, videoCount: number) {
		const EMBED = COMMAND.RESPONSE.SUCCESS_EMBED;

		return new EmbedBuilder()
			.setTitle(t(EMBED.TITLE, { title: videoDetails.title }))
			.setImage(videoDetails.thumbnails[0].url)
			.setURL(videoDetails.url)
			.setDescription(
				(() => {
					// Truncate the description, but preserve whole sentences instead of clipping text at a fixed length.
					// Also remove pesky links! Video information is more useful to the user of the bot than bloaty ads and sponsorship links.
					const segments = Array.from(
						this.botService.formatters.sentenceSegmenter.segment(videoDetails.description || '')
					)
						.map(({ segment }) => segment)
						.filter((segment) => !segment.includes('http'));

					segments.length = 30;

					return segments.join('').replace(/\n{2,}/g, '\n\n');
				})() || null
			)
			.setFooter({
				text: t(EMBED.FOOTER, {
					views: this.botService.formatters.numberFormat.format(videoDetails.views),
					duration:
						videoDetails.durationInSec === 0
							? COMMAND.RESPONSE.SUCCESS_EMBED.LIVE_DURATION
							: videoDetails.durationRaw,
					channel: videoDetails.channel?.name,
					uploaded:
						videoDetails.uploadedAt &&
						this.botService.formatters.dateTimeFormat.format(new Date(videoDetails.uploadedAt)),
					additionalinfo:
						videoCount > 1 ? t(EMBED.FOOTER_OF_PLAYLIST, { count: videoCount }) : EMBED.FOOTER_OF_VIDEO
				})
			});
	}
}
