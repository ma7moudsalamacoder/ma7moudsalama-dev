<template>
  <section
    class="circuit-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background-light pt-20 dark:bg-background-dark"
  >
    <div
      class="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/15 blur-[120px]"
    />
    <div
      class="pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-cyan-300/20 blur-[130px] dark:bg-primary/10"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 to-transparent dark:from-background-dark/40"
    />

    <div class="pointer-events-none absolute inset-0 z-0 opacity-30 dark:opacity-20">
      <div
        class="absolute left-0 top-1/4 h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent"
      />
      <div
        class="absolute left-0 top-3/4 h-px w-full bg-gradient-to-r from-transparent via-primary to-transparent"
      />
      <div
        class="absolute left-1/4 top-0 h-full w-px bg-gradient-to-b from-transparent via-primary to-transparent"
      />
      <div
        class="absolute right-1/4 top-0 h-full w-px bg-gradient-to-b from-transparent via-primary to-transparent"
      />
    </div>

    <div class="relative z-10 mx-auto max-w-5xl px-6 text-center">
      <div
        class="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary"
      >
        <span class="relative flex h-2 w-2">
          <span
            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
          />
          <span class="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Available for new systems architecture
      </div>

      <h1
        class="mb-6 text-5xl font-black leading-[0.95] tracking-tighter text-text-main dark:text-white sm:text-6xl md:text-8xl"
      >
        MA7MOUD
        <span class="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent"
          >SALAMA</span
        >
      </h1>

      <p
        class="mx-auto mb-4 max-w-3xl text-lg font-light leading-relaxed text-slate-600 dark:text-slate-400 md:text-2xl"
      >
        Software Developer |
        <span class="font-medium text-text-main dark:text-white">Systems Builder</span> | Problem
        Solver
      </p>

      <p class="mx-auto mb-8 max-w-2xl text-base text-slate-600 dark:text-slate-500 md:text-lg">
        Crafting high-performance backend systems and scalable web applications with a focus on
        clean architecture and technical excellence.
      </p>

      <div class="flex flex-col items-center justify-center gap-5 sm:flex-row">
        <a class="btn-primary group" href="#projects">
          VIEW PROJECTS
          <span class="material-symbols-outlined transition-transform group-hover:translate-x-1"
            >arrow_forward</span
          >
        </a>
        <a class="btn-secondary" href="#contact">CONTACT ME</a>
      </div>
    </div>

    <div class="relative z-10 mt-12 flex flex-col items-center gap-2 opacity-50">
      <span class="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
      <div class="h-12 w-px bg-gradient-to-b from-primary to-transparent" />
    </div>
  </section>
</template>
