import { createAudioResource } from '@discordjs/voice';
import { singleton } from 'tsyringe';
import ytdl from 'ytdl-core-discord';

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
		if (ytdl.validateURL(resource)) {
			return [resource];
		} else if (ytdl.validateID(resource)) {
			return [`https://www.youtube.com/watch?v=${resource}`];
		}

		// search term and playlist URL coming later

		return [];
	}

	async createAudioResourceFromUrl(url: string) {
		const bitstream = await ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25 });

		if (!bitstream) {
			throw Error('Failed to create stream.');
		}

		return createAudioResource(bitstream);
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
		return Promise.all(this.getVideoUrls(resource).map((url) => ytdl.getBasicInfo(url)));
	}
}
