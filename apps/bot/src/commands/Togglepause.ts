import { AudioPlayerStatus, getVoiceConnection } from '@discordjs/voice';
import type { CommandInteraction, ICommand } from '../types';
import { LANG } from '../langpacks';
import { SlashCommandBuilder } from 'discord.js';
import { VoiceService } from '../services';
import { injectable } from 'tsyringe';

const COMMAND = LANG.COMMANDS.PAUSE;

@injectable()
export class Togglepause implements ICommand {
	constructor(private voiceService: VoiceService) {}

	definition = new SlashCommandBuilder().setName(COMMAND.NAME).setDescription(COMMAND.DESC).setDMPermission(false);

	async execute(interaction: CommandInteraction) {
		try {
			const commandAuthor = interaction.member;
			const commandAuthorVoiceChannel = commandAuthor.voice.channel;
			const botVoiceConnection = getVoiceConnection(interaction.guildId);
			const botVoiceChannelId = botVoiceConnection?.joinConfig.channelId;

			if (!interaction.guild || !commandAuthorVoiceChannel || commandAuthorVoiceChannel.id !== botVoiceChannelId) {
				return interaction.reply({
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

			const activeAudioPlayer = this.voiceService.getActiveAudioPlayer(interaction.guild);

			switch (activeAudioPlayer?.state.status) {
				case AudioPlayerStatus.Paused: {
					activeAudioPlayer.unpause();

					return interaction.reply(COMMAND.RESPONSE.RESUMED);
				}
				case AudioPlayerStatus.Playing: {
					activeAudioPlayer.pause();

					return interaction.reply(COMMAND.RESPONSE.PAUSED);
				}
				case AudioPlayerStatus.AutoPaused: {
					activeAudioPlayer.unpause();

					return interaction.reply(COMMAND.RESPONSE.RESUMED);
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
