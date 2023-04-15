import type { ConstantsTypes } from '@yt-bot/constants';
import { DatabaseService } from './DatabaseService';
import { singleton } from 'tsyringe';

@singleton()
export class QueueService {
	constructor(private dbService: DatabaseService) {}

	readonly recommendedPageSize = 10;

	/**
	 * Inserts an item to the queue. As queues can have multiple scopes (i.e., who owns the queue; user or server?)
	 * you need to provide some additional information about that scope and the resource (e.g. a video id).
	 *
	 * @param resourceData E.g. video id, playlist id (not yet supported).
	 * @param entity E.g. an object representing a DiscordUser or DiscordGuild from the respective model in the db.
	 * @param scope E.g. user or guild scope (use the ENTITY_TYPES constant).
	 * @param resourceType E.g. a resource type from the ResourceTypes table in the db. This helps the code understand if it's a video, playlist etc.
	 * (use the RESOURCE_TYPES constant).
	 * @returns
	 */
	async addItemToQueue(
		resourceData: string,
		resourceType: ConstantsTypes.ResourceType,
		discordUserId: string,
		discordGuildId?: string
	) {
		return this.dbService.prisma.queue.create({
			data: {
				resource: {
					connectOrCreate: {
						where: {
							resource: resourceData
						},
						create: {
							resource: resourceData,
							resourceType: {
								connect: { name: resourceType }
							}
						}
					}
				},
				discordUser: {
					connectOrCreate: {
						where: { id: discordUserId },
						create: { id: discordUserId }
					}
				},
				discordGuild: discordGuildId
					? {
							connectOrCreate: {
								where: { id: discordGuildId },
								create: { id: discordGuildId }
							}
					  }
					: undefined
			}
		});
	}

	async getItemsByCursor(cursor?: number, take = 1) {
		const data = await this.dbService.prisma.queue.findMany({
			cursor: { id: cursor },
			take: take + 1
		});

		const nextCursor = data.pop()?.id || null;

		return {
			nextCursor,
			data
		};
	}

	getQueue(userId: string, guildId?: string, expired?: boolean) {
		return this.dbService.prisma.queue.findMany({
			// User queues must not have a guild id, but guild queues must have a user id.
			where: { discordUserId: userId, discordGuildId: guildId ?? null, expired: !!expired },
			select: { resource: { select: { resource: true } } },
			take: this.recommendedPageSize
		});
	}

	getNextQueueItem(resourceType: ConstantsTypes.ResourceType, guildId: string, userId?: string) {
		return this.dbService.prisma.queue.findFirst({
			where: {
				discordGuildId: userId ? null : guildId,
				discordUserId: userId,
				resource: { resourceType: { name: resourceType } },
				expired: false
			},
			include: {
				resource: true
			}
		});
	}

	setExpired(queueItemId: number) {
		return this.dbService.prisma.queue.update({
			where: { id: queueItemId },
			data: { expired: true }
		});
	}
}
