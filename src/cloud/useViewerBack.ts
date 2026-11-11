import { useEffect, useRef } from 'react'

/** One history entry per open viewer, so the phone's Back closes the photo. */
export function useViewerBack(open: boolean, onClose: () => void) {
  const close = useRef(onClose)
  close.current = onClose
  const marker = useRef(`danz-photo-${crypto.randomUUID()}`)
  const ownsEntry = useRef(false)
  useEffect(() => {
    if (!open) return
    try {
      window.history.pushState({ ...window.history.state, danzPhotoViewer: marker.current }, '', window.location.href)
      ownsEntry.current = true
    } catch { ownsEntry.current = false }
    const back = () => { ownsEntry.current = false; close.current() }
    window.addEventListener('popstate', back)
    return () => {
      window.removeEventListener('popstate', back)
      if (window.history.state?.danzPhotoViewer === marker.current) {
        const state = { ...window.history.state }
        delete state.danzPhotoViewer
        try { window.history.replaceState(state, '', window.location.href) } catch { /* Restricted browser. */ }
      }
      ownsEntry.current = false
    }
  }, [open])
  return () => {
    if (ownsEntry.current && window.history.state?.danzPhotoViewer === marker.current) window.history.back()
    else close.current()
  }
}
