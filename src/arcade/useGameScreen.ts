import { useEffect, useRef, useState } from 'react'

export function useGameScreen(pause: () => void) {
  const panel = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const desired = useRef(false)
  const native = useRef(false)
  const target = useRef<HTMLElement | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const pauseRef = useRef(pause)
  pauseRef.current = pause

  function leave() {
    desired.current = false
    pauseRef.current()
    setActive(false)
    if (document.fullscreenElement === target.current && document.exitFullscreen) void document.exitFullscreen().catch(() => {})
    if (opener.current?.isConnected) opener.current.focus({ preventScroll: true })
  }
  function enter() {
    if (desired.current) return
    desired.current = true
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    target.current = panel.current
    setActive(true)
    // Request during the actual play gesture. Unsupported/denied native APIs
    // retain the same dedicated viewport through CSS, including on iPhone.
    try {
      const request = panel.current?.requestFullscreen?.({ navigationUI: 'hide' })
      if (request) void request.then(() => {
        if (!desired.current && document.fullscreenElement === target.current) void document.exitFullscreen().catch(() => {})
      }).catch(() => {})
    } catch { /* The dedicated play viewport remains available. */ }
  }
  useEffect(() => {
    if (!active) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') leave() }
    window.addEventListener('keydown', escape)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', escape) }
  }, [active])
  useEffect(() => {
    const changed = () => {
      if (target.current && document.fullscreenElement === target.current) native.current = true
      else if (native.current) { native.current = false; desired.current = false; setActive(false); pauseRef.current() }
    }
    document.addEventListener('fullscreenchange', changed)
    return () => {
      document.removeEventListener('fullscreenchange', changed)
      if (target.current && document.fullscreenElement === target.current) void document.exitFullscreen().catch(() => {})
    }
  }, [])
  return { panel, active, enter, leave }
}
