import { ENTITY_TYPES, RESOURCE_TYPES } from '@yt-bot/constants';
import { t } from '@yt-bot/i18n';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { LANG } from '../langpacks';
import { DatabaseService, VoiceService } from '../services';
import { YouTubeService } from '../services/YouTubeService';
import { ICommand } from '../types/ICommand';

const COMMAND = LANG.COMMANDS.PLAY;

@injectable()
export class Play implements ICommand {
	constructor(
		public voiceService: VoiceService,
		public youtubeService: YouTubeService,
		public databaseService: DatabaseService
	) {}

	definition = new SlashCommandBuilder()
		.setName(COMMAND.NAME)
		.setDescription(COMMAND.DESC)
		.addStringOption((option) =>
			option
				.setName(COMMAND.OPTION.TYPE.NAME)
				.setDescription(COMMAND.OPTION.TYPE.DESC)
				.addChoices({ name: COMMAND.OPTION.TYPE.OPTIONS.SEARCH, value: 'search' })
				.addChoices({ name: COMMAND.OPTION.TYPE.OPTIONS.SERVER_QUEUE, value: ENTITY_TYPES.GUILD })
				.addChoices({ name: COMMAND.OPTION.TYPE.OPTIONS.YOUR_QUEUE, value: ENTITY_TYPES.USER })
				.setRequired(true)
		)
		.addStringOption((option) =>
			option.setName(COMMAND.OPTION.RESOURCE.NAME).setDescription(COMMAND.OPTION.RESOURCE.DESC)
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

			const type = interaction.options.getString(COMMAND.OPTION.TYPE.NAME, true);

			switch (type) {
				case 'search': {
					const resource = interaction.options.getString(COMMAND.OPTION.RESOURCE.NAME);

					if (!resource) {
						return void interaction.reply({
							content: COMMAND.ERROR.INTERNAL_ERROR,
							ephemeral: true
						});
					}

					const [url] = this.youtubeService.getVideoUrls(resource);

					if (!url) {
						return void interaction.reply({
							content: COMMAND.ERROR.INVALID_RESOURCE,
							ephemeral: true
						});
					}

					const { audioPlayer, voiceConnection } = this.voiceService.joinVoice(
						commandAuthor.guild,
						commandAuthorVoiceChannel
					);

					const stream = await this.youtubeService.createAudioResourceFromUrl(url);
					const [info] = await this.youtubeService.getVideoInfos(url);

					this.voiceService.onVoiceIdle(audioPlayer, () => {
						voiceConnection.destroy();

						console.log(`🟨 Voice connection destroyed for guild ${interaction.guild.name}.`);
					});

					audioPlayer.play(stream);

					interaction.reply(t(COMMAND.RESPONSE.SUCCESS, { title: info.videoDetails.title }));

					break;
				}
				case ENTITY_TYPES.GUILD: {
					const resource = await this.databaseService.queue.findFirst({
						where: {
							discordGuildId: commandAuthor.guild.id,
							resource: {
								resourceType: {
									name: RESOURCE_TYPES.YOUTUBE_VIDEO
								}
							},
							expired: false
						}
					});

					await interaction.reply({
						content: JSON.stringify(resource)
					});

					break;
				}
				case ENTITY_TYPES.USER: {
					break;
				}
			}
		} catch (error) {
			console.error(error);

			interaction.replied
				? interaction.editReply(COMMAND.ERROR.INTERNAL_ERROR)
				: interaction.reply(COMMAND.ERROR.INTERNAL_ERROR);
		}
	}
}
