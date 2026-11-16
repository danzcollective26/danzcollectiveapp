import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { joystickVector, STICK_REACH, type StickVector } from './joystick'
import type { VersusPlayer } from './versusView'

const KEY_VECTOR: Record<string, StickVector> = { ArrowUp: {x:0,y:-1}, ArrowDown: {x:0,y:1}, ArrowLeft: {x:-1,y:0}, ArrowRight: {x:1,y:0}, w: {x:0,y:-1}, s: {x:0,y:1}, a: {x:-1,y:0}, d: {x:1,y:0} }

/** Each stick owns one captured pointer, including a non-primary second finger. */
export default function VersusJoystick({ player, active, onChange, keyboardEnabled=true, keyboardHelp }: { player: VersusPlayer; active: boolean; onChange: (v: StickVector) => void;keyboardEnabled?:boolean;keyboardHelp?:string }) {
  const button = useRef<HTMLButtonElement>(null), svg = useRef<SVGSVGElement>(null), thumb = useRef<SVGGElement>(null)
  const owner = useRef<number | null>(null), keys = useRef(new Set<string>())
  const change = useRef(onChange); change.current = onChange
  const help = useId()
  const update = (v: StickVector) => {
    thumb.current?.setAttribute('transform', `translate(${(v.x*27).toFixed(2)} ${(v.y*27).toFixed(2)})`)
    button.current?.setAttribute('data-engaged', String(Boolean(v.x || v.y)))
    change.current(v)
  }
  const reset = () => {
    const id = owner.current; owner.current = null; keys.current.clear(); update({x:0,y:0})
    if (id !== null && button.current?.hasPointerCapture(id)) button.current.releasePointerCapture(id)
  }
  const resetLatest = useRef(reset); resetLatest.current = reset
  useEffect(() => { if (!active) resetLatest.current() }, [active])
  useEffect(() => () => resetLatest.current(), [])
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (!active || owner.current !== e.pointerId) return
    e.preventDefault()
    const matrix = svg.current?.getScreenCTM()
    if (!matrix) { reset(); return }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse())
    update(joystickVector(p.x,p.y))
  }
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (!active || owner.current !== null || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault(); keys.current.clear(); owner.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId); move(e)
  }
  const release = (e: PointerEvent<HTMLButtonElement>) => { if (owner.current === e.pointerId) reset() }
  const keyboard = (e: KeyboardEvent<HTMLButtonElement>, pressed: boolean) => {
    if(!keyboardEnabled)return
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
    if (key === ' ' || key === 'Enter') { e.preventDefault(); e.stopPropagation(); reset(); return }
    if (!KEY_VECTOR[key]) return
    e.preventDefault(); e.stopPropagation()
    if (!active || owner.current !== null) return
    if (pressed) keys.current.add(key); else keys.current.delete(key)
    const v = {x:0,y:0}
    for (const k of keys.current) { v.x += KEY_VECTOR[k].x; v.y += KEY_VECTOR[k].y }
    const length = Math.hypot(v.x,v.y)
    update(joystickVector(v.x / Math.max(1,length) * STICK_REACH, v.y / Math.max(1,length) * STICK_REACH))
  }
  return <div className="versus-stick-wrap"><button ref={button} type="button" className="versus-stick" aria-label={`P${player+1} Joystick`} aria-describedby={help} disabled={!active} data-engaged="false" onPointerDown={down} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onKeyDown={e=>keyboard(e,true)} onKeyUp={e=>keyboard(e,false)} onBlur={reset} onClick={e=>{if(e.detail===0)reset()}}>
    <svg ref={svg} viewBox="-64 -64 128 128" aria-hidden="true"><circle r="60" className="stick-bezel"/><circle r="47" className="stick-track"/><circle r="30" className="stick-guide"/><path d="M0-56V-49M0 49V56M-56 0H-49M49 0H56" className="stick-ticks"/><g ref={thumb}><circle cy="4" r="24" className="stick-shadow"/><circle r="23" className="stick-cap"/><circle r="17" className="stick-inner"/><path d="M-7 0H7M0-7V7" className="stick-mark"/></g></svg>
  </button><small id={help} className="versus-stick-help">{keyboardHelp??'Arrastra para moverte; al soltar se centra. Con foco, usa flechas o WASD. Espacio centra el mando.'}</small></div>
}
