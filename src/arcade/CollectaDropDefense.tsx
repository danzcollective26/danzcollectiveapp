import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import GameSurface from './GameSurface'
import ArcadeMenu from './ArcadeMenu'
import './collectaDrop.css'

type TowerType = 'speaker' | 'light' | 'barrier'
type Tower = { id: number; x: number; y: number; type: TowerType; level: 1 | 2 | 3; cooldown: number }
type Enemy = { id: number; pathIndex: number; progress: number; hp: number; type: 'hater' | 'resaca'; speed: number }

const MAX_TOWERS = 12
const LEVEL_DURATION = 60000 // 60s per level
const BASE_COST: Record<TowerType, number> = { speaker: 40, light: 70, barrier: 110 }
const UPGRADE_COST: Record<TowerType, [number, number]> = {
  speaker: [60, 100],
  light: [90, 140],
  barrier: [130, 180]
}
const PATH: { x: number; y: number }[] = [
  { x: 80, y: -20 }, { x: 80, y: 120 }, { x: 320, y: 120 }, { x: 320, y: 280 },
  { x: 140, y: 280 }, { x: 140, y: 420 }, { x: 480, y: 420 }, { x: 480, y: 560 },
  { x: 200, y: 560 }, { x: 200, y: 680 }, { x: 520, y: 680 }, { x: 520, y: 800 }
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
    min = Math.min(min, Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy)))
  }
  return min
}
function towerStats(t: Tower) {
  const base = t.type === 'speaker' ? 1.5 : t.type === 'light' ? 1.2 : 0.9
  const range = t.type === 'barrier' ? 100 : 150
  return { dmg: base * t.level, range: range + (t.level - 1) * 20 }
}

export default function CollectaDropDefense({ onBack }: { onBack: () => void }) {
  const [menuOpen, setMenuOpen] = useState(true)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(1)
  const [money, setMoney] = useState(150)
  const [lives, setLives] = useState(20)
  const [towers, setTowers] = useState<Tower[]>([])
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [message, setMessage] = useState('Coloca defensas. Mejor = más cara')
  const [selected, setSelected] = useState<TowerType>('speaker')
  const nextId = useRef(1)
  const board = useRef<SVGSVGElement>(null)
  const levelStart = useRef(0)

  useEffect(() => {
    if (!running) return
    let frame: number
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      setElapsed(e => {
        const next = e + dt
        if (next - levelStart.current >= LEVEL_DURATION) {
          setLevel(l => l + 1)
          setMoney(m => m + 80)
          setMessage(`NIVEL ${level + 1} · +80$`)
          levelStart.current = next
        }
        if (next >= 480000) { setRunning(false); setMessage('CIERRE COMPLETO'); return 480000 }
        return next
      })
      // Spawn scaled by level
      if (Math.random() < 0.007 + level * 0.002 + elapsed / 4000000) {
        setEnemies(prev => [...prev, {
          id: nextId.current++,
          pathIndex: 0, progress: 0,
          hp: 1.8 + level * 0.6 + Math.floor(elapsed / 50000),
          type: Math.random() > 0.55 ? 'resaca' : 'hater',
          speed: 38 + level * 4 + Math.random() * 15
        }])
      }
      setEnemies(prev => prev.map(e => {
        let { pathIndex, progress } = e
        const seg = PATH[pathIndex], next = PATH[pathIndex + 1]
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
      if (Math.floor(elapsed / 550) !== Math.floor((elapsed - dt) / 550)) {
        setTowers(ts => ts.map(t => ({ ...t, cooldown: 0 })))
      }
      setEnemies(ens => ens.map(e => {
        const pos = pointOnPath(e.pathIndex, e.progress)
        let hp = e.hp
        towers.forEach(t => {
          const { dmg, range } = towerStats(t)
          if (Math.hypot(t.x - pos.x, t.y - pos.y) < range && t.cooldown <= 0) {
            hp -= dmg
            t.cooldown = 700
          }
        })
        if (hp <= 0) {
          const reward = (e.type === 'hater' ? 18 : 28) + level * 3
          setMoney(m => m + reward)
          setMessage(`+${reward}$`)
        }
        return { ...e, hp }
      }).filter(e => e.hp > 0))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, elapsed, towers, level])

  function place(event: ReactPointerEvent) {
    if (!running || !board.current) return
    const rect = board.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) * 640 / rect.width
    const y = (event.clientY - rect.top) * 760 / rect.height
    // Upgrade existing tower if clicked near one
    const near = towers.find(t => Math.hypot(t.x - x, t.y - y) < 28)
    if (near && near.level < 3) {
      const cost = UPGRADE_COST[near.type][near.level - 1]
      if (money < cost) { setMessage(`Faltan ${cost - money}$ para evolución`); return }
      setMoney(m => m - cost)
      setTowers(ts => ts.map(t => t.id === near.id ? { ...t, level: (t.level + 1) as 2 | 3 } : t))
      setMessage(`${near.type.toUpperCase()} → NIVEL ${near.level + 1}`)
      return
    }
    if (distToPath(x, y) < 42) { setMessage('Fuera del camino'); return }
    if (towers.length >= MAX_TOWERS) { setMessage(`Máx ${MAX_TOWERS} defensas`); return }
    const cost = BASE_COST[selected]
    if (money < cost) { setMessage(`Faltan ${cost - money}$`); return }
    setMoney(m => m - cost)
    setTowers(prev => [...prev, { id: nextId.current++, x, y, type: selected, level: 1, cooldown: 0 }])
    setMessage(`${selected.toUpperCase()} colocado (-${cost}$)` )
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
        action={{ label: 'EMPEZAR CIERRE', onClick: () => { setMenuOpen(false); setRunning(true); levelStart.current = 0 } }}
        footer="Niveles · Dinero · 2 evoluciones por defensa"
      >
        <p>Coloca defensas fuera del camino. Cuanto mejor, más cara. Cada tipo tiene 2 evoluciones (toca una defensa para mejorarla). Gana dinero eliminando enemigos. Cada 60s sube el nivel.</p>
      </ArcadeMenu>
    )
  }

  return (
    <div className="collecta-drop-page">
      <header>
        <button onClick={onBack}>←</button>
        <strong>DROP DEFENSE</strong>
        <span>N{level} · {Math.ceil((LEVEL_DURATION - (elapsed - levelStart.current)) / 1000)}s · $ {money} · VIDAS {lives} · DEF {towers.length}/{MAX_TOWERS}</span>
      </header>
      <div className="collecta-drop-tools">
        {(['speaker', 'light', 'barrier'] as const).map(t => (
          <button key={t} aria-pressed={selected === t} onClick={() => setSelected(t)}>
            {t === 'speaker' ? 'ALTAVOZ' : t === 'light' ? 'LUZ' : 'BARRERA'} ${BASE_COST[t]}
          </button>
        ))}
      </div>
      <GameSurface ratio={640 / 760} className="collecta-drop-board">
        <svg ref={board} viewBox="0 0 640 760" className="gn-board" onPointerDown={place} style={{ width: '100%', height: '100%', background: '#1a2e1a' }}>
          <rect width="640" height="760" fill="#2d4a2d" />
          <polyline points={PATH.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#c4a574" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={PATH.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#8b6914" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
          <text x="320" y="28" textAnchor="middle" fill="#efc267" fontSize="13">{message}</text>
          {towers.map(t => (
            <g key={t.id} transform={`translate(${t.x} ${t.y})`}>
              <circle r={16 + t.level * 3} fill={t.type === 'speaker' ? '#8cf9ea' : t.type === 'light' ? '#ffdb7c' : '#c8f879'} />
              <text y="4" textAnchor="middle" fill="#111" fontSize="9" fontWeight="900">{t.type[0].toUpperCase()}{t.level}</text>
            </g>
          ))}
          {enemies.map(e => {
            const pos = pointOnPath(e.pathIndex, e.progress)
            return (
              <g key={e.id} transform={`translate(${pos.x} ${pos.y})`}>
                <circle r="11" fill={e.type === 'hater' ? '#ff6b8a' : '#a78bfa'} />
                <text y="3" textAnchor="middle" fill="#fff" fontSize="7">{e.type === 'hater' ? 'H' : 'R'}</text>
              </g>
            )
          })}
        </svg>
      </GameSurface>
      <footer><button onClick={() => setRunning(r => !r)}>{running ? 'PAUSA' : 'REANUDAR'}</button></footer>
    </div>
  )
}
