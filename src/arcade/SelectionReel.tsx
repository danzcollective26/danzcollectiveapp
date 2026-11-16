import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from 'react'
import { menuIndex, swipeMenuStep } from './menuNavigation'

export type MenuChoice = { id: string; name: string; note?: string; badge?: string }
export default function SelectionReel({ label, choices, value, onChange, children, compact = false }: {
  label: string; choices: readonly MenuChoice[]; value: string; onChange: (id: string) => void; children?: ReactNode; compact?: boolean
}) {
  const hint = useId(), gesture = useRef<{ id: number; x: number; y: number } | null>(null)
  useEffect(()=>{const clear=()=>{gesture.current=null},hidden=()=>{if(document.hidden)clear()},rotation=window.matchMedia('(orientation: landscape)');window.addEventListener('blur',clear);document.addEventListener('visibilitychange',hidden);rotation.addEventListener('change',clear);return()=>{window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',hidden);rotation.removeEventListener('change',clear)}},[])
  const index = Math.max(0, choices.findIndex(c => c.id === value)), choice = choices[index]
  if (!choice) return null
  const move = (step: number) => onChange(choices[menuIndex(index, step, choices.length)].id)
  const release = (event: PointerEvent<HTMLDivElement>) => {
    const start = gesture.current; gesture.current = null
    if (!start || start.id !== event.pointerId) return
    const step = swipeMenuStep(event.clientX - start.x, event.clientY - start.y)
    if (step) move(step)
  }
  return <div className={`selection-reel${compact ? ' is-compact' : ''}`} role="group" aria-label={label}>
    <div className="reel-label"><span>{label}</span><b>{String(index + 1).padStart(2, '0')} / {String(choices.length).padStart(2, '0')}</b></div>
    <div className="reel-track">
      <button type="button" className="reel-arrow" disabled={choices.length<2} aria-label={`${label}: anterior`} onClick={() => move(-1)}>‹</button>
      <div className="reel-card" tabIndex={0} aria-label={`${label}: ${choice.name}`} aria-describedby={hint}
        onKeyDown={e => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1) }
          if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); onChange(choices[e.key === 'Home' ? 0 : choices.length - 1].id) }
        }}
        onPointerDown={e => { if (!e.isPrimary || e.button !== 0) return; gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId) }}
        onPointerUp={release} onPointerCancel={() => { gesture.current = null }} onLostPointerCapture={() => { gesture.current = null }}>
        {children && <div className="reel-preview" aria-hidden="true">{children}</div>}
        <div className="reel-choice" aria-live="polite" aria-atomic="true">{choice.badge && <small>{choice.badge}</small>}<strong>{choice.name}</strong>{choice.note && <p>{choice.note}</p>}</div>
      </div>
      <button type="button" className="reel-arrow" disabled={choices.length<2} aria-label={`${label}: siguiente`} onClick={() => move(1)}>›</button>
    </div>
    {choices.length <= 6 && <div className="reel-dots" aria-label={`Selección directa: ${label}`}>{choices.map(c => <button key={c.id} type="button" aria-label={`Seleccionar ${c.name}`} aria-pressed={value === c.id} onClick={() => onChange(c.id)}><i/></button>)}</div>}
    <span className="arcade-menu-sr" id={hint}>Desliza a los lados o usa las flechas izquierda y derecha para elegir.</span>
  </div>
}
