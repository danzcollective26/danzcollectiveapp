import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import GameSurface from './GameSurface'
import ArcadeMenu from './ArcadeMenu'
import './itsMikesFault.css'

type TowerType = 'danzfunken' | 'estrobo' | 'zonavip' | 'crowd' | 'mikecoins'
type EnemyType = 'waterparty' | 'guysong' | 'tentacion' | 'hippies' | 'multipasao'
type Tower = { id: number; x: number; y: number; type: TowerType; level: 1 | 2 | 3; cooldown: number }
type Enemy = { id: number; pathIndex: number; progress: number; hp: number; type: EnemyType; speed: number }

const MAX_TOWERS = 15
const LIVES_START = 15
const WAVES = 10
const BASE_COST: Record<TowerType, number> = { danzfunken: 40, estrobo: 60, zonavip: 80, crowd: 100, mikecoins: 150 }
const PATH: { x: number; y: number }[] = [
  { x: 80, y: -20 }, { x: 80, y: 140 }, { x: 340, y: 140 }, { x: 340, y: 300 },
  { x: 120, y: 300 }, { x: 120, y: 460 }, { x: 500, y: 460 }, { x: 500, y: 600 },
  { x: 180, y: 600 }, { x: 180, y: 720 }, { x: 540, y: 720 }, { x: 540, y: 800 }
]

function pointOnPath(i: number, p: number) {
  const a = PATH[i], b = PATH[Math.min(i + 1, PATH.length - 1)]
  return { x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p }
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
function stats(t: Tower) {
  const dmg = t.type === 'danzfunken' ? 2.2 : t.type === 'estrobo' ? 1.1 : t.type === 'zonavip' ? 0.4 : t.type === 'mikecoins' ? 1.6 : 0.3
  const range = t.type === 'estrobo' ? 130 : t.type === 'zonavip' ? 110 : 150
  return { dmg: dmg * t.level, range: range + (t.level - 1) * 18, aoe: t.type === 'estrobo', slow: t.type === 'zonavip', buff: t.type === 'crowd' }
}

export default function ItsMikesFault({ onBack }: { onBack: () => void }) {
  const [menuOpen, setMenuOpen] = useState(true)
  const [running, setRunning] = useState(false)
  const [wave, setWave] = useState(1)
  const [ronceina, setRonceina] = useState(180)
  const [mikepoints, setMikepoints] = useState(0)
  const [lives, setLives] = useState(LIVES_START)
  const [towers, setTowers] = useState<Tower[]>([])
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [message, setMessage] = useState('Coloca defensas. Mike lo frena todo.')
  const [selected, setSelected] = useState<TowerType>('danzfunken')
  const [dropActive, setDropActive] = useState(false)
  const [mikeReady, setMikeReady] = useState(true)
  const nextId = useRef(1)
  const board = useRef<SVGSVGElement>(null)
  const waveTimer = useRef(0)

  useEffect(() => {
    if (!running) return
    let frame: number
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(40, now - last)
      last = now
      waveTimer.current += dt
      // Drop every ~12s
      if (Math.floor(waveTimer.current / 12000) !== Math.floor((waveTimer.current - dt) / 12000)) {
        setDropActive(true)
        setTimeout(() => setDropActive(false), 2500)
        setMessage('DROP — todas las defensas se potencian')
      }
      // Spawn wave
      if (waveTimer.current > 8000 && enemies.length === 0 && Math.random() < 0.02) {
        const count = 4 + wave
        const batch: Enemy[] = []
        for (let i = 0; i < count; i++) {
          const roll = Math.random()
          const type: EnemyType = roll > 0.85 ? 'multipasao' : roll > 0.7 ? 'hippies' : roll > 0.5 ? 'tentacion' : roll > 0.3 ? 'guysong' : 'waterparty'
          batch.push({
            id: nextId.current++,
            pathIndex: 0, progress: 0,
            hp: (type === 'tentacion' ? 8 : type === 'multipasao' ? 5 : type === 'hippies' ? 1.2 : 2.5) + wave * 0.7,
            type,
            speed: type === 'guysong' ? 70 : type === 'tentacion' ? 28 : type === 'hippies' ? 50 : 42
          })
        }
        setEnemies(batch)
        setMessage(`Oleada ${wave}`)
      }
      // Move
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
          setMessage('¡Colado!')
          return false
        }
        return e.hp > 0
      }))
      // Attacks
      setEnemies(ens => ens.map(e => {
        const pos = pointOnPath(e.pathIndex, e.progress)
        let hp = e.hp
        const boost = dropActive ? 1.4 : 1
        towers.forEach(t => {
          const s = stats(t)
          const dist = Math.hypot(t.x - pos.x, t.y - pos.y)
          if (dist < s.range && t.cooldown <= 0) {
            let d = s.dmg * boost
            if (s.buff) d *= 1.25
            hp -= d
            t.cooldown = 650
            if (t.type === 'mikecoins' && dropActive && Math.random() < 0.3) setMikepoints(m => m + 1)
          }
        })
        if (hp <= 0) {
          const reward = (e.type === 'multipasao' ? 35 : e.type === 'tentacion' ? 28 : 16) + wave * 2
          setRonceina(r => r + reward)
          if (e.type === 'multipasao') setMikepoints(m => m + 2)
          setMessage(`+${reward} Ronceina`)
        }
        return { ...e, hp }
      }).filter(e => e.hp > 0))
      // Wave clear
      if (enemies.length === 0 && waveTimer.current > 12000) {
        const bonus = lives > 0 ? 40 + wave * 5 : 20
        setRonceina(r => r + bonus)
        setMikepoints(m => m + 3)
        setWave(w => {
          if (w >= WAVES) { setRunning(false); setMessage('¡CIERRE COMPLETO!'); return w }
          return w + 1
        })
        waveTimer.current = 0
        setMessage(`Oleada limpia +${bonus} Ronceina`)
      }
      if (lives <= 0) { setRunning(false); setMessage('DEMASIADOS COLADOS') }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, enemies.length, wave, dropActive, lives])

  function place(event: ReactPointerEvent) {
    if (!running || !board.current) return
    const rect = board.current.getBoundingClientRect()
    const x = (event.clientX - rect.left) * 640 / rect.width
    const y = (event.clientY - rect.top) * 760 / rect.height
    const near = towers.find(t => Math.hypot(t.x - x, t.y - y) < 26)
    if (near && near.level < 3) {
      const cost = 4 + near.level * 3 + (near.type === 'mikecoins' ? 4 : 0)
      if (mikepoints < cost) { setMessage(`Faltan ${cost - mikepoints} Mikepoints`); return }
      setMikepoints(m => m - cost)
      setTowers(ts => ts.map(t => t.id === near.id ? { ...t, level: (t.level + 1) as 2 | 3 } : t))
      setMessage(`${near.type} → nivel ${near.level + 1}`)
      return
    }
    if (distToPath(x, y) < 40) { setMessage('Fuera del camino'); return }
    if (towers.length >= MAX_TOWERS) { setMessage('Máx 15 defensas'); return }
    const cost = BASE_COST[selected]
    if (ronceina < cost) { setMessage(`Faltan ${cost - ronceina} Ronceina`); return }
    setRonceina(r => r - cost)
    setTowers(prev => [...prev, { id: nextId.current++, x, y, type: selected, level: 1, cooldown: 0 }])
    setMessage(`${selected} colocado`)
  }

  function sell() {
    if (!towers.length) return
    const last = towers[towers.length - 1]
    setRonceina(r => r + Math.floor(BASE_COST[last.type] * 0.6))
    setTowers(ts => ts.slice(0, -1))
    setMessage('Defensa vendida')
  }

  function activateMike() {
    if (!mikeReady || !running) return
    setMikeReady(false)
    setEnemies(ens => ens.map(e => ({ ...e, hp: e.hp * 0.6, speed: e.speed * 0.7 })))
    setMessage('MIKE FRENA TODO')
    setTimeout(() => setMikeReady(true), 20000)
  }

  if (menuOpen) {
    return (
      <ArcadeMenu
        title="IT'S MIKE'S FAULT"
        eyebrow="ARCADANZ / MIKE LO FRENA TODO"
        art="/arcade/collecta-mobile-v1.webp"
        accent="#efc267"
        tabs={[{ id: 'play', label: 'JUGAR' }, { id: 'how', label: 'CÓMO' }]}
        page="play"
        onPage={() => {}}
        onBack={onBack}
        action={{ label: 'EMPEZAR', onClick: () => { setMenuOpen(false); setRunning(true) } }}
        footer="8-12 min · 10 oleadas · Mike activable"
      >
        <p>Mike sabe de todo y no se le escapa ninguna oportunidad. Coloca defensas, evoluciona con Mikepoints y activa a Mike cuando la cosa se ponga fea.</p>
      </ArcadeMenu>
    )
  }

  return (
    <div className="imf-page">
      <header>
        <button onClick={onBack}>←</button>
        <strong>IT'S MIKE'S FAULT</strong>
        <span>O{wave}/{WAVES} · R {ronceina} · MP {mikepoints} · V {lives} · D {towers.length}/15</span>
      </header>
      <div className="imf-tools">
        {(['danzfunken', 'estrobo', 'zonavip', 'crowd', 'mikecoins'] as const).map(t => (
          <button key={t} aria-pressed={selected === t} onClick={() => setSelected(t)}>
            {t === 'danzfunken' ? 'DANZFUNKEN' : t === 'estrobo' ? 'ESTROBO' : t === 'zonavip' ? 'ZONA VIP' : t === 'crowd' ? 'CROWD' : 'MIKECOINS'} ${BASE_COST[t]}
          </button>
        ))}
        <button onClick={sell}>VENDER</button>
        <button onClick={activateMike} disabled={!mikeReady}>MIKE {mikeReady ? 'LISTO' : '...'}</button>
      </div>
      <GameSurface ratio={640 / 760} className="imf-board">
        <svg ref={board} viewBox="0 0 640 760" onPointerDown={place} style={{ width: '100%', height: '100%', background: '#1a2e1a' }}>
          <rect width="640" height="760" fill="#2d4a2d" />
          <polyline points={PATH.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#c4a574" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={PATH.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#8b6914" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
          <text x="320" y="26" textAnchor="middle" fill="#efc267" fontSize="12">{message}{dropActive ? ' · DROP' : ''}</text>
          {towers.map(t => (
            <g key={t.id} transform={`translate(${t.x} ${t.y})`}>
              <circle r={15 + t.level * 2} fill={t.type === 'danzfunken' ? '#8cf9ea' : t.type === 'estrobo' ? '#ffdb7c' : t.type === 'zonavip' ? '#c8f879' : t.type === 'crowd' ? '#a78bfa' : '#ff6b8a'} />
              <text y="3" textAnchor="middle" fill="#111" fontSize="8" fontWeight="900">{t.type[0].toUpperCase()}{t.level}</text>
            </g>
          ))}
          {enemies.map(e => {
            const pos = pointOnPath(e.pathIndex, e.progress)
            const color = e.type === 'waterparty' ? '#fff' : e.type === 'guysong' ? '#ff9' : e.type === 'tentacion' ? '#f66' : e.type === 'hippies' ? '#9f9' : '#f9f'
            return <g key={e.id} transform={`translate(${pos.x} ${pos.y})`}><circle r="10" fill={color} /><text y="3" textAnchor="middle" fill="#111" fontSize="6">{e.type[0].toUpperCase()}</text></g>
          })}
        </svg>
      </GameSurface>
      <footer><button onClick={() => setRunning(r => !r)}>{running ? 'PAUSA' : 'REANUDAR'}</button></footer>
    </div>
  )
}
