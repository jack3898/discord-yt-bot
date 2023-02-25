import { generateFormatters } from '@yt-bot/i18n';
import { Client, GatewayIntentBits, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';
import { singleton } from 'tsyringe';
import { LANG } from '../langpacks';
import { CommandService } from './CommandService';
import { RestService } from './RestService';
import { ShardManagerService } from './ShardManagerService';

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
	registerEvents() {
		this.once('ready', () => {
			console.log(`🟩 Bot logged in as ${this.user?.username}.`);
		});

		// Command interactions
		this.on('interactionCreate', (interaction) => {
			if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

			this.commandService.getCommandInstanceBySlashCommandName(interaction.commandName)?.execute(interaction);
		});
	}

	/**
	 * Creates class instances of the commands in the commands directory, and registers
	 * them to the tsyringe container for use with the CommandService.
	 */
	async registerInternalCommands() {
		const importedCommands = await import('../commands');
		const commands = { ...importedCommands };

		for (const commandToken of Object.values(commands)) {
			this.commandService.registerClassToken(commandToken);
		}
	}

	/**
	 * Publishes commands from the CommandService to the Discord API for use as slash commands.
	 */
	async registerSlashCommands(commands: RESTPostAPIChatInputApplicationCommandsJSONBody[]) {
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
