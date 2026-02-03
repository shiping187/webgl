import { createApp } from 'vue'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import App from './App.vue'
import './styles/main.css'

// 导入所有shader示例组件
import Home from './views/Home.vue'
import ShaderDemo from './views/ShaderDemo.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/shader/:id', component: ShaderDemo, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
