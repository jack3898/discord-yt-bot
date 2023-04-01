import { ConstantsTypes, ENTITY_TYPES, RESOURCE_TYPES, VOICE_CONNECTION_SIGNALS } from '@yt-bot/constants';
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
				.addChoices({ name: COMMAND.OPTION.TYPE.OPTIONS.SERVER_QUEUE, value: ENTITY_TYPES.GUILD })
				.addChoices({ name: COMMAND.OPTION.TYPE.OPTIONS.YOUR_QUEUE, value: ENTITY_TYPES.USER })
				.setRequired(true)
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

			const playAction = interaction.options.getString(COMMAND.OPTION.TYPE.NAME, true) as ConstantsTypes.EntityType;

			const startVoiceSessionResult = await this.voiceService.startVoiceSession({
				guild: interaction.guild,
				voiceBasedChannel: commandAuthorVoiceChannel,
				disconnectOnFirstIdle: false,
				resolveAudioResource: async () => {
					const nextItem = await this.queueService.getNextQueueItem(
						RESOURCE_TYPES.YOUTUBE_VIDEO,
						interaction.guild.id,
						playAction === ENTITY_TYPES.USER ? interaction.member.id : undefined
					);

					if (nextItem) {
						await this.queueService.setExpired(nextItem.id);
					}

					const resource = nextItem?.resource.resource || null;

					if (!resource) {
						return VOICE_CONNECTION_SIGNALS.DISCONNECT;
					}

					const [url] = this.youtubeService.getVideoUrls(resource);

					if (!url) {
						return VOICE_CONNECTION_SIGNALS.DISCONNECT;
					}

					const audioResource = await this.youtubeService.createAudioResourceFromUrl(url);

					if (!audioResource) {
						return VOICE_CONNECTION_SIGNALS.COMPLETE;
					}

					return audioResource;
				}
			});

			if (startVoiceSessionResult) {
				return await interaction.reply(COMMAND.RESPONSE.SUCCESS);
			}

			await interaction.reply({
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
}
