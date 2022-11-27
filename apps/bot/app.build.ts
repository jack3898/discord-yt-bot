import { bundler, errorHandler } from '@yt-bot/config-webpack';
import path from 'path';

/**
 * tsc was avoided because packages in this monorepo are pure typescript, and the js output would import ts files.
 */

export const webpackBackendConfig: Parameters<typeof bundler>[0] = {
	entry: './src/index.ts',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'app.js'
	},
	target: 'node',
	externalsPresets: {
		node: true
	},
	externals: {
		'discord.js': 'commonjs discord.js',
		'@discordjs/voice': 'commonjs @discordjs/voice',
		'prism-media': 'commonjs prism-media'
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: [
					{
						loader: 'ts-loader',
						options: { transpileOnly: true }
					}
				]
			}
		]
	}
};

bundler(webpackBackendConfig).run(errorHandler);
