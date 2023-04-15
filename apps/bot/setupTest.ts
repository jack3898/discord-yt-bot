import 'reflect-metadata';

import { container } from 'tsyringe';
import { deepMockedPrismaClientReset } from '@yt-bot/database';

jest.mock('@yt-bot/database', () => ({
	__esModule: true,
	...jest.requireActual('@yt-bot/database'),
	prismaClient: jest.requireActual('@yt-bot/database').deepMockedPrismaClient
}));

global.beforeEach(() => {
	jest.resetAllMocks();
	deepMockedPrismaClientReset();
});

global.afterEach(() => {
	container.reset();
});
