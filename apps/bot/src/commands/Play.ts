import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { ICommand } from '../types/ICommand';

@injectable()
export class Play implements ICommand {
	definition = new SlashCommandBuilder().setName('play').setDescription('This is a test at the moment.');

	execute(interaction: ChatInputCommandInteraction) {
		interaction.reply('Works!');
	}
}
