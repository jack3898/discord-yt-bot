import { type PrismaClient, prismaClient } from '@yt-bot/database';
import type { ConstantsTypes } from '@yt-bot/constants';
import { singleton } from 'tsyringe';

/**
 * Service that extends the Prisma client.
 * You can learn more about Prisma here: https://www.prisma.io/
 */
@singleton()
export class DatabaseService {
	constructor() {
		this.prisma = prismaClient;
		this.initLogging();
	}

	readonly prisma: PrismaClient;

	createResourceIfNotExists(resource: string, type: ConstantsTypes.ResourceType) {
		return this.prisma.resource.upsert({
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
		this.prisma.$use(async (params, next) => {
			const before = Date.now();

			const result = await next(params);

			const after = Date.now();

			console.log(`🟨 ${params.action.toUpperCase()} ${params.model} (${after - before}ms)`);

			return result;
		});
	}
}
