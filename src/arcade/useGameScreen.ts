import { useEffect, useRef, useState } from 'react'
import { requestArcadeFullscreen } from './arcadeFullscreen'

export function useGameScreen(pause: () => void) {
  const panel = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const desired = useRef(false)
  const opener = useRef<HTMLElement | null>(null)
  const pauseRef = useRef(pause)
  pauseRef.current = pause
  function leave() {
    desired.current = false; pauseRef.current(); setActive(false)
    if (opener.current?.isConnected) opener.current.focus({ preventScroll: true })
  }
  function enter() {
    requestArcadeFullscreen()
    if (desired.current) return
    desired.current = true
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setActive(true)
  }
  useEffect(() => {
    if (!active) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented) leave() }
    window.addEventListener('keydown', escape)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', escape) }
  }, [active])
  useEffect(() => {
    let native = Boolean(document.fullscreenElement)
    const changed = () => {
      if (document.fullscreenElement) native = true
      else if (native) { native = false; pauseRef.current() }
    }
    document.addEventListener('fullscreenchange', changed)
    return () => document.removeEventListener('fullscreenchange', changed)
  }, [])
  return { panel, active, enter, leave }
}
