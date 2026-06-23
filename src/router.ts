import { createRouter, createWebHashHistory } from 'vue-router'
import MainPage from '@/pages/MainPage.vue'
import TermsPage from '@/pages/Terms.vue'

const routes = [
  { path: '/', component: MainPage },
  { path: '/terms', component: TermsPage },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
