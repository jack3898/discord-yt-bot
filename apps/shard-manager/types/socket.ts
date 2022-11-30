/* eslint-disable @typescript-eslint/no-empty-interface */
export interface ServerToClientEvents {
	shard_info: (allocation: number, count: number) => void;
	shard_save: () => void;
	shard_deny: () => void;
}

export interface ClientToServerEvents {}

export interface InterServerEvents {}

export interface SocketData {}
