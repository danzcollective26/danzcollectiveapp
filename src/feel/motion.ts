export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> }
}

/** Crossfade the main section when the browser supports it. Otherwise update immediately. */
export function runViewTransition(update: () => void) {
  const root = typeof document === 'undefined' ? null : document as ViewTransitionDocument
  const blocked = root?.documentElement.classList.contains('arcade-session')
  const start = root?.startViewTransition
  if (!root || !start || blocked || prefersReducedMotion()) {
    update()
    return
  }
  try {
    start.call(root, update)
  } catch {
    update()
  }
}
