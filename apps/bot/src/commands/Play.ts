import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { BotService } from '../services';
import { ICommand } from '../types/ICommand';

@injectable()
export class Play implements ICommand {
	constructor(public botService: BotService) {}

	definition = new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play an audio resource in a voice channel you are connected to.')
		.addStringOption((option) => option.setName('resource').setDescription('A YouTube video URL.').setRequired(true))
		.setDMPermission(false);

	execute(interaction: ChatInputCommandInteraction<'cached'>) {
		const guildMember = interaction.member;
		const voiceChannel = guildMember.voice.channel;

		if (!voiceChannel?.id) {
			return void interaction.reply({
				content: 'You must be connected to a voice channel to use this command.',
				ephemeral: true
			});
		}

		this.botService.joinVoiceChannel({
			guildId: interaction.guildId,
			channelId: voiceChannel.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator
		});
	}
}
