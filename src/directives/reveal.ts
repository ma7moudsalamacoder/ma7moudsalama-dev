import type { Directive, DirectiveBinding } from 'vue'

type RevealBinding = number | { delay?: number; threshold?: number; once?: boolean }

const observers = new WeakMap<HTMLElement, IntersectionObserver>()

function resolveOptions(binding: DirectiveBinding<RevealBinding>) {
  if (typeof binding.value === 'number') {
    return { delay: binding.value, threshold: 0.15, once: true }
  }

  return {
    delay: binding.value?.delay ?? 0,
    threshold: binding.value?.threshold ?? 0.15,
    once: binding.value?.once ?? true,
  }
}

export const revealDirective: Directive<HTMLElement, RevealBinding> = {
  mounted(el, binding) {
    const { delay, threshold, once } = resolveOptions(binding)

    el.classList.add('reveal-on-scroll')
    el.style.transitionDelay = `${delay}ms`

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      el.classList.add('is-visible')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            if (once) {
              observer.unobserve(el)
            }
          } else if (!once) {
            el.classList.remove('is-visible')
          }
        }
      },
      { threshold },
    )

    observer.observe(el)
    observers.set(el, observer)
  },
  unmounted(el) {
    const observer = observers.get(el)
    if (observer) {
      observer.disconnect()
      observers.delete(el)
    }
  },
}
