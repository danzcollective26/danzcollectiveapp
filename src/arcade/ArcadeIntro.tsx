import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { arcadeIntroMedia, browserSession, rememberArcadeIntro, type ArcadeIntroId } from './arcadeIntros'
import './arcadeIntro.css'

export default function ArcadeIntro({ gameId, onDone }: { gameId: ArcadeIntroId; onDone: () => void }) {
  const media = arcadeIntroMedia(gameId)
  const video = useRef<HTMLVideoElement>(null)
  const skip = useRef<HTMLButtonElement>(null)
  const onDoneRef = useRef(onDone)
  const alive = useRef(true)
  const finished = useRef(false)
  onDoneRef.current = onDone
  const [muted, setMuted] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(false)
  const [soundReady, setSoundReady] = useState(false)

  const finish = () => {
    if (!alive.current || finished.current) return
    finished.current = true
    video.current?.pause()
    rememberArcadeIntro(gameId, browserSession())
    onDoneRef.current()
  }

  useEffect(() => {
    alive.current = true
    const root = document.getElementById('root')
    const previousInert = root?.inert ?? false
    const previousOverflow = document.body.style.overflow
    if (root) root.inert = true
    document.body.style.overflow = 'hidden'
    skip.current?.focus()
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onMotion = () => { if (motion.matches) finish() }
    if (motion.matches) finish()
    else motion.addEventListener('change', onMotion)
    const el = video.current
    if (el?.error) finish()
    const hidden = () => {
      if (!el || finished.current) return
      if (document.hidden) el.pause()
      else void el.play().catch(() => { if (alive.current) setNeedsGesture(true) })
    }
    document.addEventListener('visibilitychange', hidden)
    const start = async () => {
      if (!el || finished.current) return
      el.muted = false
      try {
        await el.play()
        if (!alive.current || finished.current) return
        setMuted(false)
        setNeedsGesture(false)
      } catch {
        if (!alive.current || finished.current || !el) return
        el.muted = true
        try {
          await el.play()
          if (!alive.current || finished.current) return
          setMuted(true)
          setNeedsGesture(false)
        } catch {
          if (!alive.current || finished.current) return
          setMuted(true)
          setNeedsGesture(true)
        }
      } finally {
        if (alive.current && !finished.current) setSoundReady(true)
      }
    }
    void start()
    return () => {
      alive.current = false
      motion.removeEventListener('change', onMotion)
      document.removeEventListener('visibilitychange', hidden)
      el?.pause()
      if (root) root.inert = previousInert
      document.body.style.overflow = previousOverflow
    }
  }, [gameId])

  async function unmute() {
    const el = video.current
    if (!el || finished.current) return
    el.muted = false
    try {
      await el.play()
      if (!alive.current) return
      setMuted(false)
      setNeedsGesture(false)
    } catch {
      el.muted = true
      if (alive.current) setMuted(true)
    }
  }

  function onMediaError() {
    if (!alive.current || finished.current || !video.current?.error) return
    finish()
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    event.stopPropagation()
    if (event.key === 'Escape') { event.preventDefault(); finish(); return }
    if (event.key !== 'Tab') return
    const nodes = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')].filter(node => node.getClientRects().length > 0)
    const first = nodes[0]
    const last = nodes.at(-1)
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  if (!media) return null
  const showSound = soundReady && (muted || needsGesture)
  return createPortal(
    <section className="arcade-film" role="dialog" aria-modal="true" aria-label={`Intro de ${media.title}`} onKeyDown={onKeyDown}>
      <p className="arcade-film-kicker">INTRO · {media.title}</p>
      <video
        ref={video}
        src={media.src}
        poster={media.poster}
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onEnded={finish}
        onError={onMediaError}
      />
      <div className="arcade-film-bar">
        {showSound ? <button type="button" className="arcade-film-sound" onClick={() => void unmute()}>Activar sonido</button> : <span />}
        <button ref={skip} type="button" className="arcade-film-skip" onClick={finish}>Saltar</button>
      </div>
    </section>,
    document.body,
  )
}
