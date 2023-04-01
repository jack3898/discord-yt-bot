/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	AudioPlayer,
	AudioPlayerStatus,
	AudioResource,
	VoiceConnection,
	VoiceConnectionStatus,
	createAudioPlayer,
	joinVoiceChannel
} from '@discordjs/voice';
import { Guild, VoiceBasedChannel } from 'discord.js';
import EventEmitter from 'events';
import { container } from 'tsyringe';
import { VoiceService } from './VoiceService';
import { VOICE_CONNECTION_SIGNALS } from '@yt-bot/constants';

jest.mock('@discordjs/voice', () => ({
	...jest.requireActual('@discordjs/voice'),
	joinVoiceChannel: jest.fn(),
	createAudioPlayer: jest.fn(),
	AudioResource: class AudioResource {}
}));

let voiceService: VoiceService;

const joinVoiceChannelMock = jest.mocked(joinVoiceChannel);
const createAudioPlayerMock = jest.mocked(createAudioPlayer);
const AudioResourceMock = AudioResource as any;

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
	VoiceService.voiceConnections = new Map();
	VoiceService.audioPlayers = new Map();

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

	joinVoiceChannelMock.mockReturnValue(joinVoiceChannelMockReturn as unknown as VoiceConnection);

	createAudioPlayerMock.mockReturnValue(createAudioPlayerMockReturn as unknown as AudioPlayer);
});

describe('getActiveAudioPlayer', () => {
	it('should return undefined if an audio player does not exist in the cache', () => {
		expect(voiceService.getActiveAudioPlayer('guild id')).toStrictEqual(undefined);
	});

	it('should return an audio player', () => {
		const audioPlayerMock = { playable: { length: 1 } };

		VoiceService.audioPlayers.set('guild id', audioPlayerMock as unknown as AudioPlayer);

		expect(voiceService.getActiveAudioPlayer('guild id')).toStrictEqual(audioPlayerMock);
	});

	it('should NOT return an audio player if the amount of subscribed connections is 0', () => {
		const audioPlayerMock = { playable: { length: 0 } };

		VoiceService.audioPlayers.set('guild id', audioPlayerMock as unknown as AudioPlayer);

		expect(voiceService.getActiveAudioPlayer('guild id')).toStrictEqual(undefined);
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

		VoiceService.voiceConnections.set('guild id', voiceConnectionMock);

		voiceService.destroyConnection('guild id');

		expect(voiceConnectionMock.destroy).toHaveBeenCalledTimes(1);
	});

	it('should NOT destroy a connection that is already destroyed', () => {
		const voiceConnectionMock = {
			state: { status: VoiceConnectionStatus.Destroyed },
			destroy: jest.fn()
		} as unknown as VoiceConnection;

		VoiceService.voiceConnections.set('guild id', voiceConnectionMock);

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
		const voiceConnectionsMapSetSpy = jest.spyOn(VoiceService.voiceConnections, 'set');

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
		const audioPlayersMapSetSpy = jest.spyOn(VoiceService.audioPlayers, 'set');

		voiceService.createAudioPlayer(guildMock, voiceConnectionMock);

		expect(audioPlayersMapSetSpy).toHaveBeenCalledWith('guild id', expect.objectContaining({ __mockId: 'mock 2' }));
	});

	it('should subscribe the audio player to the voice connection', () => {
		voiceService.createAudioPlayer(guildMock, voiceConnectionMock);

		expect(voiceConnectionMock.subscribe).toHaveBeenCalledTimes(1);
	});
});

describe('startVoiceSession', () => {
	const guildMock = {
		id: 'guild id'
	} as unknown as Guild;

	let createVoiceConnectionSpy: any;
	let createAudioPlayerSpy: any;
	let audioPlayerMock: any;

	beforeEach(() => {
		audioPlayerMock = new (class AudioPlayerMock extends EventEmitter {
			play = jest.fn();
		})();

		createVoiceConnectionSpy = jest
			.spyOn(voiceService, 'createVoiceConnection')
			.mockReturnValue({ subscribe: jest.fn() } as any);
		createAudioPlayerSpy = jest.spyOn(voiceService, 'createAudioPlayer').mockReturnValue(audioPlayerMock as any);
	});

	it('should return null if the audio resource resolver callback does not return an audio resource', () => {
		const resultPromise = voiceService.startVoiceSession({
			guild: guildMock,
			voiceBasedChannel: {} as unknown as VoiceBasedChannel,
			resolveAudioResource: async () => {
				return VOICE_CONNECTION_SIGNALS.DISCONNECT;
			}
		});

		expect(resultPromise).resolves.toStrictEqual(null);
	});

	it('should establish a connection and an audio player when the audio resource can be found', async () => {
		await voiceService.startVoiceSession({
			guild: guildMock,
			voiceBasedChannel: {} as unknown as VoiceBasedChannel,
			resolveAudioResource: async () => {
				return new AudioResourceMock();
			}
		});

		expect(createVoiceConnectionSpy).toHaveBeenCalledTimes(1);
		expect(createAudioPlayerSpy).toHaveBeenCalledTimes(1);
	});

	it('should use the resolveAudioResource callback to fetch the first audio resource', async () => {
		const resolveAudioResourceSpy = jest.fn().mockResolvedValue({});

		await voiceService.startVoiceSession({
			guild: guildMock,
			voiceBasedChannel: {} as unknown as VoiceBasedChannel,
			resolveAudioResource: resolveAudioResourceSpy
		});

		expect(resolveAudioResourceSpy).toHaveBeenCalledTimes(1);
	});

	it('should use onVoiceIdle method', async () => {
		const onVoiceIdleSpy = jest.spyOn(voiceService, 'onVoiceIdle');

		await voiceService.startVoiceSession({
			guild: guildMock,
			voiceBasedChannel: {} as unknown as VoiceBasedChannel,
			resolveAudioResource: async () => {
				return new AudioResourceMock();
			}
		});

		expect(onVoiceIdleSpy).toHaveBeenCalledTimes(1);
	});
});
