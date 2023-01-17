import { ConstantsTypes } from '@yt-bot/constants';
import { DiscordGuild, DiscordUser } from '@yt-bot/database';
import { singleton } from 'tsyringe';
import { DatabaseService } from './DatabaseService';

@singleton()
export class QueueService {
	constructor(private dbService: DatabaseService) {}

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
	addItemToQueue(
		resourceData: string,
		scope: ConstantsTypes.EntityType,
		resourceType: ConstantsTypes.ResourceType,
		entity?: DiscordUser | DiscordGuild
	) {
		return this.dbService.queue.create({
			data: {
				resource: {
					connectOrCreate: {
						where: {
							resource: resourceData
						},
						create: {
							resource: resourceData,
							resourceType: {
								connect: {
									name: resourceType
								}
							}
						}
					}
				},
				discordGuild: scope === 'guild' ? { connect: { id: entity?.id } } : undefined,
				discordUser: scope === 'user' ? { connect: { id: entity?.id } } : undefined
			}
		});
	}

	async getItemsByCursor(cursor?: number, take = 1) {
		const data = await this.dbService.queue.findMany({
			cursor: { id: cursor },
			take: take + 1
		});

		const nextCursor = data.pop()?.id || null;

		return {
			nextCursor,
			data
		};
	}
}
