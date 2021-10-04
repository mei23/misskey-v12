/**
 * webpack configuration
 */

import * as fs from 'fs';
import * as webpack from 'webpack';
import rndstr from 'rndstr';
const { VueLoaderPlugin } = require('vue-loader');
const TerserPlugin = require('terser-webpack-plugin');

class WebpackOnBuildPlugin {
	constructor(readonly callback: (stats: any) => void) {
	}

	public apply(compiler: any) {
		compiler.hooks.done.tap('WebpackOnBuildPlugin', this.callback);
	}
}

const isProduction = process.env.NODE_ENV === 'production';

const locales = require('./locales');
const meta = require('./package.json');

//const version = isProduction ? meta.version : meta.version + '-' + rndstr({ length: 8, chars: '0-9a-z' });
const version = meta.version;

const postcss = {
	loader: 'postcss-loader',
	options: {
		postcssOptions: {
			plugins: [
				require('cssnano')({
					preset: 'default'
				})
			]
		}
	},
};

module.exports = {
	entry: {
		app: './src/client/init.ts',
		sw: './src/client/sw/sw.ts'
	},
	module: {
		rules: [{
			test: /\.vue$/,
			exclude: /node_modules/,
			use: [{
				loader: 'vue-loader',
				options: {
					cssSourceMap: false,
					compilerOptions: {
						preserveWhitespace: false
					}
				}
			}]
		}, {
			test: /\.scss?$/,
			exclude: /node_modules/,
			oneOf: [{
				resourceQuery: /module/,
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader',
					options: {
						modules: true,
						esModule: false, // TODO: trueにすると壊れる。Vue3移行の折にはtrueにできるかもしれない
						url: false,
					}
				}, postcss, {
					loader: 'sass-loader',
					options: {
						implementation: require('sass'),
						sassOptions: {
							fiber: false
						}
					}
				}]
			}, {
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader',
					options: {
						url: false,
						esModule: false, // TODO: trueにすると壊れる。Vue3移行の折にはtrueにできるかもしれない
					}
				}, postcss, {
					loader: 'sass-loader',
					options: {
						implementation: require('sass'),
						sassOptions: {
							fiber: false
						}
					}
				}]
			}]
		}, {
			test: /\.css$/,
			oneOf: [{
				resourceQuery: /module/,
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader',
					options: {
						modules: true,
						esModule: false, // TODO: trueにすると壊れる。Vue3移行の折にはtrueにできるかもしれない
					}
				}, postcss]
			}, {
				use: [{
					loader: 'vue-style-loader'
				}, {
					loader: 'css-loader',
					options: {
						esModule: false, // TODO: trueにすると壊れる。Vue3移行の折にはtrueにできるかもしれない
					}
				}, postcss]
			}]
		}, {
			test: /\.svg$/,
			use: [
				'vue-loader',
				'vue-svg-loader',
			],
		}, {
			test: /\.(eot|woff|woff2|svg|ttf)([?]?.*)$/,
			type: 'asset/resource'
		}, {
			test: /\.json5$/,
			loader: 'json5-loader',
			options: {
				esModule: false,
			},
			type: 'javascript/auto'
		}, {
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				loader: 'ts-loader',
				options: {
					happyPackMode: true,
					transpileOnly: true,
					configFile: __dirname + '/src/client/tsconfig.json',
					appendTsSuffixTo: [/\.vue$/]
				}
			}]
		}]
	},
	plugins: [
		new webpack.ProgressPlugin({}),
		new webpack.DefinePlugin({
			_VERSION_: JSON.stringify(version),
			_LANGS_: JSON.stringify(Object.entries(locales).map(([k, v]: [string, any]) => [k, v._lang_])),
			_ENV_: JSON.stringify(process.env.NODE_ENV),
			_DEV_: process.env.NODE_ENV !== 'production',
			_PERF_PREFIX_: JSON.stringify('Misskey:'),
			_DATA_TRANSFER_DRIVE_FILE_: JSON.stringify('mk_drive_file'),
			_DATA_TRANSFER_DRIVE_FOLDER_: JSON.stringify('mk_drive_folder'),
			_DATA_TRANSFER_DECK_COLUMN_: JSON.stringify('mk_deck_column'),
			__VUE_OPTIONS_API__: true,
			__VUE_PROD_DEVTOOLS__: false,
		}),
		new VueLoaderPlugin(),
		new WebpackOnBuildPlugin((stats: any) => {
			fs.writeFileSync('./built/meta.json', JSON.stringify({ version }), 'utf-8');
		}),
	],
	output: {
		path: __dirname + '/built/assets',
		filename: `[name].${version}.js`,
		publicPath: `/assets/`,
		pathinfo: false,
	},
	resolve: {
		extensions: [
			'.js', '.ts', '.json'
		],
		alias: {
			'@client': __dirname + '/src/client',
			'@lib': __dirname + '/lib',
			'@': __dirname + '/src',
			'const.styl': __dirname + '/src/client/const.styl'
		}
	},
	resolveLoader: {
		modules: ['node_modules']
	},
	experiments: {
		topLevelAwait: true
	},
	optimization: {
		minimizer: [new TerserPlugin({
			parallel: 1
		})]
	},
	devtool: false, //'source-map',
	mode: isProduction ? 'production' : 'development'
};
