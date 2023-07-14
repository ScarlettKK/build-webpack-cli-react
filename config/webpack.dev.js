const path = require('path')
const EslintWebpackPlugin = require('eslint-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')

// 返回处理样式loader的函数
const getStyleLoaders = (pre) => {
    return [
        'style-loader',
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
        path: undefined, // 开发模式无输出，可以是undefined
        filename: 'js/[name].js',
        chunkFilename: 'js/[name].chunk.js',
        assetModuleFilename: 'media/[hash:10][ext][query]'
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
                    cacheCompression: false
                }
            }
        ]

    },
    // plugins
    plugins: [
        new EslintWebpackPlugin({
            context: path.resolve(__dirname, '../src'),
            excludes: 'node_modules',
            cache: true,
            cacheLocation: path.resolve(__dirname, '../node_modules/.cache/.eslintcache')
        }),
        // html
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html')
        })
    ],
    mode: 'development',
    devtool: 'cheap-module-source-map',
    optimization: {
        splitChunks: { // 代码分割，主要是是node_modules以及动态导入的代码
            chunks: 'all'
        },
        runtimeChunk: { // runtime 配置文件名称
            name: entrypoint => `runtime-${entrypoint.name}.js`
        }
    },
    devServer: {
        host: 'localhost',
        port: 3000,
        open: true,
        hot: true // 热模块替换
    }
}
