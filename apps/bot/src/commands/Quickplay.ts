import { VOICE_CONNECTION_SIGNALS } from '@yt-bot/constants';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { LANG } from '../langpacks';
import { VoiceService, YouTubeService } from '../services';
import { ICommand } from '../types/ICommand';

const COMMAND = LANG.COMMANDS.QUICKPLAY;

@injectable()
export class Quickplay implements ICommand {
	constructor(private voiceService: VoiceService, private youtubeService: YouTubeService) {}

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

			const startVoiceSessionResult = await this.voiceService.startVoiceSession({
				guild: interaction.guild,
				voiceBasedChannel: commandAuthorVoiceChannel,
				disconnectOnFirstIdle: true,
				resolveAudioResource: async () => {
					const resource = interaction.options.getString(COMMAND.OPTION.RESOURCE.NAME, true);
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

			interaction.reply({
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
