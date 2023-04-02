import { Client, GatewayIntentBits } from 'discord.js';
import { container, singleton } from 'tsyringe';
import { CommandService } from './CommandService';
import type { IEvent } from '../types';
import { LANG } from '../langpacks';
import { RestService } from './RestService';
import { ShardManagerService } from './ShardManagerService';
import { generateFormatters } from '@yt-bot/i18n';

/**
 * The bot service is a minor extension to the base Discord.Client class.
 * All it does is some minor bootstrapping when it is first constructed.
 * It is a singleton, so should be the only instance.
 */
@singleton()
export class BotService extends Client {
	constructor(
		public commandService: CommandService,
		public restService: RestService,
		public shardManagerService: ShardManagerService
	) {
		super({
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
			shardCount: shardManagerService.shardCount,
			shards: shardManagerService.shardId
		});

		this.formatters = generateFormatters(LANG.LOCALE);
	}

	formatters: ReturnType<typeof generateFormatters>;

	/**
	 * Registers required event listeners for various bot events.
	 */
	async registerClientEvents() {
		const importedEvents = await import('../events');
		const events = { ...importedEvents };

		for (const event of Object.values(events)) {
			const instance = container.resolve<IEvent<never>>(event);

			this.on(instance.name, instance.execute);

			console.info(`🟩 Event "${instance.name}" (${instance.description.toLocaleLowerCase()}) loaded.`);
		}
	}

	/**
	 * Creates class instances of the commands in the commands directory, and registers
	 * them to the tsyringe container for use with the CommandService.
	 */
	async registerInternalCommands() {
		const importedCommands = await import('../commands');
		const commands = { ...importedCommands };

		for (const commandToken of Object.values(commands)) {
			const instance = this.commandService.registerClassToken(commandToken);

			console.log(`🟩 Command "${instance.definition.name}" loaded.`);
		}
	}
}
