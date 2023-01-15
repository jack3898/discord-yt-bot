import { RESOURCE_TYPES } from '@yt-bot/constants';

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];
