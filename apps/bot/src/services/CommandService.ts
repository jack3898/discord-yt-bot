import { type InjectionToken, container, singleton } from 'tsyringe';
import type { ICommand } from '../types/ICommand';
import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { RestService } from './RestService';
import type { constructor } from 'tsyringe/dist/typings/types';

/**
 * The command service ties up the commands in the commands directory.
 * References to "tokens" are from tsyringe.
 */
@singleton()
export class CommandService {
	constructor(private restService: RestService) {}

	commandInjectionTokens = new Map<string, InjectionToken<ICommand>>();

	registerClassToken(commandClass: constructor<ICommand>) {
		container.registerSingleton(commandClass);

		const instance = container.resolve(commandClass);

		this.commandInjectionTokens.set(instance.definition.name, commandClass);

		return instance;
	}

	getCommandInstanceBySlashCommandName(commandName: string) {
		if (this.commandInjectionTokens.has(commandName)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			return container.resolve(this.commandInjectionTokens.get(commandName)!);
		}
	}

	getCommandBuilders() {
		return Array.from(this.commandInjectionTokens.values()).map((token) => {
			return container.resolve(token).definition;
		});
	}

	getCommandBuildersAsJson() {
		return this.getCommandBuilders().map((builder) => builder.toJSON());
	}

	/**
	 * Publishes an array of commands to the Discord API for use as slash commands.
	 */
	async publishSlashCommands(commands: RESTPostAPIChatInputApplicationCommandsJSONBody[]) {
		try {
			await this.restService.put(this.restService.commandsRoute, { body: commands });

			console.log('🟩 Slash commands registered to the Discord API.');
		} catch (error: unknown) {
			console.error('🟥 Failed to register slash commands.');

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			throw new Error(error as any);
		}
	}
}
