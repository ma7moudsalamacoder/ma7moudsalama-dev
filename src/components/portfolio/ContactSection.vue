<script setup lang="ts">
import { computed } from 'vue'

import { usePortfolioData } from '@/composables/usePortfolioData'

const { contactDetails } = usePortfolioData()

const links = computed(() => [
  {
    icon: 'mail',
    label: 'Email',
    value: contactDetails.value.email,
    href: contactDetails.value.emailUrl,
  },
  {
    icon: 'link',
    label: 'LinkedIn',
    value: contactDetails.value.linkedin,
    href: contactDetails.value.linkedinUrl,
  },
  {
    icon: 'code',
    label: 'GitHub',
    value: contactDetails.value.github,
    href: contactDetails.value.githubUrl,
  },
  {
    icon: 'share',
    label: 'X / Twitter',
    value: contactDetails.value.twitter,
    href: contactDetails.value.twitterUrl,
  },
])
</script>

<template>
  <section
    id="contact"
    class="relative overflow-hidden bg-background-light py-24 dark:bg-background-dark"
  >
    <div
      class="absolute right-0 top-0 h-full w-1/3 -skew-x-12 translate-x-20 transform bg-primary/5"
    />

    <div class="section-shell relative z-10">
      <div v-reveal class="max-w-3xl">
        <h2 class="section-kicker">Get In Touch</h2>
        <h3 class="mb-8 text-4xl font-bold text-text-main dark:text-white md:text-5xl">
          Let's Build Something Great Together
        </h3>
        <p class="mb-12 text-xl text-text-muted dark:text-slate-400">
          I'm open to new opportunities, collaborations, and complex technical challenges.
        </p>

        <div class="mb-12 grid gap-8 sm:grid-cols-2">
          <a
            v-for="(item, index) in links"
            :key="item.label"
            :href="item.href"
            v-reveal="index * 90"
            class="contact-card"
          >
            <div class="skill-icon-wrap mb-0 size-12">
              <span class="material-symbols-outlined">{{ item.icon }}</span>
            </div>
            <div>
              <p class="text-xs font-bold uppercase text-text-muted dark:text-slate-500">
                {{ item.label }}
              </p>
              <p class="font-medium text-text-main dark:text-white">{{ item.value }}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
