import { bundler, errorHandler } from '@yt-bot/config-webpack';
import path from 'path';

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
		// Prisma goes here soon
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
