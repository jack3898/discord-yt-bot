import { DISCORD_TOKEN } from '@yt-bot/env';
import 'reflect-metadata';
import { container } from 'tsyringe';
import { BotService } from './services/BotService';

const bot = container.resolve(BotService);

bot.login(DISCORD_TOKEN);

// Global bot event listeners
bot.registerEvents();

// Idenfity all commands in the commands directory
bot.registerInternalCommands();

// Publish slash commands to the Discord API. Must come after internal slash command registrations
bot.registerSlashCommands();
