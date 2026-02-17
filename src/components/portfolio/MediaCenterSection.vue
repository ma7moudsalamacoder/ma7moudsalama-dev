<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { usePortfolioData } from '@/composables/usePortfolioData'

const MAX_MEDIA_ITEMS = 10

type MediaVideo = {
  id?: string
  platform: string
  title: string
  embedUrl: string
  videoUrl: string
  thumbnailUrl: string
}

const { mediaVideos: allMediaVideos } = usePortfolioData()
const mediaVideos = computed(() => allMediaVideos.value.slice(0, MAX_MEDIA_ITEMS))

const carouselRef = ref<HTMLElement | null>(null)
const selectedVideo = ref<MediaVideo | null>(null)
const modalOpen = computed(() => selectedVideo.value !== null)

function openVideo(video: MediaVideo) {
  selectedVideo.value = video
}

function closeVideo() {
  selectedVideo.value = null
}

function handleEsc(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeVideo()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEsc)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEsc)
})

const activeEmbedUrl = computed(() => {
  if (!selectedVideo.value) return ''

  const separator = selectedVideo.value.embedUrl.includes('?') ? '&' : '?'
  return `${selectedVideo.value.embedUrl}${separator}autoplay=1`
})

function scrollCarousel(direction: 'left' | 'right') {
  const carousel = carouselRef.value
  if (!carousel) return

  const card = carousel.querySelector<HTMLElement>('article')
  const offset = card ? card.offsetWidth + 24 : 420
  const left = direction === 'left' ? -offset : offset

  carousel.scrollBy({ left, behavior: 'smooth' })
}
</script>

<template>
  <section id="media-center" class="relative bg-white py-24 dark:bg-surface-dark">
    <div class="section-shell">
      <div v-reveal class="mb-16 text-center">
        <h2 class="section-kicker">Media Center</h2>
        <h3 class="section-heading">YouTube & TikTok Highlights</h3>
      </div>

      <div v-reveal="80" class="mb-8 flex justify-end gap-3">
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-all duration-300 hover:border-primary hover:bg-primary/20"
          aria-label="Scroll media carousel left"
          @click="scrollCarousel('left')"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-all duration-300 hover:border-primary hover:bg-primary/20"
          aria-label="Scroll media carousel right"
          @click="scrollCarousel('right')"
        >
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      <div
        ref="carouselRef"
        v-reveal="120"
        class="no-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4"
      >
        <article
          v-for="video in mediaVideos"
          :key="video.id ?? video.title"
          class="project-card w-[72%] shrink-0 snap-start overflow-hidden sm:w-[24rem]"
        >
          <button
            type="button"
            class="w-full text-left"
            :aria-label="`Open ${video.title}`"
            @click="openVideo(video)"
          >
            <div class="relative">
              <img
                :src="video.thumbnailUrl"
                :alt="video.title"
                class="aspect-video w-full object-cover"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-black/30 transition-colors hover:bg-black/20" />
              <span
                class="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-3xl text-black"
              >
                play_arrow
              </span>
            </div>
            <div class="p-5">
              <span class="chip">{{ video.platform }}</span>
              <h4 class="mt-3 text-lg font-bold text-text-main dark:text-white">{{ video.title }}</h4>
            </div>
          </button>
        </article>
      </div>
    </div>

    <div
      v-if="modalOpen"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 px-4 py-10"
      @click.self="closeVideo"
    >
      <div class="w-full max-w-4xl overflow-hidden rounded-xl border border-primary/30 bg-background-light dark:bg-background-dark">
        <div class="flex items-center justify-between border-b border-border-light px-4 py-3 dark:border-border-dark">
          <h4 class="text-sm font-bold uppercase tracking-wider text-text-main dark:text-white">
            {{ selectedVideo?.title }}
          </h4>
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
            aria-label="Close media modal"
            @click="closeVideo"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <iframe
          v-if="selectedVideo"
          :src="activeEmbedUrl"
          :title="selectedVideo.title"
          class="aspect-video w-full border-0 bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        />
      </div>
    </div>
  </section>
</template>
