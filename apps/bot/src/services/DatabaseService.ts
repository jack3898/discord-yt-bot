import { PrismaClient } from '@yt-bot/database';
import { Guild, User } from 'discord.js';
import { singleton } from 'tsyringe';

/**
 * Service that extends the Prisma client.
 * You can learn more about Prisma here: https://www.prisma.io/
 */
@singleton()
export class DatabaseService extends PrismaClient {
	async createEntitiesIfNotExists(userId: User['id'], guildId: Guild['id']) {
		const user = await this.discordUser.upsert({
			where: { id: userId },
			create: { id: userId },
			update: {}
		});

		const guild = await this.discordGuild.upsert({
			where: { id: guildId },
			create: { id: guildId },
			update: {}
		});

		return { user, guild };
	}
}
