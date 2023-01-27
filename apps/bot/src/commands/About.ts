import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { LANG } from '../langpacks';
import { BotService, ShardManagerService } from '../services';
import { ICommand } from '../types/ICommand';

const COMMAND = LANG.COMMANDS.ABOUT;

@injectable()
export class About implements ICommand {
	constructor(public botService: BotService, public shardManagerService: ShardManagerService) {}

	definition = new SlashCommandBuilder().setName(COMMAND.NAME).setDescription(COMMAND.DESC);

	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		try {
			interaction.reply({
				content: `This is shard ${this.shardManagerService.shardId} of ${this.shardManagerService.shardCount}.`,
				ephemeral: true
			});
		} catch (error) {
			console.error(error);

			const message = 'There was an internal server problem.';

			interaction.replied ? interaction.editReply(message) : interaction.reply(message);
		}
	}
}
