import { DISCORD_TOKEN } from '@yt-bot/env';
import 'reflect-metadata';
import { container } from 'tsyringe';
import { Bot } from './services/Bot';

container.resolve(Bot).login(DISCORD_TOKEN);
