import { AudioPlayerStatus, getVoiceConnection } from '@discordjs/voice';
import type { CommandInteraction, ICommand } from '../types';
import { LANG } from '../langpacks';
import { SlashCommandBuilder } from 'discord.js';
import { VoiceService } from '../services';
import { injectable } from 'tsyringe';

const COMMAND = LANG.COMMANDS.SKIP;

@injectable()
export class Skip implements ICommand {
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

			const activeAudioPlayer = this.voiceService
				.getActiveAudioPlayer(interaction.guild)
				// Simulate finishing the audio, causing a skip
				?.emit('stateChange', { status: AudioPlayerStatus.Playing }, { status: AudioPlayerStatus.Idle });

			if (activeAudioPlayer) {
				return interaction.reply(COMMAND.RESPONSE);
			}

			return interaction.reply(COMMAND.ERROR.NOT_PLAYING);
		} catch (error) {
			console.error(error);

			interaction.replied
				? interaction.editReply(COMMAND.ERROR.INTERNAL_ERROR)
				: interaction.reply(COMMAND.ERROR.INTERNAL_ERROR);
		}
	}
}
