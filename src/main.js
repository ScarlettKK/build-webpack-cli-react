import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';

import App from './App'

// antd v4主题配置如果一直不生效，是因为这里写成了import antd/dist/antd.css
// 注意因为主题配置项是写在less loader里面的，所以应该import antd/dist/antd.less
// 这里用的是v5版本，不用单独import antd样式文件

const root = ReactDOM.createRoot(document.getElementById('app'));
root.render(<BrowserRouter>
    <App />
</BrowserRouter>)