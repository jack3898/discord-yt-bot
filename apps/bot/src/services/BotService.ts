import { Client, GatewayIntentBits } from 'discord.js';
import { singleton } from 'tsyringe';
import { CommandService } from './CommandService';
import { RestService } from './RestService';

@singleton()
export class BotService extends Client {
	constructor(public commandService: CommandService, public restService: RestService) {
		super({
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
			shardCount: 1,
			shards: 0
		});
	}

	registerEvents() {
		this.once('ready', () => {
			console.log('🟩 Bot online.');
		});

		// Command interactions
		this.on('interactionCreate', (interaction) => {
			if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

			this.commandService.getCommandInstanceBySlashCommandName(interaction.commandName)?.execute(interaction);
		});
	}

	async registerInternalCommands() {
		const importedCommands = await import('../commands');
		const commands = { ...importedCommands };

		for (const commandToken of Object.values(commands)) {
			this.commandService.registerClassToken(commandToken);
		}
	}

	async registerSlashCommands() {
		try {
			const payload = this.commandService.getCommandBuildersAsJson();

			await this.restService.put(this.restService.commandsRoute, { body: payload });

			console.log('🟩 Slash commands registered to the Discord API.');
		} catch (error: unknown) {
			console.error('🟥 Failed to register slash commands.');

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			throw new Error(error as any);
		}
	}
}
