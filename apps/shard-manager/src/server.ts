import type {
	ClientToServerEvents as C2S,
	InterServerEvents,
	ServerToClientEvents as S2C,
	SocketData
} from '../types/socket';
import { AllocationManager } from './AllocationManager';
import { Server } from 'socket.io';
import env from '@yt-bot/env';

if (!env.SHARD_MANAGER_URL || !env.SHARDS) {
	console.log('🟨 SHARD_MANAGER_URL or SHARDS env vars not in environment. Exiting...');
	console.log('If the bot is not sharded, then you can ignore this message.');

	process.exit(1);
}

const io = new Server<C2S, S2C, InterServerEvents, SocketData>(+new URL(env.SHARD_MANAGER_URL).port);

const allocationManager = new AllocationManager(+env.SHARDS);

io.on('connection', () => {
	io.sockets.once('connection', (socket) => {
		const { allocation, valid } = allocationManager.findAndAllocate(socket.id);

		// No existing allocation or even a vacant seat
		if (!valid) {
			return socket.emit('shard_deny');
		}

		console.log(`🟨 Allocated seat ${allocation} for socket id ${socket.id}.`);

		socket.emit('shard_info', allocation, allocationManager.totalSeats);

		socket.once('disconnect', () => {
			console.log(`🟥 Client with socket id ${socket.id} disconnected.`);

			allocationManager.deallocate(allocation);
		});

		if (allocationManager.full) {
			console.log('🟩 All seats taken!');
		}
	});
});

console.log(`🟩 Shard manager online. Ready to allocate up to ${env.SHARDS} shards.`);
