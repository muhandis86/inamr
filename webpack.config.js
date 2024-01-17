'use strict';

const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const fs = require('fs');

let entry = {
    app: './app',
}

if (fs.existsSync(__dirname + '/assets/mobile.js')) {
    entry.mobile = './mobile';
}

module.exports = function (env) {
    let config = {
        mode: env,
        context: __dirname + '/assets',
        entry: entry,
        output: {
            path: __dirname + '/public',
            filename: '[name].bundle.js',
            chunkFilename: '[name].[chunkhash].js',
            library: '[name]',
            publicPath: '/bundles/webpack/'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                },
                {
                    test: require.resolve('moment'),
                    use: {
                        loader: 'expose-loader',
                        options: {
                            exposes: ['moment'],
                        },
                    },
                },
                {
                    test: require.resolve('tippy.js'),
                    use: {
                        loader: 'expose-loader',
                        options: {
                            exposes: ['tippy'],
                        },
                    },
                },
            ],
            noParse: function (content) {
                return /owl.carousel/.test(content);
            }
        },
        resolve: {
            modules: [
                __dirname + '/public/node_modules',
                __dirname + '/assets/blocks',
                __dirname + '/assets/js',
                'node_modules'
            ]
        },
        devtool: 'source-map',
        optimization: {
            splitChunks: {
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendor',
                        chunks: 'all',
                        minSize: 30000,
                    },
                },
            },
        },
        plugins: [
            new CleanWebpackPlugin({ cleanOnceBeforeBuildPatterns: [__dirname + '/public/bundles/webpack'] }),
            new webpack.SourceMapDevToolPlugin({
                filename: '[name].bundle.map',
                // exclude: ['vendor.bundle.js']
            })
        ]
    };

    return config;
};
