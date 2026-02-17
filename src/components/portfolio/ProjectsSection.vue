<script setup lang="ts">
import { usePortfolioData } from '@/composables/usePortfolioData'

const { projects } = usePortfolioData()
</script>

<template>
  <section id="projects" class="relative bg-white py-24 dark:bg-surface-dark">
    <div class="section-shell">
      <div v-reveal class="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div v-reveal="80">
          <h2 class="section-kicker">Selected Works</h2>
          <h3 class="section-heading">Recent Deployments</h3>
        </div>
        <a v-reveal="140" class="flex items-center gap-2 font-bold text-primary hover:underline" href="#">
          EXPLORE ALL GITHUB REPOS <span class="material-symbols-outlined">north_east</span>
        </a>
      </div>

      <div class="grid gap-8 md:grid-cols-2">
        <article
          v-for="(project, index) in projects"
          :key="project.id ?? project.title"
          v-reveal="index * 110"
          class="project-card group"
        >
          <div class="aspect-video bg-gradient-to-br from-primary/10 via-background-light to-surface-light dark:via-background-dark dark:to-surface-dark" />
          <div class="p-8">
            <div class="mb-4 flex gap-2">
              <span v-for="tag in project.tags" :key="tag" class="chip">{{ tag }}</span>
            </div>
            <h4 class="mb-2 text-2xl font-bold text-text-main dark:text-white">{{ project.title }}</h4>
            <p class="mb-6 text-text-muted dark:text-slate-500">{{ project.description }}</p>
            <a
              class="inline-flex items-center gap-2 text-sm font-bold text-text-main transition-colors group-hover:text-primary dark:text-white"
              :href="project.link || '#'"
              target="_blank"
              rel="noopener noreferrer"
            >
              VIEW CASE STUDY <span class="material-symbols-outlined text-base">arrow_forward</span>
            </a>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
