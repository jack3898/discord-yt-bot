import { getVoiceConnection } from '@discordjs/voice';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { LANG } from '../langpacks';
import { BotService } from '../services';
import { ICommand } from '../types/ICommand';

const COMMAND = LANG.COMMANDS.STOP;

@injectable()
export class Stop implements ICommand {
	constructor(public botService: BotService) {}

	definition = new SlashCommandBuilder().setName(COMMAND.NAME).setDescription(COMMAND.DESC).setDMPermission(false);

	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		try {
			const botVoiceConnection = getVoiceConnection(interaction.guildId);

			if (!botVoiceConnection) {
				return void interaction.reply({
					content: COMMAND.ERROR.NOT_PLAYING,
					ephemeral: true
				});
			}

			const commandAuthor = interaction.member;
			const commandAuthorVoiceChannel = commandAuthor.voice.channel;
			const botVoiceChannelId = botVoiceConnection.joinConfig.channelId;

			if (commandAuthorVoiceChannel?.id !== botVoiceChannelId) {
				return void interaction.reply({
					content: COMMAND.ERROR.INVALID_CHANNEL,
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

			botVoiceConnection.destroy();

			interaction.reply(COMMAND.RESPONSE.SUCCESS);
		} catch (error) {
			console.error(error);

			interaction.replied
				? interaction.editReply(COMMAND.ERROR.INTERNAL_ERROR)
				: interaction.reply(COMMAND.ERROR.INTERNAL_ERROR);
		}
	}
}
