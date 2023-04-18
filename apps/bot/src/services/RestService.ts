import { REST, Routes } from 'discord.js';
import env from '@yt-bot/env';
import { singleton } from 'tsyringe';

@singleton()
export class RestService extends REST {
	constructor() {
		super();

		this.setToken(env.DISCORD_TOKEN);
	}

	get commandsRoute() {
		if (env.GUILD_ID) {
			console.log('🟨 Guild ID detected in environment. Slash commands will be registered in guild scope.');

			return Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID);
		}

		console.log('🟨 Slash commands will be registered globally. This can take up to an hour to take effect!');

		return Routes.applicationCommands(env.CLIENT_ID);
	}
}
