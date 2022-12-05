import 'reflect-metadata';

import { DISCORD_TOKEN } from '@yt-bot/env';
import { container } from 'tsyringe';
import { BotService, ShardManagerService } from './services';

const run = async () => {
	const shardManagerService = container.resolve(ShardManagerService);

	if (shardManagerService.enabled) {
		console.log('🟩 Shard manager client initialised.');

		shardManagerService.handleIdle();

		await shardManagerService.awaitShardId();
	}

	const bot = container.resolve(BotService);

	// console.log(allocation);
	bot.login(DISCORD_TOKEN);

	// Global bot event listeners
	bot.registerEvents();

	// Idenfity all commands in the commands directory
	await bot.registerInternalCommands();

	// Publish slash commands to the Discord API. Must come after internal slash command registrations
	await bot.registerSlashCommands();
};

run();
