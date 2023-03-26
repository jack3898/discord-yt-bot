import { ENTITY_TYPES, RESOURCE_TYPES, VOICE_CONNECTION_SIGNALS } from '@yt-bot/constants';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { LANG } from '../langpacks';
import { QueueService, VoiceService } from '../services';
import { YouTubeService } from '../services/YouTubeService';
import { ICommand } from '../types/ICommand';

const COMMAND = LANG.COMMANDS.PLAY;

@injectable()
export class Play implements ICommand {
	constructor(
		private voiceService: VoiceService,
		private youtubeService: YouTubeService,
		private queueService: QueueService
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

			await this.voiceService.startVoiceSession({
				guild: interaction.guild,
				voiceBasedChannel: commandAuthorVoiceChannel,
				resolveAudioResource: async () => {
					const resource = await this.getResource(interaction, type);

					if (!resource) {
						return VOICE_CONNECTION_SIGNALS.DISCONNECT;
					}

					const [url] = this.youtubeService.getVideoUrls(resource);

					if (!url) {
						return VOICE_CONNECTION_SIGNALS.DISCONNECT;
					}

					return this.youtubeService.createAudioResourceFromUrl(url);
				}
			});

			!interaction.replied && (await interaction.reply(COMMAND.RESPONSE.SUCCESS));
		} catch (error) {
			console.error(error);

			interaction.replied
				? interaction.editReply(COMMAND.ERROR.INTERNAL_ERROR)
				: interaction.reply(COMMAND.ERROR.INTERNAL_ERROR);
		}
	}

	/**
	 * Get the resource by a type flag.
	 *
	 * If the type is search, then it will get the resource name provided by the user's slash command input.
	 * Else, it will query the database to find the next item in the queue.
	 */
	async getResource(interaction: ChatInputCommandInteraction<'cached'>, type: string): Promise<string | null> {
		switch (type) {
			case 'search': {
				return interaction.options.getString(COMMAND.OPTION.RESOURCE.NAME) || null;
			}
			case ENTITY_TYPES.GUILD: {
				const nextItem = await this.queueService.getNextQueueItem(
					RESOURCE_TYPES.YOUTUBE_VIDEO,
					interaction.guild.id
				);

				if (nextItem) {
					await this.queueService.setExpired(nextItem.id);
				}

				return nextItem?.resource.resource || null;
			}
			case ENTITY_TYPES.USER: {
				const nextItem = await this.queueService.getNextQueueItem(
					RESOURCE_TYPES.YOUTUBE_VIDEO,
					interaction.guild.id,
					interaction.member.id
				);

				if (nextItem) {
					await this.queueService.setExpired(nextItem.id);
				}

				return nextItem?.resource.resource || null;
			}
			default: {
				return null;
			}
		}
	}
}
