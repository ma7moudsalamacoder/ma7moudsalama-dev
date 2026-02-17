<script setup lang="ts">
import { animate, inView, stagger } from 'framer-motion/dom'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import AboutSection from '@/components/portfolio/AboutSection.vue'
import ContactSection from '@/components/portfolio/ContactSection.vue'
import FloatingStatus from '@/components/portfolio/FloatingStatus.vue'
import HeroSection from '@/components/portfolio/HeroSection.vue'
import MediaCenterSection from '@/components/portfolio/MediaCenterSection.vue'
import PortfolioFooter from '@/components/portfolio/PortfolioFooter.vue'
import PortfolioHeader from '@/components/portfolio/PortfolioHeader.vue'
import ProjectsSection from '@/components/portfolio/ProjectsSection.vue'
import SkillsSection from '@/components/portfolio/SkillsSection.vue'

const sectionRefs = ref<HTMLElement[]>([])
const stopHandlers: Array<() => void> = []
const runningAnimations: Array<{ stop: () => void }> = []

function setSectionRef(el: Element | null) {
  if (el instanceof HTMLElement && !sectionRefs.value.includes(el)) {
    sectionRefs.value.push(el)
  }
}

onMounted(() => {
  if (sectionRefs.value.length === 0) return

  sectionRefs.value.forEach((section, index) => {
    section.style.opacity = index < 2 ? '0' : '1'
    section.style.transform = index < 2 ? 'translateY(24px)' : 'none'
    section.style.willChange = 'opacity, transform'
  })

  runningAnimations.push(
    animate(
      sectionRefs.value.slice(0, 2),
      { opacity: [0, 1], y: [24, 0] },
      { duration: 0.65, delay: stagger(0.12), easing: [0.22, 1, 0.36, 1] },
    ),
  )

  sectionRefs.value.slice(2).forEach((section) => {
    section.style.opacity = '0'
    section.style.transform = 'translateY(28px)'

    const stop = inView(
      section,
      () => {
        const controls = animate(
          section,
          { opacity: [0, 1], y: [28, 0] },
          { duration: 0.6, easing: [0.22, 1, 0.36, 1] },
        )
        runningAnimations.push(controls)
      },
      { amount: 0.2 },
    )

    stopHandlers.push(stop)
  })
})

onBeforeUnmount(() => {
  stopHandlers.forEach((stop) => stop())
  runningAnimations.forEach((animation) => animation.stop())
})
</script>

<template>
  <main>
    <PortfolioHeader />
    <div :ref="setSectionRef"><HeroSection /></div>
    <div :ref="setSectionRef"><AboutSection /></div>
    <div :ref="setSectionRef"><SkillsSection /></div>
    <div :ref="setSectionRef"><ProjectsSection /></div>
    <div :ref="setSectionRef"><MediaCenterSection /></div>
    <div :ref="setSectionRef"><ContactSection /></div>
    <PortfolioFooter />
    <FloatingStatus />
  </main>
</template>
