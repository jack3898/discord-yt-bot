import { ENTITY_TYPES } from '@yt-bot/constants';

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];
