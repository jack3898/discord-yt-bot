import type { Awaitable, ClientEvents } from 'discord.js';

/**
 * Minimum information required for an event registration.
 *
 * NOTE: Typescript cannot infer the paramters of execute for you.
 */
export interface IEvent<TName extends keyof ClientEvents> {
	name: TName;

	/**
	 * Multiple of the same event type can be registered for different purposes.
	 *
	 * Provide a description to distinguish between events for debugging purposes.
	 */
	description: string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	execute: (...args: any[]) => Awaitable<void>;
}
