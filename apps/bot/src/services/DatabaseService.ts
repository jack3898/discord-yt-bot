import { ConstantsTypes } from '@yt-bot/constants';
import { DiscordGuild, DiscordUser, PrismaClient } from '@yt-bot/database';
import { singleton } from 'tsyringe';

/**
 * Service that extends the Prisma client.
 * You can learn more about Prisma here: https://www.prisma.io/
 */
@singleton()
export class DatabaseService extends PrismaClient {
	constructor() {
		super();

		this.initLogging();
	}

	private userIdCache = new Map<string, DiscordUser>();
	private guildIdCache = new Map<string, DiscordGuild>();

	createResourceIfNotExists(resource: string, type: ConstantsTypes.ResourceType) {
		return this.resource.upsert({
			where: {
				resource: resource
			},
			create: {
				resource: resource,
				resourceType: { connect: { name: type } }
			},
			update: {}
		});
	}

	initLogging() {
		this.$use(async (params, next) => {
			const before = Date.now();

			const result = await next(params);

			const after = Date.now();

			console.log(`🟨 ${params.action.toUpperCase()} ${params.model} (${after - before}ms)`);

			return result;
		});
	}
}
