<script setup lang="ts">
import AboutSection from '@/components/portfolio/AboutSection.vue'
import ContactSection from '@/components/portfolio/ContactSection.vue'
import FloatingStatus from '@/components/portfolio/FloatingStatus.vue'
import HeroSection from '@/components/portfolio/HeroSection.vue'
import MediaCenterSection from '@/components/portfolio/MediaCenterSection.vue'
import PortfolioFooter from '@/components/portfolio/PortfolioFooter.vue'
import PortfolioHeader from '@/components/portfolio/PortfolioHeader.vue'
import ProjectsSection from '@/components/portfolio/ProjectsSection.vue'
import SkillsSection from '@/components/portfolio/SkillsSection.vue'
</script>

<template>
  <main>
    <PortfolioHeader />
    <HeroSection />
    <AboutSection />
    <SkillsSection />
    <ProjectsSection />
    <MediaCenterSection />
    <ContactSection />
    <PortfolioFooter />
    <FloatingStatus />
  </main>
</template>
