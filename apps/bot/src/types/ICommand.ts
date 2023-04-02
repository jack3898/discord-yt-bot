import type { CommandInteraction } from './CommandInteraction';
import type { SlashCommandBuilder } from 'discord.js';

export interface ICommand {
	/**
	 * The slash command definition to register to Discord.
	 */
	definition: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

	/**
	 * The executor function that runs when a user invokes the slash command.
	 */
	execute: (interaction: CommandInteraction) => void;
}
