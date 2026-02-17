<script setup lang="ts">
import { signInWithEmailAndPassword } from 'firebase/auth'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { auth } from '@/lib/firebase'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/dashboard'
})

async function handleLogin() {
  errorMessage.value = ''
  loading.value = true

  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
    await router.push(redirectPath.value)
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Login failed. Check your email and password and try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main
    class="circuit-bg relative flex min-h-screen items-center justify-center overflow-hidden bg-background-light px-6 py-10 dark:bg-background-dark"
  >
    <div class="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-primary/15 blur-[130px]" />
    <div
      class="pointer-events-none absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-cyan-300/20 blur-[140px] dark:bg-primary/10"
    />

    <section class="glass-panel relative z-10 w-full max-w-md rounded-2xl p-8 shadow-tech">
      <p class="section-kicker">Admin Access</p>
      <h1 class="mb-2 text-3xl font-black tracking-tight text-text-main dark:text-white">Dashboard Login</h1>
      <p class="mb-8 text-sm text-text-muted dark:text-slate-400">
        Sign in with your Firebase Authentication email and password.
      </p>

      <form class="space-y-5" @submit.prevent="handleLogin">
        <label class="block">
          <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted dark:text-slate-400">Email</span>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-sm text-text-main outline-none transition focus:border-primary dark:border-border-dark dark:bg-surface-dark dark:text-white"
            placeholder="name@example.com"
          />
        </label>

        <label class="block">
          <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted dark:text-slate-400">Password</span>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full rounded-lg border border-border-light bg-white px-4 py-3 text-sm text-text-main outline-none transition focus:border-primary dark:border-border-dark dark:bg-surface-dark dark:text-white"
            placeholder="••••••••"
          />
        </label>

        <p v-if="errorMessage" class="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ errorMessage }}
        </p>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="loading">Signing In...</span>
          <span v-else>Sign In</span>
        </button>
      </form>
    </section>
  </main>
</template>
