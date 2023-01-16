import { ConstantsTypes } from '@yt-bot/constants';
import { PrismaClient } from '@yt-bot/database';
import { Guild, User } from 'discord.js';
import { singleton } from 'tsyringe';

/**
 * Service that extends the Prisma client.
 * You can learn more about Prisma here: https://www.prisma.io/
 */
@singleton()
export class DatabaseService extends PrismaClient {
	/**
	 * The queue system has a foreign key that relates to either a user or Discord server.
	 * This is a quick way to add those users or servers to the db if they do not exist.
	 */
	createEntitiesIfNotExists(userId: User['id'], guildId: Guild['id']) {
		return this.$transaction([
			this.discordUser.upsert({
				where: { id: userId },
				create: { id: userId },
				update: {}
			}),
			this.discordGuild.upsert({
				where: { id: guildId },
				create: { id: guildId },
				update: {}
			})
		]);
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
}
