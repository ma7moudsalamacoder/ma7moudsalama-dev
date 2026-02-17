import { createRouter, createWebHistory } from 'vue-router'

import { auth, authReady } from '@/lib/firebase'
import { trackWebsiteVisit } from '@/lib/websiteAnalytics'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  await authReady

  const isAuthenticated = auth.currentUser !== null

  if (to.meta.requiresAuth && !isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

router.afterEach((to) => {
  if (to.meta.requiresAuth || to.name === 'login') return

  void trackWebsiteVisit(to.fullPath).catch((error) => {
    console.warn('[analytics] Failed to track website visit.', error)
  })
})

export default router
