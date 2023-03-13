import { ConstantsTypes } from '@yt-bot/constants';
import { DiscordGuild, DiscordUser, PrismaClient } from '@yt-bot/database';
import { Guild, User } from 'discord.js';
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

	/**
	 * The queue system has a foreign key that relates to either a user or Discord server.
	 * This is a quick way to add those users or servers to the db if they do not exist.
	 */
	createEntitiesIfNotExists(entities: {
		userId?: User['id'];
		guildId?: Guild['id'];
	}): Promise<(DiscordUser | DiscordGuild)[]> {
		const queries = Object.entries(entities).map(async ([entityType, id]): Promise<DiscordGuild | DiscordUser> => {
			switch (entityType) {
				case 'userId':
					return (
						this.userIdCache.get(id) ||
						this.discordUser
							.upsert({
								where: { id },
								create: { id },
								update: {}
							})
							.then((res) => {
								this.userIdCache.set(id, res);

								return res;
							})
					);
				case 'guildId':
					return (
						this.guildIdCache.get(id) ||
						this.discordGuild
							.upsert({
								where: { id },
								create: { id },
								update: {}
							})
							.then((res) => {
								this.guildIdCache.set(id, res);

								return res;
							})
					);
			}

			throw TypeError('Incorrect entity name provided. It must be guildId or userId.');
		});

		return Promise.all(queries);
	}

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

			console.log(`${params.action.toUpperCase()} ${params.model} (${after - before}ms)`);

			return result;
		});
	}
}
