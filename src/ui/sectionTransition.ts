type Transition = { skipTransition(): void; ready: Promise<unknown>; updateCallbackDone: Promise<unknown>; finished: Promise<unknown> }
let current: Transition | null = null
let revision = 0
export function cancelSectionTransition() {
  revision++
  try { current?.skipTransition() } catch { /* An already finished animation needs no cleanup. */ }
  current = null
}
/** Latest navigation wins, including browsers that skip or reject a snapshot. */
export function transitionSection(update: () => void, animate = true) {
  cancelSectionTransition()
  const ownRevision = revision
  let applied = false
  const apply = () => { if (!applied && ownRevision === revision) { applied = true; update() } }
  const doc = document as Document & { startViewTransition?: (update: () => void) => Transition }
  if (!animate || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !doc.startViewTransition) { apply(); return }
  try {
    const transition = doc.startViewTransition(apply)
    current = transition
    void transition.ready.catch(() => {})
    void transition.updateCallbackDone.catch(apply)
    void transition.finished.catch(() => {}).finally(() => { if (current === transition) current = null })
  } catch { apply() }
}
