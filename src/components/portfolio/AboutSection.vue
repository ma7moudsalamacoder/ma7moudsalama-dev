<template>
  <section id="about" class="relative bg-white/50 border-y border-border-light py-24 dark:bg-surface-dark/50 dark:border-border-dark">
    <div class="section-shell grid items-center gap-16 lg:grid-cols-2">
      <div class="relative">
        <div class="absolute -left-10 -top-10 h-40 w-40 bg-primary/20 blur-[100px]" />
        <div class="relative aspect-square overflow-hidden rounded-2xl border border-primary/20">
          <div class="h-full w-full bg-[radial-gradient(circle_at_center,_rgba(0,212,255,0.26),_rgba(248,250,252,1)_65%)] dark:bg-[radial-gradient(circle_at_center,_rgba(0,225,255,0.22),_rgba(2,6,23,1)_65%)]" />
          <div class="absolute inset-0 bg-gradient-to-t from-background-light via-transparent to-transparent dark:from-background-dark" />
        </div>
      </div>

      <div>
        <h2 class="section-kicker">// Professional Summary</h2>
        <h3 class="mb-8 text-4xl font-bold leading-tight text-text-main dark:text-white md:text-5xl">Systems Architect & Full-Stack Developer</h3>

        <div class="space-y-6 text-lg leading-relaxed text-text-muted dark:text-slate-400">
          <p>
            Specializing in building robust <span class="font-medium text-text-main dark:text-white">Backend Systems</span>, high-performance Web Applications, and secure APIs.
          </p>
          <p>
            With a focus on <span class="font-medium text-primary">Scalable Architectures</span>, I bridge the gap between infrastructure and user experience.
          </p>
        </div>

        <div class="mt-10 grid grid-cols-2 gap-6">
          <div class="metric-box">
            <h4 class="mb-1 text-2xl font-bold text-text-main dark:text-white">99.9%</h4>
            <p class="metric-label">Uptime Focus</p>
          </div>
          <div class="metric-box">
            <h4 class="mb-1 text-2xl font-bold text-text-main dark:text-white">50+</h4>
            <p class="metric-label">APIs Built</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
