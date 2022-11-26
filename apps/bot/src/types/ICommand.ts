import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface ICommand {
	definition: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

	execute: (interaction: ChatInputCommandInteraction<'cached'>) => void;
}
