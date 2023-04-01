import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface ICommand {
	/**
	 * The slash command definition to register to Discord.
	 */
	definition: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

	/**
	 * The executor function that runs when a user invokes the slash command.
	 */
	execute: (interaction: ChatInputCommandInteraction<'cached'>) => void;
}
