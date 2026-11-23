import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import GameSurface from './GameSurface'
import ClubRig from './ClubRig'
import ArcadeMenu from './ArcadeMenu'
import './collectaDrop.css'

type Tower = { id: number; x: number; y: number; type: 'speaker' | 'light' | 'barrier'; cooldown: number }
type Enemy = { id: number; x: number; y: number; hp: number; type: 'hater' | 'resaca'; speed: number }

export default function CollectaDropDefense({ onBack }: { onBack: () => void }) {
  const [menuOpen, setMenuOpen] = useState(true)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(25)
  const [towers, setTowers] = useState<Tower[]>([])
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [message, setMessage] = useState('Coloca defensas. El encargado no deja entrar a nadie.')
  const [selected, setSelected] = useState<'speaker' | 'light' | 'barrier'>('speaker')
  const nextId = useRef(1)
  const board = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!running) return
    let frame: number
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      setElapsed(e => {
        const next = e + dt
        if (next >= 480000) { setRunning(false); setMessage('CIERRE COMPLETO'); return 480000 }
        return next
      })
      if (Math.random() < 0.012 + elapsed / 2000000) {
        setEnemies(prev => [...prev, {
          id: nextId.current++,
          x: 70 + Math.random() * 500,
          y: -30,
          hp: 1.5 + Math.floor(elapsed / 25000),
          type: Math.random() > 0.65 ? 'resaca' : 'hater',
          speed: 35 + Math.random() * 25 + elapsed / 40000
        }])
      }
      setEnemies(prev => prev.map(e => ({ ...e, y: e.y + e.speed * dt / 1000 })).filter(e => {
        if (e.y > 770) { setLives(l => Math.max(0, l - 1)); setMessage(e.type === 'hater' ? 'HATER COLADO' : 'RESACA EN PISTA'); return false }
        return e.hp > 0
      }))
      if (Math.floor(elapsed / 520) !== Math.floor((elapsed - dt) / 520)) {
        setTowers(ts => ts.map(t => ({ ...t, cooldown: 0 })))
      }
      setEnemies(ens => ens.map(e => {
        let hp = e.hp
        towers.forEach(t => {
          const dist = Math.hypot(t.x - e.x, t.y - e.y)
          if (dist < (t.type === 'barrier' ? 100 : 150) && t.cooldown <= 0) {
            hp -= t.type === 'speaker' ? 1.6 : t.type === 'light' ? 1.1 : 0.9
            t.cooldown = 700
          }
        })
        if (hp <= 0) { setScore(s => s + (e.type === 'hater' ? 60 : 90)); setMessage('¡FUERA!') }
        return { ...e, hp }
      }).filter(e => e.hp > 0))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, elapsed, towers])

  function place(event: ReactPointerEvent) {
    if (!running || !board.current) return
    const rect = board.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) * 640 / rect.width
    const y = (event.clientY - rect.top) * 760 / rect.height
    if (y < 80 || y > 720 || x < 30 || x > 610) return
    setTowers(prev => [...prev, { id: nextId.current++, x, y, type: selected, cooldown: 0 }])
    setMessage(`${selected === 'speaker' ? 'ALTAVOZ' : selected === 'light' ? 'LUZ' : 'BARRERA'} COLOCADO`)
  }

  if (menuOpen) {
    return (
      <ArcadeMenu
        title="DROP DEFENSE"
        eyebrow="DANZ COLLECTA / CIERRE DE PISTA"
        art="/arcade/collecta-mobile-v1.webp"
        accent="#efc267"
        tabs={[{ id: 'play', label: 'JUGAR' }, { id: 'how', label: 'CÓMO' }]}
        page="play"
        onPage={() => {}}
        onBack={onBack}
        action={{ label: 'EMPEZAR CIERRE', onClick: () => { setMenuOpen(false); setRunning(true) } }}
        footer="8-12 min · Defiende la pista"
      >
        <p>El encargado coloca altavoces, luces y barreras de gente para que haters y resacas no invadan la pista. Cada drop activa las defensas. Sesiones de 8-12 minutos.</p>
      </ArcadeMenu>
    )
  }

  return (
    <div className="collecta-drop-page" style={{ background: '#0e0a12', minHeight: '100dvh', color: '#fff' }}>
      <header><button onClick={onBack}>←</button><strong>DROP DEFENSE</strong><span>{Math.ceil((480000 - elapsed) / 1000)}s · VIDAS {lives} · {score}</span></header>
      <div className="collecta-drop-tools">
        {(['speaker', 'light', 'barrier'] as const).map(t => (
          <button key={t} aria-pressed={selected === t} onClick={() => setSelected(t)}>
            {t === 'speaker' ? 'ALTAVOZ' : t === 'light' ? 'LUZ' : 'BARRERA'}
          </button>
        ))}
      </div>
      <GameSurface ratio={640 / 760} className="collecta-drop-board">
        <svg ref={board} viewBox="0 0 640 760" className="gn-board" onPointerDown={place} style={{width:"100%",height:"100%",background:"#0f0c14"}}>
          <rect width="640" height="760" fill="#0f0c14" />
          <ClubRig id="collecta-drop-rig" />
          <text x="320" y="36" textAnchor="middle" fill="#efc267" fontSize="16">{message}</text>
          {towers.map(t => (
            <g key={t.id} transform={`translate(${t.x} ${t.y})`}>
              <circle r={t.type === 'barrier' ? 30 : 24} fill={t.type === 'speaker' ? '#8cf9ea' : t.type === 'light' ? '#ffdb7c' : '#c8f879'} opacity=".85" />
              <text y="5" textAnchor="middle" fill="#111" fontSize="11" fontWeight="900">{t.type[0].toUpperCase()}</text>
            </g>
          ))}
          {enemies.map(e => (
            <g key={e.id} transform={`translate(${e.x} ${e.y})`}>
              <circle r="15" fill={e.type === 'hater' ? '#ff6b8a' : '#a78bfa'} />
              <text y="4" textAnchor="middle" fill="#fff" fontSize="9">{e.type === 'hater' ? 'H' : 'R'}</text>
            </g>
          ))}
        </svg>
      </GameSurface>
      <footer><button onClick={() => setRunning(r => !r)}>{running ? 'PAUSA' : 'REANUDAR'}</button></footer>
    </div>
  )
}
