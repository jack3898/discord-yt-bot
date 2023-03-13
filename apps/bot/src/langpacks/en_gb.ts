/**
 * BRITISH ENGLISH language pack.
 * Please see the README next to this for more information.
 */
export default {
	LOCALE: 'en-GB', // Defines number and date time formats using [ISO-639-1]-[ISO_3166-1]
	COMMANDS: {
		PLAY: {
			NAME: 'play',
			DESC: 'Play an audio resource in a voice channel you are connected to.',
			OPTION: {
				RESOURCE: {
					NAME: 'resource',
					DESC: 'A YouTube video URL or ID.'
				}
			},
			ERROR: {
				NO_VOICE_CONN: 'You must be connected to a voice channel to use this command.',
				NO_VOICE_PERM: 'You do not have voice permission for this voice channel.',
				INVALID_RESOURCE: 'The provided resource is invalid.',
				INTERNAL_ERROR:
					'There was an internal server problem. There is a chance this is because the video is private or age restricted.'
			},
			RESPONSE: {
				SUCCESS: 'Now playing `{{title}}`.'
			}
		},
		STOP: {
			NAME: 'stop',
			DESC: 'Stop the bot from playing.',
			ERROR: {
				NOT_PLAYING: 'I am not currently playing anything that could be stopped.',
				INVALID_CHANNEL:
					'To avoid disruption with potential listeners, please connect to the same voice channel as me.',
				NO_VOICE_PERM: 'You do not have voice permission for this voice channel.',
				INTERNAL_ERROR: 'There was an internal server problem.'
			},
			RESPONSE: {
				SUCCESS: 'Bot has been disconnected.'
			}
		},
		ENQUEUE: {
			NAME: 'enqueue',
			DESC: 'Enqueue a video or playlist to a queue.',
			OPTION: {
				RESOURCE: {
					NAME: 'enqueue',
					DESC: 'A YouTube video URL or ID.'
				},
				TARGET: {
					NAME: 'target',
					DESC: 'Where should the item go? By default it is in a temporary internal queue.',
					CHOICES: {
						SERVER: 'This server (default)',
						USER: 'Your profile'
					}
				}
			},
			RESPONSE: {
				SUCCESS: 'Added `{{title}}` to {{destination}} queue.'
			},
			DESTINATIONS: {
				SERVER: "this server's",
				USER: 'your',
				DEFAULT: 'a temporary'
			},
			ERROR: {
				INTERNAL_ERROR: 'There was an internal server problem.',
				INVALID_RESOURCE: 'The provided resource is invalid.'
			}
		},
		ABOUT: {
			NAME: 'about',
			DESC: 'Get some debug information about the bot.',
			RESPONSE: {
				SUCCESS_EMBED: {
					TITLE: 'About this bot',
					DESCRIPTION: [
						'Free and open source music bot by Jack Wright. It is free and open source!',
						'[View source code on GitHub](https://github.com/jack3898/discord-yt-bot)',
						'Version: {{version}}'
					].join('\n\n')
				}
			}
		},
		MYQUEUE: {
			NAME: 'myqueue',
			DESC: 'Display your queue.',
			RESPONSE: {
				SUCCESS_EMBED: {
					TITLE: 'Your queue',
					ITEM_TITLE: '{{index}}) {{videotitle}}',
					ITEM_TITLE_EMPTY: 'Empty :(',
					ITEM_DETAILS: '[{{channel}}]({{channelurl}}) | `{{views}}` views | [open]({{videourl}}) ',
					ITEM_DETAILS_EMPTY: 'The queue is empty!',
					FOOTER: 'Displaying up to the next {{defaultcount}} items. {{count}} item(s) are in the queue.'
				}
			}
		},
		QUEUE: {
			NAME: 'queue',
			DESC: "Display the server's queue.",
			RESPONSE: {
				SUCCESS_EMBED: {
					TITLE: 'Server queue',
					ITEM_TITLE: '{{index}}) {{videotitle}}',
					ITEM_TITLE_EMPTY: 'Empty :(',
					ITEM_DETAILS: '[{{channel}}]({{channelurl}}) | `{{views}}` views | [open]({{videourl}}) ',
					ITEM_DETAILS_EMPTY: 'The queue is empty!',
					FOOTER: 'Displaying up to the next {{defaultcount}} items. {{count}} item(s) are in the queue.'
				}
			}
		}
	},
	SERVICES: {}
} as const;
