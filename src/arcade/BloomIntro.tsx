import { useEffect, useRef, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { BLOOM_DURATION_MS, browserSession, rememberArcadeIntro, type ArcadeIntroId, type ArcadeIntroMedia } from './arcadeIntros'
import { delightMuted } from '../feel/sounds'
import './bloomIntro.css'

type Bloom = Extract<ArcadeIntroMedia, { kind: 'bloom' }>

/** Filled six-petal DANZ flower used as the reveal window (same geometry as /brand/danz-flower.svg). */
const FLOWER_MASK = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="#000"><circle cx="50" cy="20" r="20"/><circle cx="76" cy="35" r="20"/><circle cx="76" cy="65" r="20"/><circle cx="50" cy="80" r="20"/><circle cx="24" cy="65" r="20"/><circle cx="24" cy="35" r="20"/><circle cx="50" cy="50" r="22"/></g></svg>')}")`

/** Short dry impact: a low thump plus a filtered noise splash. Quiet, synthesized, no files. */
function playImpact() {
  if (delightMuted()) return
  const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return
  try {
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const thump = ctx.createOscillator(); const thumpGain = ctx.createGain()
    thump.type = 'sine'; thump.frequency.setValueAtTime(140, now); thump.frequency.exponentialRampToValueAtTime(42, now + 0.22)
    thumpGain.gain.setValueAtTime(0.0001, now); thumpGain.gain.exponentialRampToValueAtTime(0.32, now + 0.01); thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32)
    thump.connect(thumpGain).connect(ctx.destination); thump.start(now); thump.stop(now + 0.35)
    const length = Math.floor(ctx.sampleRate * 0.4)
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.4)
    const noise = ctx.createBufferSource(); noise.buffer = buffer
    const band = ctx.createBiquadFilter(); band.type = 'bandpass'; band.frequency.setValueAtTime(2400, now); band.frequency.exponentialRampToValueAtTime(700, now + 0.35); band.Q.value = 0.8
    const noiseGain = ctx.createGain(); noiseGain.gain.setValueAtTime(0.14, now); noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
    noise.connect(band).connect(noiseGain).connect(ctx.destination); noise.start(now)
    window.setTimeout(() => { void ctx.close().catch(() => {}) }, 900)
  } catch { /* Sound is optional. */ }
}

export default function BloomIntro({ gameId, media, onDone }: { gameId: ArcadeIntroId; media: Bloom; onDone: () => void }) {
  const skip = useRef<HTMLButtonElement>(null)
  const onDoneRef = useRef(onDone)
  const finished = useRef(false)
  onDoneRef.current = onDone

  const finish = () => {
    if (finished.current) return
    finished.current = true
    rememberArcadeIntro(gameId, browserSession())
    onDoneRef.current()
  }

  useEffect(() => {
    const root = document.getElementById('root')
    const previousInert = root?.inert ?? false
    const previousOverflow = document.body.style.overflow
    if (root) root.inert = true
    document.body.style.overflow = 'hidden'
    skip.current?.focus({ preventScroll: true })
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) { finish(); return }
    // Preload the cover so the reveal never shows an empty window.
    const image = new Image(); image.src = media.cover
    const impact = window.setTimeout(playImpact, 1150)
    const end = window.setTimeout(finish, BLOOM_DURATION_MS)
    const onMotion = () => { if (motion.matches) finish() }
    motion.addEventListener('change', onMotion)
    // A hidden tab ends the intro instead of resuming a half-played animation.
    const hidden = () => { if (document.hidden) finish() }
    document.addEventListener('visibilitychange', hidden)
    return () => {
      clearTimeout(impact); clearTimeout(end)
      motion.removeEventListener('change', onMotion)
      document.removeEventListener('visibilitychange', hidden)
      if (root) root.inert = previousInert
      document.body.style.overflow = previousOverflow
    }
  }, [gameId, media.cover])

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    event.stopPropagation()
    if (event.key === 'Escape') { event.preventDefault(); finish() }
    if (event.key === 'Tab') { event.preventDefault(); skip.current?.focus() }
  }

  return createPortal(
    <section className="arcade-bloom" role="dialog" aria-modal="true" aria-label={`Intro de ${media.title}`} onKeyDown={onKeyDown}
      style={{ ['--bloom-mask' as string]: FLOWER_MASK, ['--bloom-accent' as string]: media.accent, ['--bloom-ms' as string]: `${BLOOM_DURATION_MS}ms` }}>
      <div className="arcade-bloom-window" aria-hidden="true">
        <div className="arcade-bloom-fill" style={{ backgroundImage: `url(${media.cover})` }} />
        <div className="arcade-bloom-cover" style={{ backgroundImage: `url(${media.cover})` }} />
      </div>
      <img className="arcade-bloom-flower" src="/brand/danz-flower.svg" alt="" aria-hidden="true" width="100" height="100" />
      <div className="arcade-bloom-ring" aria-hidden="true" />
      <p className="arcade-bloom-title">{media.title}</p>
      <div className="arcade-bloom-bar">
        <span />
        <button ref={skip} type="button" className="arcade-bloom-skip" onClick={finish}>Saltar</button>
      </div>
    </section>,
    document.body,
  )
}
