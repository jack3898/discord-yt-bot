import { PrismaClient } from '@prisma/client';

export * from './test';
export const prismaClient = new PrismaClient();
export { type PrismaClient } from '@prisma/client';
