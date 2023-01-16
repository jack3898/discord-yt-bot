import { RESOURCE_TYPES } from '..';

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];
