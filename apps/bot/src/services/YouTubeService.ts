import { type AudioResource, createAudioResource } from '@discordjs/voice';
import { stream as startStream, video_basic_info as videoBasicInfo, yt_validate as ytValidate } from 'play-dl';
import { singleton } from 'tsyringe';

/**
 * Uses ytdl, @Discord.js/voice and the YouTube API to provide a simple abstraction for everything YouTube.
 */
@singleton()
export class YouTubeService {
	/**
	 * Takes in a resource and normalises it to an array of video URLs.
	 * The resource may be one of:
	 * - Video ID
	 * - URL (shortened or normal)
	 * - Search term (not yet implemented)
	 * - Playlist URL (not yet implemented)
	 */
	getVideoUrls(resource: string): string[] {
		if (resource.startsWith('https') && ytValidate(resource) === 'video') {
			return [resource];
		} else if (ytValidate(resource) === 'video') {
			return [`https://www.youtube.com/watch?v=${resource}`];
		}

		return [];
	}

	async createAudioResourceFromUrl(url: string): Promise<AudioResource | null> {
		try {
			const { stream } = await startStream(url, {
				discordPlayerCompatibility: true
			});

			return createAudioResource(stream);
		} catch (error) {
			console.error('Failed to create stream.\n', error);

			return null;
		}
	}

	/**
	 * Takes in a resource and normalises it to an array of video details objects.
	 * The resource may be one of:
	 * - Video ID
	 * - URL (shortened or normal)
	 * - Search term (not yet implemented)
	 * - Playlist URL (not yet implemented)
	 */
	getVideoInfos(resource: string) {
		return Promise.all(this.getVideoUrls(resource).map((url) => videoBasicInfo(url)));
	}
}
