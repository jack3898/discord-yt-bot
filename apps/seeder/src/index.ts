import { RESOURCE_TYPES } from '@yt-bot/constants';
import { prismaClient } from '@yt-bot/database';

// will be expanded in the future
async function main() {
	await prismaClient.resourceType.deleteMany();

	await prismaClient.$transaction([
		prismaClient.resourceType.create({
			data: { name: RESOURCE_TYPES.YOUTUBE_VIDEO }
		})
	]);
}

main();
