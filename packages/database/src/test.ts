import { type DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

export const deepMockedPrismaClient: DeepMockProxy<PrismaClient> = mockDeep();

export const deepMockedPrismaClientReset = () => {
	mockReset(deepMockedPrismaClient);
};
