<script setup lang="ts">
import { animate } from 'framer-motion/dom'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const headingRef = ref<HTMLElement | null>(null)
const textRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)
const orbLeftRef = ref<HTMLElement | null>(null)
const orbRightRef = ref<HTMLElement | null>(null)
const animations: Array<{ stop: () => void }> = []

function backHome() {
  void router.push('/')
}

onMounted(() => {
  if (headingRef.value) {
    animations.push(
      animate(
        headingRef.value,
        { opacity: [0, 1], y: [26, 0], filter: ['blur(8px)', 'blur(0px)'] },
        { duration: 0.75, easing: [0.22, 1, 0.36, 1] },
      ),
    )
  }

  if (textRef.value) {
    animations.push(
      animate(
        textRef.value,
        { opacity: [0, 1], y: [18, 0] },
        { duration: 0.65, delay: 0.18, easing: 'ease-out' },
      ),
    )
  }

  if (buttonRef.value) {
    animations.push(
      animate(
        buttonRef.value,
        { opacity: [0, 1], y: [16, 0], scale: [0.96, 1] },
        { duration: 0.55, delay: 0.35, easing: 'ease-out' },
      ),
    )
    animations.push(
      animate(
        buttonRef.value,
        { y: [0, -4, 0] },
        { duration: 2.6, delay: 1.1, repeat: Infinity, easing: 'ease-in-out' },
      ),
    )
  }

  if (orbLeftRef.value) {
    animations.push(
      animate(
        orbLeftRef.value,
        { x: [0, 18, 0], y: [0, -12, 0], scale: [1, 1.06, 1] },
        { duration: 8, repeat: Infinity, easing: 'ease-in-out' },
      ),
    )
  }

  if (orbRightRef.value) {
    animations.push(
      animate(
        orbRightRef.value,
        { x: [0, -16, 0], y: [0, 10, 0], scale: [1, 1.05, 1] },
        { duration: 9, repeat: Infinity, easing: 'ease-in-out' },
      ),
    )
  }
})

onBeforeUnmount(() => {
  animations.forEach((animation) => animation.stop())
})
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-background-light px-6 py-20 dark:bg-background-dark">
    <div
      ref="orbLeftRef"
      class="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-primary/25 blur-[110px]"
    />
    <div
      ref="orbRightRef"
      class="pointer-events-none absolute -right-32 bottom-8 h-80 w-80 rounded-full bg-cyan-300/25 blur-[120px] dark:bg-primary/15"
    />

    <section class="mx-auto flex max-w-4xl flex-col items-center text-center">
      <div class="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/40 bg-primary/10 shadow-[0_0_35px_rgba(0,225,255,0.25)]">
        <span class="material-symbols-outlined text-6xl text-primary">rocket_launch</span>
      </div>
      <p class="mb-3 text-xs font-black uppercase tracking-[0.28em] text-primary">New Release</p>
      <h1 ref="headingRef" class="text-balance text-5xl font-black tracking-tight text-text-main opacity-0 dark:text-white sm:text-6xl">
        Store Experience Is Coming Soon
      </h1>
      <p ref="textRef" class="mt-5 max-w-2xl text-lg text-text-muted opacity-0 dark:text-slate-300">
        We are preparing a premium digital storefront for services and apps, with secure APIs, smart analytics, and seamless payments.
      </p>
      <button
        ref="buttonRef"
        class="mt-10 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-black uppercase tracking-wider text-background-dark transition hover:brightness-110"
        @click="backHome"
      >
        Back To Home
      </button>
    </section>
  </main>
</template>
