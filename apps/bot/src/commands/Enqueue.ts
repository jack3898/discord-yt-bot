import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { injectable } from 'tsyringe';
import { BotService, DatabaseService, ShardManagerService } from '../services';
import { ICommand } from '../types/ICommand';

@injectable()
export class Enqueue implements ICommand {
	constructor(
		public botService: BotService,
		public shardManagerService: ShardManagerService,
		public dbService: DatabaseService
	) {}

	definition = new SlashCommandBuilder().setName('enqueue').setDescription('Enqueue a video or playlist to a queue.');

	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		try {
			await this.dbService.createEntitiesIfNotExists(interaction.user.id, interaction.guildId);

			interaction.reply('works');
		} catch (error) {
			console.error(error);

			const message = 'There was an internal server problem.';

			interaction.replied ? interaction.editReply(message) : interaction.reply(message);
		}
	}
}
