import { RESOURCE_TYPES } from '@yt-bot/constants';
import { PrismaClient } from '@yt-bot/database';

const seederClient = new PrismaClient();

// will be expanded in the future
async function main() {
	await seederClient.resourceType.deleteMany();

	await seederClient.$transaction([
		seederClient.resourceType.create({
			data: { name: RESOURCE_TYPES.YOUTUBE_VIDEO }
		})
	]);
}

main();