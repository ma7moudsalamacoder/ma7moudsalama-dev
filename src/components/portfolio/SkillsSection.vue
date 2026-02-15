<script setup lang="ts">
const skillGroups = [
  {
    title: 'Backend',
    icon: 'terminal',
    items: ['Laravel / PHP', 'Node.js / Express', 'Python / Django'],
  },
  {
    title: 'Frontend',
    icon: 'layers',
    items: ['Vue.js / Nuxt', 'React / Next.js', 'Tailwind CSS'],
  },
  {
    title: 'DevOps',
    icon: 'cloud',
    items: ['Docker / Kubernetes', 'CI/CD Pipelines', 'AWS / DigitalOcean'],
  },
  {
    title: 'Databases',
    icon: 'database',
    items: ['PostgreSQL / MySQL', 'Redis / Caching', 'MongoDB'],
  },
]
</script>

<template>
  <section id="skills" class="bg-background-light py-24 dark:bg-background-dark">
    <div class="section-shell">
      <div class="mb-16 text-center">
        <h2 class="section-kicker">Technical Expertise</h2>
        <h3 class="section-heading">Powering The Next Generation</h3>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <article v-for="group in skillGroups" :key="group.title" class="skill-card">
          <div class="skill-icon-wrap">
            <span class="material-symbols-outlined text-3xl">{{ group.icon }}</span>
          </div>
          <h4 class="mb-4 text-xl font-bold text-text-main dark:text-white">{{ group.title }}</h4>
          <ul class="space-y-2 text-text-muted dark:text-slate-400">
            <li v-for="item in group.items" :key="item" class="flex items-center gap-2">
              <span class="size-1.5 rounded-full bg-primary" />{{ item }}
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>
