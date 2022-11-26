/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ROOT_ENV_FILE } from '@yt-bot/constants';
import dotenv from 'dotenv';

dotenv.config({ path: ROOT_ENV_FILE });

export const NODE_ENV = process.env.NODE_ENV as 'production' | 'development';
export const DISCORD_TOKEN = process.env.DISCORD_TOKEN!;
export const GUILD_ID = process.env.GUILD_ID;
export const CLIENT_ID = process.env.CLIENT_ID!;
