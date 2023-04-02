import 'reflect-metadata';

import { BotService, CommandService, ShardManagerService } from './services';
import { DISCORD_TOKEN } from '@yt-bot/env';
import { container } from 'tsyringe';

/**
 * Entry to the app.
 */
async function main() {
	const shardManagerService = container.resolve(ShardManagerService);
	const commandService = container.resolve(CommandService);

	if (shardManagerService.enabled) {
		console.log('🟩 Shard manager client initialised.');

		shardManagerService.handleIdle();

		await shardManagerService.awaitShardId();
	}

	const bot = container.resolve(BotService);

	bot.login(DISCORD_TOKEN);

	// Global bot event listeners
	await bot.registerClientEvents();

	// Idenfity all commands in the commands directory
	await bot.registerInternalCommands();

	// Publish slash commands to the Discord API. Must come after internal slash command registrations
	await commandService.publishSlashCommands(commandService.getCommandBuildersAsJson());
}

main();
