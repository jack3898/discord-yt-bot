import { Client, GatewayIntentBits } from 'discord.js';
import { singleton } from 'tsyringe';

@singleton()
export class Bot extends Client {
	constructor() {
		super({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
	}
}
