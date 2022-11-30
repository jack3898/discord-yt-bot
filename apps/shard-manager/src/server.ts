import { SHARD_MANAGER_URL } from '@yt-bot/env';
import { Server } from 'socket.io';
import { ClientToServerEvents as C2S, InterServerEvents, ServerToClientEvents as S2C, SocketData } from '../types/socket';
import { AllocationManager } from './AllocationManager';

if (!SHARD_MANAGER_URL) {
	console.error('🟥 SHARD_MANAGER_URL not in environment. Please add it. Exiting...');

	process.exit(1);
}

const io = new Server<C2S, S2C, InterServerEvents, SocketData>(+SHARD_MANAGER_URL.port);

const allocationManager = new AllocationManager(3);

io.on('connection', () => {
	io.sockets.once('connection', (socket) => {
		const { allocation, valid } = allocationManager.findAndAllocate(socket.id);

		// No existing allocation or even a vacant seat
		if (!valid) {
			return socket.emit('shard_deny');
		}

		console.log(`🟩 Allocated seat ${allocation} for socket id ${socket.id}.`);

		socket.emit('shard_info', allocation, allocationManager.totalSeats);

		socket.once('disconnect', () => {
			console.log(`🟥 Client with socket id ${socket.id} disconnected.`);

			allocationManager.deallocate(allocation);
		});
	});
});

console.log('🟩 Shard manager online.');
