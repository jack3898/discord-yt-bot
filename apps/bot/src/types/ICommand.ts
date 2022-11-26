import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export interface ICommand {
	definition: SlashCommandBuilder;

	execute: (interaction: ChatInputCommandInteraction) => void;
}
