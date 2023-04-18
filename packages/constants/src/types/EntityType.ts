import type { ENTITY_TYPES } from '..';

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];
