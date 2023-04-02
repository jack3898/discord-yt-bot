import { CommandService } from '../services';
import type { EventParams } from '../types';
import type { IEvent } from '../types/IEvent';
import { singleton } from 'tsyringe';

@singleton()
export class Command<T extends 'interactionCreate'> implements IEvent<T> {
	constructor(private commandService: CommandService) {}

	name = 'interactionCreate' as T;

	description = 'Chat command handler';

	async execute(...[interaction]: EventParams<'interactionCreate'>) {
		if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

		this.commandService.getCommandInstanceBySlashCommandName(interaction.commandName)?.execute(interaction);
	}
}
