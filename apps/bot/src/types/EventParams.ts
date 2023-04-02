import type { ClientEvents } from 'discord.js';

/**
 * The function parameters for a Discord.Client event.
 *
 * It is a good idea to use the rest operator and destructure the parameter:
 * `fnName(...[event]: EventParams<T>) {}`
 *
 * instead of
 *
 * `fnName(event: EventParams<T>[0]) {}`
 *
 * One TypeScript limitation is not inferring this from an implementation.
 */
export type EventParams<T extends keyof ClientEvents> = ClientEvents[T];
