import React, { Suspense, lazy } from 'react'
import { Link, Route, Routes } from 'react-router-dom'


const Home = lazy(() => import(/* webpackChunkName: 'home' */'./Home'))
const About = lazy(() => import(/* webpackChunkName: 'about' */'./About'))

function App() {
    return <>
        <h1>App</h1>

        <ul>
            <li>
                <Link to={'/home'}>Home</Link>
            </li>
            <li>
                <Link to={'/about'}>About</Link>
            </li>
        </ul>
        {/* fallback: 加载中显示什么 */}
        {/* 下面代码可以达到动态导入分开打包的效果 */}
        <Suspense fallback={<div>loading...</div>}>
            <Routes>
                <Route path='/home' element={<Home />} />
                <Route path='/about' element={<About />} />
            </Routes>
        </Suspense>
    </>
};

export default App