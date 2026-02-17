import { createRouter, createWebHistory } from 'vue-router'

import { auth, authReady } from '@/lib/firebase'
import { trackWebsiteVisit } from '@/lib/websiteAnalytics'
import HomeView from '@/views/HomeView.vue'

const appTitle = 'MA7MOUD SALAMA - DEV'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'MA7MOUD SALAMA' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: 'MA7MOUD SALAMA | About' },
    },
    {
      path: '/coming-soon',
      name: 'coming-soon',
      component: () => import('@/views/ComingSoonView.vue'),
      meta: { title: 'MA7MOUD SALAMA | Coming Soon' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true, title: 'MA7MOUD SALAMA | Login' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, title: 'MA7MOUD SALAMA | Dashboard' },
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
  const routeTitle = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = routeTitle ? `${routeTitle} | ${appTitle}` : appTitle

  if (to.meta.requiresAuth || to.name === 'login') return

  void trackWebsiteVisit(to.fullPath).catch((error) => {
    console.warn('[analytics] Failed to track website visit.', error)
  })
})

export default router
