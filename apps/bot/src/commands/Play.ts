import { AudioPlayer, AudioResource, VoiceConnection } from '@discordjs/voice';
import { ENTITY_TYPES, RESOURCE_TYPES } from '@yt-bot/constants';
import { ChatInputCommandInteraction, Guild, SlashCommandBuilder, VoiceBasedChannel } from 'discord.js';
import { injectable } from 'tsyringe';
import { LANG } from '../langpacks';
import { DatabaseService, QueueService, VoiceService } from '../services';
import { YouTubeService } from '../services/YouTubeService';
import { ICommand } from '../types/ICommand';

const COMMAND = LANG.COMMANDS.PLAY;

@injectable()
export class Play implements ICommand {
	constructor(
		private voiceService: VoiceService,
		private youtubeService: YouTubeService,
		private queueService: QueueService,
		private databaseService: DatabaseService
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

					this.voiceService.startVoiceSession({
						guild: interaction.guild,
						voiceBasedChannel: commandAuthorVoiceChannel,
						resolveAudioResource: async () => {
							if (!resource) {
								return 'DISCONNECT';
							}

							const [url] = this.youtubeService.getVideoUrls(resource);

							if (!url) {
								return 'DISCONNECT';
							}

							return this.youtubeService.createAudioResourceFromUrl(url);
						}
					});

					await interaction.reply(COMMAND.RESPONSE.SUCCESS);

					break;
				}
				case ENTITY_TYPES.GUILD: {
					this.voiceService.startVoiceSession({
						guild: interaction.guild,
						voiceBasedChannel: commandAuthorVoiceChannel,
						resolveAudioResource: async () => {
							const nextItem = await this.queueService.getNextQueueItem(interaction.guildId);

							if (!nextItem) {
								return 'DISCONNECT';
							}

							const [url] = this.youtubeService.getVideoUrls(nextItem.resource.resource);

							if (!url) {
								return 'DISCONNECT';
							}

							await this.queueService.setExpired(nextItem.id);

							return this.youtubeService.createAudioResourceFromUrl(url);
						}
					});

					break;
				}
				case ENTITY_TYPES.USER: {
					break;
				}
			}

			await interaction.reply(COMMAND.RESPONSE.SUCCESS);
		} catch (error) {
			console.error(error);

			interaction.replied
				? interaction.editReply(COMMAND.ERROR.INTERNAL_ERROR)
				: interaction.reply(COMMAND.ERROR.INTERNAL_ERROR);
		}
	}

	getNextQueueItem(guildId: string) {
		return this.databaseService.queue.findFirst({
			where: {
				discordGuildId: guildId,
				resource: {
					resourceType: {
						name: RESOURCE_TYPES.YOUTUBE_VIDEO
					}
				},
				expired: false
			},
			include: {
				resource: true
			}
		});
	}

	async joinAndPlayFromUrl({
		url,
		guild,
		voiceChannel,
		onVoiceIdle
	}: {
		url: string;
		guild: Guild;
		voiceChannel: VoiceBasedChannel;
		onVoiceIdle?: (audioPlayer: AudioPlayer, voiceConnection: VoiceConnection, audioResource: AudioResource) => void;
	}) {
		const { audioPlayer, voiceConnection } = this.voiceService.joinVoice(guild, voiceChannel);

		const audioResource = await this.youtubeService.createAudioResourceFromUrl(url);
		const [info] = await this.youtubeService.getVideoInfos(url);

		this.voiceService.onVoiceIdle(audioPlayer, () => {
			onVoiceIdle?.(audioPlayer, voiceConnection, audioResource);
		});

		return info;
	}
}
