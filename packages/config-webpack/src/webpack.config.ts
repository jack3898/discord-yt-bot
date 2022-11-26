import { ROOT_NODE_MODULES } from '@yt-bot/constants';
import { Configuration as WebpackConfig } from 'webpack';

export const webpackConfig: WebpackConfig = {
	mode: 'production',
	devtool: 'source-map',
	resolve: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
	resolveLoader: { modules: [ROOT_NODE_MODULES] },
	performance: { hints: false }
};
