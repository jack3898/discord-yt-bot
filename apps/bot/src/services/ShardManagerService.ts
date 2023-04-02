/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ClientToServerEvents, ServerToClientEvents } from '@yt-bot/shard-manager/types/socket';
import { type Socket, io } from 'socket.io-client';
import { RestService } from './RestService';
import { Routes } from 'discord.js';
import { SHARD_MANAGER_URL } from '@yt-bot/env';
import { singleton } from 'tsyringe';

/**
 * When running multiple bot processes, a shard manager is required to assign each process a shard id.
 * This is a service to communicate with that shard manager. Isn't used if you plan to use one bot process.
 */
@singleton()
export class ShardManagerService {
	io?: Socket<ServerToClientEvents, ClientToServerEvents>;
	shardId?: number;
	shardCount?: number;
	enabled: boolean;

	constructor(private restService: RestService) {
		if (SHARD_MANAGER_URL) {
			this.io = io(SHARD_MANAGER_URL.toString(), { forceNew: true });
			this.enabled = true;

			return;
		}

		this.enabled = false;
	}

	async getGatewayBotInfo() {
		return this.restService.get(Routes.gatewayBot());
	}

	async awaitShardId() {
		this.io?.once('shard_deny', () => {
			console.error('🟥 Shard allocation denied for this client. Exhausted maximum shard count.');

			process.exit(1);
		});

		const timeout = setTimeout(() => {
			console.error('🟥 Shard allocation not completed in time for this client. Exiting...');

			process.exit(1);
		}, 10000);

		// Receive shard ID from the shard manager
		const { allocation, count } = await new Promise<{ allocation: number; count: number }>((res) => {
			console.log('🟨 Waiting for shard manager...');

			this.io?.once('shard_info', (allocation, count) => {
				console.log(`🟩 Shard manager allocated shard position ${allocation + 1} within ${count} shards.`);

				clearTimeout(timeout);
				res({ allocation, count });
			});
		});

		this.shardId = allocation;
		this.shardCount = count;

		this.handleDisconnect();
	}

	handleIdle() {
		const timeout = setTimeout(() => {
			console.error('🟥 No connection could be established to the shard manager. Exiting...'); // Retry handled by socket.io

			process.exit(1);
		}, 60_000);

		this.io?.once('connect', () => {
			console.error('🟩 Re-established a connection!'); // Retry handled by socket.io

			clearTimeout(timeout);
		});
	}

	handleDisconnect() {
		this.io?.once('disconnect', () => {
			console.error('🟥 Lost connection to the shard manager. Retrying...'); // Retry handled by socket.io

			this.handleIdle();
		});
	}
}
