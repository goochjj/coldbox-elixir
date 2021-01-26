const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const styleLoaders = require("./utils/styleLoaders");
const { ProgressPlugin, EnvironmentPlugin } = require("webpack");
const { merge } = require("webpack-merge");
const path = require("path");
const fs = require("fs");

const dotEnvFile = path.resolve(process.cwd(), ".env");
if (fs.existsSync(dotEnvFile)) {
    require("dotenv").config({
        path: dotEnvFile
    });
}

module.exports = () => ({
    mode: global.elixir.isProduction ? "production" : "development",
    output: {
        path: global.elixir.rootPath,
        publicPath: "/",
        filename: global.elixir.versioning
            ? "[name].[chunkhash].js"
            : "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: merge(global.elixir.config.babelOptions, {
                    presets: [
                        [
                            "@babel/preset-env",
                            {
                                modules: false,
                                targets: {
                                    browsers: ["> 2%"]
                                }
                            }
                        ]
                    ],
                    plugins: ["@babel/plugin-proposal-object-rest-spread"]
                })
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
		type: 'asset',
		parser: {
			dataUrlCondition: {
				maxSize: 10000
			}
		},
		generator: {
                    filename: global.elixir.versioning
                        ? "images/[name].[contenthash:7].[ext]"
                        : "images/[name].[ext]"
                }
            },
            {
                test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
		type: 'asset',
		parser: {
			dataUrlCondition: {
				maxSize: 10000
			}
		},
		generator: {
                    filename: global.elixir.versioning
                        ? "media/[name].[contenthash:7].[ext]"
                        : "media/[name].[ext]"
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
		type: 'asset',
		parser: {
			dataUrlCondition: {
				maxSize: 1000
			}
		},
		generator: {
                    filename: global.elixir.versioning
                        ? "fonts/[name].[contenthash:7].[ext]"
                        : "fonts/[name].[ext]"
                }
            }
        ].concat(
            styleLoaders({
                sourceMap: true,
                extract: true
            })
        )
    },
    devtool: global.elixir.isProduction
        ? "#source-map"
        : "eval-cheap-module-source-map",
    resolve: {
        extensions: [".js", ".json"],
        alias: {
            "@": path.join(global.elixir.rootPath, "resources/assets/js")
        },
	fallback: {
        // prevent webpack from injecting mocks to Node native modules
        // that does not make sense for the client
        dgram: false,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
	setImmediate: false
	}
    },
    plugins: [
        new ProgressPlugin(),
        // add these based on what features are enabled
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [
                global.elixir.manifestFileName,
                global.elixir.runtimeFileNameWithoutExtension,
                global.elixir.vendorChunkFileNameWithoutExtension
            ]
        }),
/*        new WebpackManifestPlugin({
            fileName: global.elixir.manifestFileName
        }),*/
        new MiniCssExtractPlugin({
            filename: global.elixir.versioning
                ? "[name].[contenthash].css"
                : "[name].css"
        }),
        new EnvironmentPlugin({
            "NODE_ENV": global.elixir.isProduction ? "production" : "development"
        }),
    ],
    stats: {
        children: false
    },
    optimization: {
        runtimeChunk: {
            name: global.elixir.runtimeFileNameWithoutExtension
        },
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: (m, c, entry) => {
                        return (
                            m.constructor.name !== "CssModule" &&
                            /[\\/]node_modules[\\/]/.test(m.resource)
                        );
                    },
                    name: global.elixir.vendorChunkFileNameWithoutExtension,
                    enforce: true,
                    chunks: "all"
                }
            }
        },
        minimizer: [
            new TerserPlugin({
                parallel: true,
            }),
            new CssMinimizerPlugin({})
        ]
    },
});
