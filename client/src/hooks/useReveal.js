import { useEffect } from 'react'

// Fades in [data-reveal] elements the first time they enter the viewport.
// Only opacity/transform change, so nothing reflows. Elements are shown immediately when
// IntersectionObserver is missing or the visitor prefers reduced motion.
export default function useReveal() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !('IntersectionObserver' in window)) return undefined

    const root = document.documentElement
    root.classList.add('reveal-ready')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )

    const observeNew = (scope) => {
      scope.querySelectorAll?.('[data-reveal]:not(.is-revealed)').forEach((element) => observer.observe(element))
    }

    observeNew(document)

    // Sections such as offers render after data loads, so watch for elements added later.
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return
        if (node.matches?.('[data-reveal]')) observer.observe(node)
        observeNew(node)
      }))
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
      root.classList.remove('reveal-ready')
    }
  }, [])
}
