/* eslint-disable @typescript-eslint/no-explicit-any */
import { Configuration as WebpackConfig, Stats, webpack } from 'webpack';
import { webpackConfig } from './webpack.config';

/**
 * Run a webpack bundle without the dev server. Used for deployment and pipelines.
 */
export const bundler = (webpackOverrides?: WebpackConfig) => webpack(Object.assign(webpackConfig, webpackOverrides));

export const errorHandler: Parameters<ReturnType<typeof bundler>['run']>[0] = (error: any, stats: Stats | undefined) => {
	if (error) {
		console.error(error.stack || error);

		if (error.details) {
			console.error(error.details);
		}

		process.exit(1);
	}

	const info = stats?.toJson();

	if (stats?.hasErrors()) {
		console.error(info?.errors);

		process.exit(1);
	}

	if (stats?.hasWarnings()) {
		console.warn(info?.warnings);
	}
};

export * from './webpack.config';
