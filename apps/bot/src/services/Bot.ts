import { Client, GatewayIntentBits } from 'discord.js';
import { singleton } from 'tsyringe';
import * as commands from '../commands';
import { Command } from './Command';
import { Rest } from './Rest';

@singleton()
export class Bot extends Client {
	commands = { ...commands };

	constructor(public commandService: Command, public restService: Rest) {
		super({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
	}

	registerEvents() {
		this.once('ready', () => {
			console.log('🟩 Bot online.');
		});

		// Command interactions
		this.on('interactionCreate', (interaction) => {
			if (!interaction.isChatInputCommand()) return;

			this.commandService.getCommandInstanceBySlashCommandName(interaction.commandName)?.execute(interaction);
		});
	}

	registerInternalCommands() {
		for (const commandToken of Object.values(this.commands)) {
			this.commandService.registerClassToken(commandToken);

			console.log(`🟩 Command "${commandToken.name}" loaded.`);
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
