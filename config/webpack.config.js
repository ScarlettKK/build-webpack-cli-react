/**
 * 合并dev跟pro代码相同的部分，减少重复代码
 */

const path = require('path')
const EslintWebpackPlugin = require('eslint-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin') // webpack 自带，无需npm i
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin"); // 处理类似html网页icon打包后丢失的问题，按照原路径复制
// react jsx代码热更新插件
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

// 获取process env定义的环境变量
const isProduction = process.env.NODE_ENV === 'production'


// 返回处理样式loader的函数
const getStyleLoaders = (pre) => {
    return [
        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
        'css-loader',
        // postcss: 处理样式兼容性问题，具体兼容程度需要在package.json中配置browserslist
        {
            loader: 'postcss-loader',
            options: {
                postcssOptions: {
                    plugins: [
                        'postcss-preset-env'
                    ]
                }
            }
        },
        pre
    ].filter(Boolean)
}

module.exports = {
    entry: './src/main.js',
    output: {
        path: isProduction ? path.resolve(__dirname, '../dist') : undefined,
        filename: isProduction ? 'js/[name].[contenthash:10].js' : 'js/[name].js',
        chunkFilename: isProduction ? 'js/[name].[contenthash:10].chunk.js' : 'js/[name].chunk.js',
        assetModuleFilename: isProduction ? 'media/[contenthash:10][ext][query]' : 'media/[ext][query]',
        clean: true // 这里pro跟dev都可以用
    },
    module: {
        rules: [
            // css
            {
                test: /\.css$/,
                use: getStyleLoaders()
            },
            // less
            {
                test: /\.less$/,
                use: getStyleLoaders('less-loader')
            },
            // image
            {
                test: /\.(jpe?g|png|gif|webp|svg)$/,
                type: 'asset', // 可以转base64
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024, // 体积小于10kb，转成base64 url
                    }
                }
            },
            // font
            {
                test: /\.(woff2?|ttf)/,
                type: 'asset/resource' // 不可以转base64，原封不动输出
            },
            // js
            {
                test: /\.jsx?$/,
                include: path.resolve(__dirname, '../src'),
                loader: 'babel-loader', // 其他配置用了babel-preset-react-app，不用自己操心
                options: {
                    cacheDirectory: true,
                    cacheCompression: false,
                    plugins: [
                        !isProduction && "react-refresh/babel", // 激活js的HMR功能
                    ].filter(Boolean)
                }
            }
        ]

    },
    // plugins
    plugins: [
        new EslintWebpackPlugin({
            context: path.resolve(__dirname, '../src'),
            exclude: 'node_modules',
            cache: true,
            cacheLocation: path.resolve(__dirname, '../node_modules/.cache/.eslintcache')
        }),
        // html
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html')
        }),
        // 提取样式成单独文件
        isProduction && new MiniCssExtractPlugin({
            filename: 'styles/[name].[contenthash:10].css',
            chunkFilename: 'styles/[name].[contenthash:10].css'
        }),
        // 将assets下面的资源复制到assets目录去（除了index.html，不过这里没有这个问题）
        // 这里用于html文件中引用的网页图标处理，不处理的话图标不会被打包
        isProduction && new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "../src/assets"),
                    to: path.resolve(__dirname, "../dist/assets"),
                    toType: "dir",
                    noErrorOnMissing: true, // 不生成错误
                    globOptions: {
                        // 忽略文件，有的时候网页图标会跟index.html放在一起（但是目前这里没有）
                        ignore: ["**/index.html"],
                    },
                    info: {
                        // 跳过terser压缩js
                        minimized: true,
                    },
                },
            ],
        }),
        // HMR
        !isProduction && new ReactRefreshWebpackPlugin()
    ].filter(Boolean),
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    optimization: {
        splitChunks: { // 代码分割，主要是是node_modules以及动态导入的代码
            chunks: 'all'
        },
        runtimeChunk: { // runtime 配置文件名称
            name: entrypoint => `runtime-${entrypoint.name}.js`
        },
        // 控制是否开启 minimize，为false minimizer配置失效
        minimize: isProduction,
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserWebpackPlugin(),
            new ImageMinimizerPlugin({
                minimizer: {
                    implementation: ImageMinimizerPlugin.imageminGenerate,
                    options: {
                        plugins: [
                            ["gifsicle", { interlaced: true }],
                            ["jpegtran", { progressive: true }],
                            ["optipng", { optimizationLevel: 5 }],
                            [
                                "svgo",
                                {
                                    plugins: [
                                        "preset-default",
                                        "prefixIds",
                                        {
                                            name: "sortAttrs",
                                            params: {
                                                xmlnsOrder: "alphabetical",
                                            },
                                        },
                                    ],
                                },
                            ],
                        ],
                    },
                },
            }),
        ]
    },
    // webpack解析模块加载选项
    resolve: {
        // 自动补全文件扩展名（路径后缀自动补全，如import from main，不用写main.js）
        extensions: ['.jsx', '.js', '.json']
    },
    // 这里可以跟生产模式放在一起，因为需要命令行加一个serve选项，而run build没有serve
    devServer: {
        host: 'localhost',
        port: 3001,
        open: true,
        hot: true, // 热模块替换，需要先开启这个 ReactRefreshWebpackPlugin 才有用
        // 解决react-router刷新404问题（有后缀路径的时候）
        // 因为打包生成文件只有一个index.html，然后下面js、css，并没有资源叫home/about
        // 开启这一项，就可以让刷新的时候，无论网站路径如何，都返回index.html
        // 一旦404，重定向到index.html
        // 后面由index.html中加载的js代码自己匹配路由处理
        historyApiFallback: true,
    }
}
