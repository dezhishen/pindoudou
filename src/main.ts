import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { initStrategies } from './utils/colorStrategies'

// 初始化颜色匹配策略（触发自注册 + 同步兼容层）
initStrategies()

createApp(App).mount('#app')
