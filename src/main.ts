import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { initStrategies } from './utils/colorStrategies'
import { router } from './router'

initStrategies()

const app = createApp(App)
app.use(router)
app.mount('#app')
