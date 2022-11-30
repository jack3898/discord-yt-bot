/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SHARD_MANAGER_URL } from '@yt-bot/env';
import { ClientToServerEvents, ServerToClientEvents } from '@yt-bot/shard-manager/types/socket';
import { Routes } from 'discord.js';
import { io, Socket } from 'socket.io-client';
import { singleton } from 'tsyringe';
import { RestService } from './RestService';

@singleton()
export class ShardManagerService {
	io?: Socket<ServerToClientEvents, ClientToServerEvents>;
	shardId?: number;
	shardCount?: number;
	enabled: boolean;

	constructor(private restService: RestService) {
		if (SHARD_MANAGER_URL) {
			this.io = io(SHARD_MANAGER_URL.toString());
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

		// Receive shard ID from the shard manager
		const { allocation, count } = await new Promise<{ allocation: number; count: number }>((res) => {
			console.log('🟨 Waiting for shard manager...');

			this.io?.once('shard_info', (allocation, count) => {
				console.log(`🟩 Shard manager allocated shard position ${allocation + 1} within ${count} shards.`);

				res({ allocation, count });
			});
		});

		this.shardId = allocation;
		this.shardCount = count;
	}
}
