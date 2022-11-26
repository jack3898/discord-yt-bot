import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { ICommand } from '../types/ICommand';

@injectable()
export class Play implements ICommand {
	definition = new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play an audio resource in a voice channel you are connected to.')
		.addStringOption((option) => option.setName('resource').setDescription('A YouTube video URL.'));

	execute(interaction: ChatInputCommandInteraction) {
		interaction.reply('Works!');
	}
}
