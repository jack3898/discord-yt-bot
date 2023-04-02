import { container, singleton } from 'tsyringe';
import { BotService } from '../services';
import type { IEvent } from '../types/IEvent';

@singleton()
export class Ready<T extends 'ready'> implements IEvent<T> {
	name = 'ready' as T;

	description = 'Bot login';

	async execute() {
		// Injecting this before ready provides a pre-logged in bot instance so container.resolve must be used.
		const botService = container.resolve(BotService);

		console.log(`🟩 Bot logged in as ${botService.user?.username}.`);
	}
}
