import { getVoiceConnection } from '@discordjs/voice';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { BotService } from '../services';
import { ICommand } from '../types/ICommand';

@injectable()
export class Stop implements ICommand {
	constructor(public botService: BotService) {}

	definition = new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stop the bot from playing.')
		.setDMPermission(false);

	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		try {
			const botVoiceConnection = getVoiceConnection(interaction.guildId);

			if (!botVoiceConnection) {
				return void interaction.reply({
					content: 'I am not currently playing anything that could be stopped.',
					ephemeral: true
				});
			}

			const commandAuthor = interaction.member;
			const commandAuthorVoiceChannel = commandAuthor.voice.channel;
			const botVoiceChannelId = botVoiceConnection.joinConfig.channelId;

			if (commandAuthorVoiceChannel?.id !== botVoiceChannelId) {
				return void interaction.reply({
					content: 'To avoid disruption with potential listeners, please connect to the same voice channel as me.',
					ephemeral: true
				});
			}

			const commandAuthorCanSpeak = commandAuthorVoiceChannel.permissionsFor(commandAuthor).has('Speak');

			if (!commandAuthorCanSpeak) {
				return void interaction.reply({
					content: 'You do not have voice permission for this voice channel.',
					ephemeral: true
				});
			}

			botVoiceConnection.destroy();

			interaction.reply('Bot has been disconnected.');
		} catch (error) {
			console.error(error);

			const message = 'There was an internal server problem.';

			interaction.replied ? interaction.editReply(message) : interaction.reply(message);
		}
	}
}
