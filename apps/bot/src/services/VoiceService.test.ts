/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	type AudioPlayer,
	AudioPlayerStatus,
	type VoiceConnection,
	VoiceConnectionStatus,
	createAudioPlayer,
	joinVoiceChannel
} from '@discordjs/voice';
import type { Guild, VoiceBasedChannel } from 'discord.js';
import EventEmitter from 'events';
import { VoiceService } from './VoiceService';
import { container } from 'tsyringe';
import { deepMockedPrismaClient } from '@yt-bot/database';

jest.mock('@discordjs/voice', () => ({
	...jest.requireActual('@discordjs/voice'),
	joinVoiceChannel: jest.fn(),
	createAudioPlayer: jest.fn(),
	AudioResource: class AudioResource {}
}));

const joinVoiceChannelMock = jest.mocked(joinVoiceChannel);
const createAudioPlayerMock = jest.mocked(createAudioPlayer);
let voiceService: VoiceService;

let joinVoiceChannelMockReturn: {
	__mockId: 'mock 1';
	state: {
		status: VoiceConnectionStatus;
	};
	on: () => typeof joinVoiceChannelMockReturn;
	destroy: jest.Mock;
};

let createAudioPlayerMockReturn: {
	__mockId: 'mock 2';
	on: () => typeof createAudioPlayerMockReturn;
	setMaxListeners: () => typeof createAudioPlayerMockReturn;
	subscribe: jest.Mock;
	play: jest.Mock;
};

beforeEach(() => {
	voiceService = container.resolve(VoiceService);

	joinVoiceChannelMockReturn = {
		__mockId: 'mock 1',
		state: {
			status: VoiceConnectionStatus.Disconnected
		},
		on: jest.fn().mockReturnThis(),
		destroy: jest.fn()
	};

	createAudioPlayerMockReturn = {
		__mockId: 'mock 2',
		on: jest.fn().mockReturnThis(),
		setMaxListeners: jest.fn().mockReturnThis(),
		subscribe: jest.fn(),
		play: jest.fn()
	};

	deepMockedPrismaClient.discordGuild.upsert.mockResolvedValue({
		volumePercent: 80
	} as any);

	joinVoiceChannelMock.mockReturnValue(joinVoiceChannelMockReturn as unknown as VoiceConnection);

	createAudioPlayerMock.mockReturnValue(createAudioPlayerMockReturn as unknown as AudioPlayer);
});

describe('getActiveAudioPlayer', () => {
	it('should return undefined if an audio player does not exist in the cache', () => {
		expect(voiceService.getActiveAudioPlayer({ id: 'guild id' } as Guild)).toStrictEqual(undefined);
	});

	it('should return an audio player', () => {
		const audioPlayerMock = { playable: { length: 1 } };

		voiceService.audioPlayers.set('guild id', audioPlayerMock as unknown as AudioPlayer);

		expect(voiceService.getActiveAudioPlayer({ id: 'guild id' } as Guild)).toStrictEqual(audioPlayerMock);
	});

	it('should NOT return an audio player if the amount of subscribed connections is 0', () => {
		const audioPlayerMock = { playable: { length: 0 } };

		voiceService.audioPlayers.set('guild id', audioPlayerMock as unknown as AudioPlayer);

		expect(voiceService.getActiveAudioPlayer({ id: 'guild id' } as Guild)).toStrictEqual(undefined);
	});
});

describe('onVoiceIdle', () => {
	it('should attach an event listener to the instance passed in', () => {
		const eventSpy = {
			on: jest.fn()
		} as unknown as AudioPlayer;

		voiceService.onVoiceIdle(eventSpy, jest.fn);

		expect(eventSpy.on).toHaveBeenCalledTimes(1);
	});

	it('should run the event listener callback function on voice idle', () => {
		const eventSpy = new EventEmitter() as unknown as AudioPlayer;
		const callbackSpy = jest.fn();

		voiceService.onVoiceIdle(eventSpy, callbackSpy);

		eventSpy.emit('stateChange', { status: AudioPlayerStatus.Playing }, { status: AudioPlayerStatus.Idle });

		expect(callbackSpy).toHaveBeenCalledTimes(1);
	});

	it('should NOT run the event listener callback when was not previous playing', () => {
		const eventSpy = new EventEmitter() as unknown as AudioPlayer;
		const callbackSpy = jest.fn();

		voiceService.onVoiceIdle(eventSpy, callbackSpy);

		eventSpy.emit('stateChange', { status: AudioPlayerStatus.Paused }, { status: AudioPlayerStatus.Idle });

		expect(callbackSpy).not.toHaveBeenCalled();
	});

	it('should NOT run the event listener callback when new state is not idle', () => {
		const eventSpy = new EventEmitter() as unknown as AudioPlayer;
		const callbackSpy = jest.fn();

		voiceService.onVoiceIdle(eventSpy, callbackSpy);

		eventSpy.emit('stateChange', { status: AudioPlayerStatus.Playing }, { status: AudioPlayerStatus.Paused });

		expect(callbackSpy).not.toHaveBeenCalled();
	});
});

describe('destroyConnection', () => {
	it('should destroy a connection that exists in the cache', () => {
		const voiceConnectionMock = {
			state: { status: VoiceConnectionStatus.Ready },
			destroy: jest.fn()
		} as unknown as VoiceConnection;

		voiceService.voiceConnections.set('guild id', voiceConnectionMock);

		voiceService.destroyConnection('guild id');

		expect(voiceConnectionMock.destroy).toHaveBeenCalledTimes(1);
	});

	it('should NOT destroy a connection that is already destroyed', () => {
		const voiceConnectionMock = {
			state: { status: VoiceConnectionStatus.Destroyed },
			destroy: jest.fn()
		} as unknown as VoiceConnection;

		voiceService.voiceConnections.set('guild id', voiceConnectionMock);

		voiceService.destroyConnection('guild id');

		expect(voiceConnectionMock.destroy).not.toHaveBeenCalled();
	});

	it('should silently fail if the voice connection has not yet been cached', () => {
		const voiceConnectionMock = {
			state: { status: VoiceConnectionStatus.Destroyed },
			destroy: jest.fn()
		} as unknown as VoiceConnection;

		voiceService.destroyConnection('guild id');

		expect(voiceConnectionMock.destroy).not.toHaveBeenCalled();
	});
});

describe('createVoiceConnection', () => {
	it('should destroy an existing connection first to prevent memory leaks', () => {
		const destroyConnectionSpy = jest.spyOn(voiceService, 'destroyConnection');

		voiceService.createVoiceConnection({} as unknown as Guild, {} as unknown as VoiceBasedChannel);

		expect(destroyConnectionSpy).toHaveBeenCalledTimes(1);
	});

	it('should join the voice channel', () => {
		const guildSpy = {
			id: 'guild id',
			voiceAdapterCreator: 'pretend I am a function'
		} as unknown as Guild;

		const voiceChannelSpy = {
			id: 'channel id'
		} as unknown as VoiceBasedChannel;

		voiceService.createVoiceConnection(guildSpy, voiceChannelSpy);

		expect(joinVoiceChannelMock).toHaveBeenCalledWith({
			guildId: 'guild id',
			channelId: 'channel id',
			adapterCreator: 'pretend I am a function'
		});
	});

	it('should cache the voice connection', () => {
		const voiceConnectionsMapSetSpy = jest.spyOn(voiceService.voiceConnections, 'set');

		const guildSpy = {
			id: 'guild id',
			voiceAdapterCreator: 'pretend I am a function'
		} as unknown as Guild;

		const voiceChannelSpy = {
			id: 'channel id'
		} as unknown as VoiceBasedChannel;

		voiceService.createVoiceConnection(guildSpy, voiceChannelSpy);

		expect(voiceConnectionsMapSetSpy).toHaveBeenCalledWith(
			'guild id',
			expect.objectContaining({ __mockId: joinVoiceChannelMockReturn.__mockId })
		);
	});

	it('should return the voice connection', () => {
		const guildSpy = {
			id: 'guild id',
			voiceAdapterCreator: 'pretend I am a function'
		} as unknown as Guild;

		const voiceChannelSpy = {
			id: 'channel id'
		} as unknown as VoiceBasedChannel;

		const voiceConnection = voiceService.createVoiceConnection(guildSpy, voiceChannelSpy);

		expect((voiceConnection as any).__mockId).toStrictEqual('mock 1');
	});
});

describe('createAudioPlayer', () => {
	const guildMock = {
		id: 'guild id'
	} as unknown as Guild;

	const voiceConnectionMock = {
		subscribe: jest.fn()
	} as unknown as VoiceConnection;

	it('should create an audio player', () => {
		voiceService.createAudioPlayer(guildMock, voiceConnectionMock);

		expect(createAudioPlayerMock).toHaveBeenCalledTimes(1);
	});

	it('should cache the audio player', () => {
		const audioPlayersMapSetSpy = jest.spyOn(voiceService.audioPlayers, 'set');

		voiceService.createAudioPlayer(guildMock, voiceConnectionMock);

		expect(audioPlayersMapSetSpy).toHaveBeenCalledWith('guild id', expect.objectContaining({ __mockId: 'mock 2' }));
	});

	it('should subscribe the audio player to the voice connection', () => {
		voiceService.createAudioPlayer(guildMock, voiceConnectionMock);

		expect(voiceConnectionMock.subscribe).toHaveBeenCalledTimes(1);
	});
});

describe('startVoiceSession', () => {
	// TODO: needs re-testing!
});

describe('guildVolume', () => {
	it('should return the volume from the database', async () => {
		const result = await voiceService.guildVolume({ id: 'guild id' } as Guild);

		expect(result).toBe(80);
	});

	it('should scope volume controls to the guild', async () => {
		await voiceService.guildVolume({ id: 'guild id' } as Guild);

		expect(deepMockedPrismaClient.discordGuild.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: 'guild id' } })
		);
	});

	it('should pass undefined through as data to not update the volume when omitted', async () => {
		await voiceService.guildVolume({ id: 'guild id' } as Guild);

		expect(deepMockedPrismaClient.discordGuild.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ update: { volumePercent: undefined } })
		);
	});

	it('should pass a new volume number through when provided', async () => {
		await voiceService.guildVolume({ id: 'guild id' } as Guild, 50);

		expect(deepMockedPrismaClient.discordGuild.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ update: { volumePercent: 50 } })
		);
	});

	it('should initialise a new guild if one does not exist in the db', async () => {
		await voiceService.guildVolume({ id: 'guild id' } as Guild);

		expect(deepMockedPrismaClient.discordGuild.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ create: { id: 'guild id', volumePercent: 80 } })
		);
	});
});

describe('setAudioResourceVolume', () => {
	it('should set the volume on a cached audio resource and return true', () => {
		const setVolumeSpy = jest.fn();

		voiceService.audioResources.set('guild id', {
			volume: { setVolumeLogarithmic: setVolumeSpy }
		} as any);

		const result = voiceService.setAudioResourceVolume({ id: 'guild id' } as Guild, 50);

		expect(setVolumeSpy).toHaveBeenCalledWith(0.5);
		expect(result).toBeTruthy();
	});

	it('should return false when it cannot find a cached audio resource', () => {
		const result = voiceService.setAudioResourceVolume({ id: 'guild id' } as Guild, 50);

		expect(result).toBeFalsy();
	});
});
