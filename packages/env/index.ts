/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ENV } from '@yt-bot/constants';
import dotenv from 'dotenv';
import { envSchema } from '@yt-bot/validation/bot';
import { prettyParse } from '@yt-bot/validation';

dotenv.config({ path: ENV.ROOT_ENV_FILE });

export default prettyParse(envSchema, process.env);
