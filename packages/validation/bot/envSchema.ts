import nodeEnvUnion from '../global/nodeEnvUnion';
import { z } from 'zod';

export default z.object({
	NODE_ENV: nodeEnvUnion,
	DISCORD_TOKEN: z.string().regex(/^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-+/=]*)/gm, {
		message: [
			'Your Discord bot token was not provided or is invalid!',
			'Please go to https://discord.com/developers to retrieve a bot user token.'
		].join('\n')
	}),
	CLIENT_ID: z
		.string()
		.nonempty(
			[
				'A Discord client ID was not provided (CLIENT_ID).',
				"Please go to https://discord.com/developers to retrieve your bot's client ID."
			].join('\n')
		),
	GUILD_ID: z.string().nullish(),
	SHARD_MANAGER_URL: z.string().nullish(),
	SHARDS: z.string().nullish()
});
