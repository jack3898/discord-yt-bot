import 'reflect-metadata';

import { DISCORD_TOKEN } from '@yt-bot/env';
import { container } from 'tsyringe';
import { BotService } from './services';

const bot = container.resolve(BotService);

const run = async () => {
	bot.login(DISCORD_TOKEN);

	// Global bot event listeners
	bot.registerEvents();

	// Idenfity all commands in the commands directory
	await bot.registerInternalCommands();

	// Publish slash commands to the Discord API. Must come after internal slash command registrations
	await bot.registerSlashCommands();
};

run();
