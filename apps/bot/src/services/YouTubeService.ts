import { type AudioResource, createAudioResource } from '@discordjs/voice';
import {
	stream as startStream,
	video_basic_info as videoBasicInfo,
	playlist_info as ytPlaylistInfo,
	yt_validate as ytValidate
} from 'play-dl';
import { singleton } from 'tsyringe';

/**
 * Uses playdl, @Discord.js/voice and the YouTube API to provide a simple abstraction for everything YouTube.
 */
@singleton()
export class YouTubeService {
	/**
	 * Takes in a resource and normalises it to an array of video URLs.
	 * The resource may be one of:
	 * - Video ID
	 * - URL (shortened or normal)
	 * - Search term (not yet implemented)
	 * - Playlist URL
	 */
	async getVideoUrls(resource: string): Promise<(string | undefined)[]> {
		switch (ytValidate(resource)) {
			case 'playlist': {
				try {
					const playlistInfo = await ytPlaylistInfo(resource);
					const allVideos = await playlistInfo.all_videos();

					return allVideos.map(({ url }) => url);
				} catch (error) {
					console.error(error);

					return [];
				}
			}
			case 'video': {
				return resource.startsWith('https') ? [resource] : [`https://www.youtube.com/watch?v=${resource}`];
			}
			case 'search': {
				return []; // Not implemented!
			}
			default:
				return [];
		}
	}

	async createAudioResourceFromUrl(url: string): Promise<AudioResource | null> {
		try {
			const { stream } = await startStream(url, {
				discordPlayerCompatibility: true
			});

			return createAudioResource(stream, { inlineVolume: true });
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
	async getVideoInfos(resource: string) {
		const urls = await this.getVideoUrls(resource);

		return Promise.all(urls.filter((value): value is string => Boolean(value)).map((url) => videoBasicInfo(url)));
	}
}
