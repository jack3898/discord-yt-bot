import { CLIENT_ID, DISCORD_TOKEN, GUILD_ID } from '@yt-bot/env';
import { REST, Routes } from 'discord.js';
import { singleton } from 'tsyringe';

@singleton()
export class RestService extends REST {
	constructor() {
		super();

		this.setToken(DISCORD_TOKEN);
	}

	commandsRoute = GUILD_ID
		? (() => {
				console.log('🟨 Guild ID detected in environment. Slash commands will be registered in guild scope.');

				return Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);
		  })()
		: (() => {
				console.log('🟨 Slash commands will be registered globally. This can take up to an hour to take effect!');

				return Routes.applicationCommands(CLIENT_ID);
		  })();
}
