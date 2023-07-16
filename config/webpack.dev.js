const path = require('path')
const EslintWebpackPlugin = require('eslint-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')
// react jsx代码热更新插件
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

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
                    cacheCompression: false,
                    plugins: [
                        "react-refresh/babel", // 激活js的HMR功能
                    ]
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
        // HMR
        new ReactRefreshWebpackPlugin()
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
    // webpack解析模块加载选项
    resolve: {
        // 自动补全文件扩展名（路径后缀自动补全，如import from main，不用写main.js）
        extensions: ['.jsx', '.js', '.json']
    },
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
