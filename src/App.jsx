import React, { Suspense, lazy } from 'react'
import { Link, Route, Routes } from 'react-router-dom'

import { Button, ConfigProvider } from 'antd'

const Home = lazy(() => import(/* webpackChunkName: 'home' */'./Home'))
const About = lazy(() => import(/* webpackChunkName: 'about' */'./About'))

function App() {
    // 新的配置主题色的方法
    return <ConfigProvider 
        theme={{
            token: {
              colorPrimary: '#00b96b',
            },
        }}
    >
        <h1>App</h1>
        <Button type='primary'>
            <Link to={'/home'}>Home</Link>
        </Button>
        <Button>
            <Link to={'/about'}>About</Link>
        </Button>

        {/* fallback: 加载中显示什么 */}
        {/* 下面代码可以达到动态导入分开打包的效果 */}
        <Suspense fallback={<div>loading...</div>}>
            <Routes>
                <Route path='/home' element={<Home />} />
                <Route path='/about' element={<About />} />
            </Routes>
        </Suspense>
    </ConfigProvider>
};

export default App