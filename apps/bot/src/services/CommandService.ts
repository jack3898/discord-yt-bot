import { container, InjectionToken, singleton } from 'tsyringe';
import { constructor } from 'tsyringe/dist/typings/types';
import { ICommand } from '../types/ICommand';

@singleton()
export class CommandService {
	commandInjectionTokens = new Map<string, InjectionToken<ICommand>>();

	registerClassToken(commandClass: constructor<ICommand>) {
		container.registerSingleton(commandClass);

		this.commandInjectionTokens.set(container.resolve(commandClass).definition.name, commandClass);
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
}
