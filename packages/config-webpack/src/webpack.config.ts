import { ENV } from '@yt-bot/constants';
import type { Configuration as WebpackConfig } from 'webpack';

const isLocal = /^(@yt-bot|\.\/|\.\.)/;

export const webpackConfig: WebpackConfig = {
	mode: 'production',
	devtool: 'source-map',
	resolve: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
	resolveLoader: { modules: [ENV.ROOT_NODE_MODULES] },
	performance: { hints: false },
	externals: [
		({ request: moduleName = '' }, callback) => {
			// "If the package is local, bundle it."
			if (isLocal.test(moduleName)) {
				console.log(`📦 ${moduleName} (bundled)`);
				return callback();
			}

			console.log(`👽 ${moduleName} (external)`);
			callback(undefined, `commonjs ${moduleName}`);
		}
	],
	ignoreWarnings: [
		{
			// Because the bot uses await import()
			message: /the request of a dependency is an expression/
		}
	]
};
