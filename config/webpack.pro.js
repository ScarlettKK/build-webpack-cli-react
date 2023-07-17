/**
 * 开发模式到生产模式到配置变化：
 * 1. 输出路径需要配置
 * 2. 输出名称需要配置[contenthash:10]
 * 3. 配置clean: true
 * 4. 提取样式成单独文件:mini-css-extract-plugin，并且对样式文件进行压缩:cssMinimizerWebpackPlugin
 * 5. 如果css设置了压缩，js代码也要设置压缩:TerserWebpackPlugin,否则会有点问题
 *    问题：会警告：
 *    WARNING in asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).
 *    This can impact web performance.
 * 6. 删除dev server
 * 7. 改mode
 * 8. devtool改成source-map
 * 9. 删除HMR相关代码
 * 10. 图片压缩插件:image-minimizer-webpack-plugin
 * 11. 解决网站图标问题：copy-webpack-plugin
 */

const path = require('path')
const EslintWebpackPlugin = require('eslint-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin') // webpack 自带，无需npm i
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin')
const CopyPlugin = require("copy-webpack-plugin"); // 处理类似html网页icon打包后丢失的问题，按照原路径复制


// 返回处理样式loader的函数
const getStyleLoaders = (pre) => {
    return [
        MiniCssExtractPlugin.loader,
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
        path: path.resolve(__dirname, '../dist'),
        filename: 'js/[name].[contenthash:10].js',
        chunkFilename: 'js/[name].[contenthash:10].chunk.js',
        assetModuleFilename: 'media/[contenthash:10][ext][query]',
        clean: true
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
        new MiniCssExtractPlugin({
            filename: 'styles/[name].[contenthash:10].css',
            chunkFilename: 'styles/[name].[contenthash:10].css'
        }),
        // 将assets下面的资源复制到assets目录去（除了index.html，不过这里没有这个问题）
        // 这里用于html文件中引用的网页图标处理，不处理的话图标不会被打包
        new CopyPlugin({
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
    ],
    mode: 'production',
    devtool: 'source-map',
    optimization: {
        splitChunks: { // 代码分割，主要是是node_modules以及动态导入的代码
            chunks: 'all'
        },
        runtimeChunk: { // runtime 配置文件名称
            name: entrypoint => `runtime-${entrypoint.name}.js`
        },
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
}
