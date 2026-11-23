import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import GameSurface from './GameSurface'
import ArcadeMenu from './ArcadeMenu'
import './collectaDrop.css'

type Tower = { id: number; x: number; y: number; type: 'speaker' | 'light' | 'barrier'; cooldown: number }
type Enemy = { id: number; pathIndex: number; progress: number; hp: number; type: 'hater' | 'resaca'; speed: number }

// Labyrinth path (waypoints) – serpentine from top to bottom
const PATH: { x: number; y: number }[] = [
  { x: 80, y: -20 },
  { x: 80, y: 120 },
  { x: 320, y: 120 },
  { x: 320, y: 280 },
  { x: 140, y: 280 },
  { x: 140, y: 420 },
  { x: 480, y: 420 },
  { x: 480, y: 560 },
  { x: 200, y: 560 },
  { x: 200, y: 680 },
  { x: 520, y: 680 },
  { x: 520, y: 800 }
]

function pointOnPath(index: number, progress: number) {
  const a = PATH[index]
  const b = PATH[Math.min(index + 1, PATH.length - 1)]
  return { x: a.x + (b.x - a.x) * progress, y: a.y + (b.y - a.y) * progress }
}

function distToPath(x: number, y: number) {
  let min = Infinity
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i], b = PATH[i + 1]
    const dx = b.x - a.x, dy = b.y - a.y
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)))
    const px = a.x + t * dx, py = a.y + t * dy
    min = Math.min(min, Math.hypot(x - px, y - py))
  }
  return min
}

export default function CollectaDropDefense({ onBack }: { onBack: () => void }) {
  const [menuOpen, setMenuOpen] = useState(true)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(20)
  const [towers, setTowers] = useState<Tower[]>([])
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [message, setMessage] = useState('Coloca defensas fuera del camino')
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
      // Spawn
      if (Math.random() < 0.008 + elapsed / 3000000) {
        setEnemies(prev => [...prev, {
          id: nextId.current++,
          pathIndex: 0,
          progress: 0,
          hp: 2 + Math.floor(elapsed / 40000),
          type: Math.random() > 0.6 ? 'resaca' : 'hater',
          speed: 40 + Math.random() * 20 + elapsed / 50000
        }])
      }
      // Move along path
      setEnemies(prev => prev.map(e => {
        let { pathIndex, progress } = e
        const seg = PATH[pathIndex]
        const next = PATH[pathIndex + 1]
        if (!next) return e
        const len = Math.hypot(next.x - seg.x, next.y - seg.y) || 1
        progress += (e.speed * dt / 1000) / len
        if (progress >= 1) { pathIndex++; progress = 0 }
        return { ...e, pathIndex, progress }
      }).filter(e => {
        if (e.pathIndex >= PATH.length - 1) {
          setLives(l => Math.max(0, l - 1))
          setMessage(e.type === 'hater' ? 'HATER COLADO' : 'RESACA EN PISTA')
          return false
        }
        return e.hp > 0
      }))
      // Drop cooldown reset
      if (Math.floor(elapsed / 600) !== Math.floor((elapsed - dt) / 600)) {
        setTowers(ts => ts.map(t => ({ ...t, cooldown: 0 })))
      }
      // Tower attacks
      setEnemies(ens => ens.map(e => {
        const pos = pointOnPath(e.pathIndex, e.progress)
        let hp = e.hp
        towers.forEach(t => {
          const dist = Math.hypot(t.x - pos.x, t.y - pos.y)
          if (dist < (t.type === 'barrier' ? 90 : 140) && t.cooldown <= 0) {
            hp -= t.type === 'speaker' ? 1.4 : t.type === 'light' ? 1.0 : 0.7
            t.cooldown = 800
          }
        })
        if (hp <= 0) { setScore(s => s + (e.type === 'hater' ? 50 : 80)); setMessage('¡FUERA!') }
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
    if (distToPath(x, y) < 42) { setMessage('Fuera del camino'); return }
    if (y < 40 || y > 740 || x < 20 || x > 620) return
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
        footer="8-12 min · Defiende el camino"
      >
        <p>Coloca altavoces, luces y barreras fuera del camino para que haters y resacas no lleguen al final. Cada drop activa las defensas.</p>
      </ArcadeMenu>
    )
  }

  return (
    <div className="collecta-drop-page">
      <header><button onClick={onBack}>←</button><strong>DROP DEFENSE</strong><span>{Math.ceil((480000 - elapsed) / 1000)}s · VIDAS {lives} · {score}</span></header>
      <div className="collecta-drop-tools">
        {(['speaker', 'light', 'barrier'] as const).map(t => (
          <button key={t} aria-pressed={selected === t} onClick={() => setSelected(t)}>
            {t === 'speaker' ? 'ALTAVOZ' : t === 'light' ? 'LUZ' : 'BARRERA'}
          </button>
        ))}
      </div>
      <GameSurface ratio={640 / 760} className="collecta-drop-board">
        <svg ref={board} viewBox="0 0 640 760" className="gn-board" onPointerDown={place} style={{ width: '100%', height: '100%', background: '#1a2e1a' }}>
          {/* Terrain */}
          <rect width="640" height="760" fill="#2d4a2d" />
          <rect x="0" y="0" width="640" height="40" fill="#1a2e1a" />
          {/* Path */}
          <polyline
            points={PATH.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#c4a574"
            strokeWidth="48"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={PATH.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#8b6914"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Message */}
          <text x="320" y="28" textAnchor="middle" fill="#efc267" fontSize="14">{message}</text>
          {/* Towers */}
          {towers.map(t => (
            <g key={t.id} transform={`translate(${t.x} ${t.y})`}>
              <circle r={t.type === 'barrier' ? 22 : 18} fill={t.type === 'speaker' ? '#8cf9ea' : t.type === 'light' ? '#ffdb7c' : '#c8f879'} />
              <text y="4" textAnchor="middle" fill="#111" fontSize="10" fontWeight="900">{t.type[0].toUpperCase()}</text>
            </g>
          ))}
          {/* Enemies */}
          {enemies.map(e => {
            const pos = pointOnPath(e.pathIndex, e.progress)
            return (
              <g key={e.id} transform={`translate(${pos.x} ${pos.y})`}>
                <circle r="12" fill={e.type === 'hater' ? '#ff6b8a' : '#a78bfa'} />
                <text y="3" textAnchor="middle" fill="#fff" fontSize="8">{e.type === 'hater' ? 'H' : 'R'}</text>
              </g>
            )
          })}
        </svg>
      </GameSurface>
      <footer><button onClick={() => setRunning(r => !r)}>{running ? 'PAUSA' : 'REANUDAR'}</button></footer>
    </div>
  )
}
