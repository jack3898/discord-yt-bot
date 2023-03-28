/* eslint-disable @typescript-eslint/no-explicit-any */
import playdl from 'play-dl';
import { container } from 'tsyringe';
import { YouTubeService } from './YouTubeService';

const youtubeService = container.resolve(YouTubeService);

jest.mock('play-dl', () => ({
	...jest.requireActual('play-dl'),
	video_basic_info: jest.fn()
}));

const playdlMock = jest.mocked(playdl);

afterEach(() => {
	jest.resetAllMocks();
});

describe('getVideoUrls method', () => {
	describe('valid resources', () => {
		it('should resolve a URL when provided a video ID', () => {
			const result = youtubeService.getVideoUrls('bSiEB64FyF8');

			expect(result).toHaveLength(1);
			expect(result[0]).toStrictEqual('https://www.youtube.com/watch?v=bSiEB64FyF8');
		});

		it('should resolve a URL when provided a normal video URL', () => {
			const result = youtubeService.getVideoUrls('https://www.youtube.com/watch?v=bSiEB64FyF8');

			expect(result).toHaveLength(1);
			expect(result[0]).toStrictEqual('https://www.youtube.com/watch?v=bSiEB64FyF8');
		});

		it('should result a URL when provided a shortened video URL', () => {
			const result = youtubeService.getVideoUrls('https://youtu.be/bSiEB64FyF8');

			expect(result).toHaveLength(1);
			expect(result[0]).toStrictEqual('https://youtu.be/bSiEB64FyF8');
		});
	});

	describe('invalid resources', () => {
		it('wrong domain', () => {
			const result = youtubeService.getVideoUrls('https://google.com');

			expect(result).toHaveLength(0);
			expect(result).toBeInstanceOf(Array);
		});

		it('any string', () => {
			const result = youtubeService.getVideoUrls('hello');

			expect(result).toHaveLength(0);
			expect(result).toBeInstanceOf(Array);
		});

		it('invalid ID', () => {
			const result = youtubeService.getVideoUrls('https://www.youtube.com/watch?v=hello');

			expect(result).toHaveLength(0);
			expect(result).toBeInstanceOf(Array);
		});

		it('invalid ID shortened', () => {
			const result = youtubeService.getVideoUrls('https://youtu.be/hello');

			expect(result).toHaveLength(0);
			expect(result).toBeInstanceOf(Array);
		});
	});
});

describe('getVideoInfos method', () => {
	it('should resolve video infos', async () => {
		playdlMock.video_basic_info.mockResolvedValue({
			basicInfo: 'test'
		} as any);

		const result = await youtubeService.getVideoInfos('https://youtu.be/bSiEB64FyF8');

		expect(playdlMock.video_basic_info).toHaveBeenCalled();
		expect(result).toStrictEqual([{ basicInfo: 'test' }]);
	});

	it('should use getVideoUrls to resolve urls', async () => {
		const getVideoUrlsSpy = jest.spyOn(youtubeService, 'getVideoUrls');

		await youtubeService.getVideoInfos('https://youtu.be/bSiEB64FyF8');

		expect(getVideoUrlsSpy).toHaveBeenCalledTimes(1);
	});
});
