<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <header
    class="glass-panel fixed top-0 z-50 w-full border-b border-border-light dark:border-white/5"
  >
    <div class="section-shell flex h-20 items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex size-10 items-center justify-center rounded-lg bg-primary shadow-[0_0_15px_rgba(0,225,255,0.4)]"
        >
          <span class="text-sm font-black text-background-dark">MS</span>
        </div>
        <span class="text-xl font-bold tracking-tighter text-text-main dark:text-white">
          MA7MOUD SALAMA<span class="text-primary"> -</span>DEV
        </span>
      </div>

      <nav class="hidden items-center gap-10 md:flex">
        <a class="nav-link" href="#about">About</a>
        <a class="nav-link" href="#skills">Expertise</a>
        <a class="nav-link" href="#projects">Projects</a>
        <a class="nav-link" href="#media-center">Media Center</a>
        <a class="nav-link" href="#contact">Contact</a>
      </nav>

      <div class="flex items-center gap-4">
        <button
          class="group flex h-11 w-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-all duration-300 hover:border-primary hover:bg-primary/20"
          type="button"
          aria-label="Toggle theme"
          @click="toggleTheme"
        >
          <span class="material-symbols-outlined" v-if="!isDark">light_mode</span>
          <span class="material-symbols-outlined" v-else>dark_mode</span>
        </button>

        <a
          href="#contact"
          class="hidden h-11 items-center rounded-lg bg-primary px-6 text-sm font-bold uppercase tracking-wider text-background-dark shadow-[0_0_20px_rgba(0,225,255,0.2)] transition-all hover:brightness-110 sm:flex"
        >
          MS -Dev Store
        </a>
      </div>
    </div>
  </header>
</template>
