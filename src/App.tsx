import { useEffect, useReducer, useState } from 'react'
import './App.css'
import PhotoGallery from './PhotoGallery'

type Page = 'inicio' | 'fotos' | 'arcade' | 'danzers' | 'danzin' | 'danzflor'
type Direction = 'up' | 'down' | 'left' | 'right'
type Point = { x: number; y: number }

type Game = {
  snake: Point[]
  food: Point
  direction: Direction
  running: boolean
  over: boolean
  score: number
}
type GameAction =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'turn'; direction: Direction }
  | { type: 'tick' }

const GRID = 13
const initialGame = (): Game => ({
  snake: [{ x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }],
  food: { x: 9, y: 6 },
  direction: 'right',
  running: false,
  over: false,
  score: 0,
})

const move: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const opposite: Record<Direction, Direction> = {
  up: 'down', down: 'up', left: 'right', right: 'left',
}

function nextFood(snake: Point[]): Point {
  const available: Point[] = []
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!snake.some((p) => p.x === x && p.y === y)) available.push({ x, y })
    }
  }
  return available[Math.floor(Math.random() * available.length)] ?? { x: 0, y: 0 }
}

function gameReducer(game: Game, action: GameAction): Game {
  switch (action.type) {
    case 'start': return game.over ? { ...initialGame(), running: true } : { ...game, running: true }
    case 'pause': return { ...game, running: false }
    case 'reset': return initialGame()
    case 'turn':
      return action.direction === opposite[game.direction] ? game : { ...game, direction: action.direction }
    case 'tick': {
      if (!game.running || game.over) return game
      const head = game.snake[0]
      const delta = move[game.direction]
      const next = { x: head.x + delta.x, y: head.y + delta.y }
      const eating = next.x === game.food.x && next.y === game.food.y
      const body = eating ? game.snake : game.snake.slice(0, -1)
      const collided = next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID ||
        body.some((p) => p.x === next.x && p.y === next.y)
      if (collided) return { ...game, running: false, over: true }
      const snake = [next, ...game.snake.slice(0, eating ? undefined : -1)]
      return {
        ...game,
        snake,
        food: eating ? nextFood(snake) : game.food,
        score: game.score + (eating ? 10 : 0),
        running: eating && snake.length === GRID * GRID ? false : game.running,
      }
    }
  }
}

const pages: { id: Page; label: string }[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'arcade', label: 'Arcade' },
  { id: 'danzers', label: 'DANZERS' },
  { id: 'danzin', label: 'DANZ IN' },
  { id: 'danzflor', label: 'DANZFLOR' },
]

function Arrow() { return <span aria-hidden="true" className="arrow">↗</span> }

export default function App() {
  const [page, setPage] = useState<Page>('inicio')
  const [game, dispatch] = useReducer(gameReducer, initialGame())

  useEffect(() => {
    if (page !== 'arcade' || !game.running) return
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), 150)
    return () => window.clearInterval(timer)
  }, [page, game.running])

  useEffect(() => {
    if (page !== 'arcade') return
    const directions: Record<string, Direction> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = directions[event.key]
      if (direction) {
        event.preventDefault()
        dispatch({ type: 'turn', direction })
      }
      if (event.code === 'Space') {
        event.preventDefault()
        dispatch({ type: game.running ? 'pause' : 'start' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [page, game.running])

  const go = (destination: Page) => {
    if (page === 'arcade' && destination !== 'arcade') dispatch({ type: 'pause' })
    setPage(destination)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <button className="wordmark" onClick={() => go('inicio')} aria-label="DANZ Collective, ir al inicio">
          DANZ<span className="wordmark-dot">.</span><span className="wordmark-small">COLLECTIVE</span>
        </button>
        <nav className="desktop-nav" aria-label="Navegación principal">
          {pages.map((item) => (
            <button key={item.id} onClick={() => go(item.id)} className={page === item.id ? 'active' : ''}>
              {item.label}
            </button>
          ))}
        </nav>
        <span className="build-tag"><span className="status-dot"/> PROTOTIPO LOCAL</span>
      </header>

      <main>
        {page === 'inicio' && (
          <>
            <section className="intro content">
              <div className="eyebrow"><span className="plus">✳</span> MUSIC · PEOPLE · CULTURE</div>
              <h1>WE ARE<br /><em>DANZ.</em></h1>
              <div className="intro-bottom">
                <p>Tu noche no acaba cuando termina la música.</p>
                <span>UNA EXPERIENCIA DEL COLECTIVO, EN UN SOLO LUGAR. ↓</span>
              </div>
            </section>

            <section className="feature-grid content" aria-label="Secciones principales">
              <button className="feature photo-feature" onClick={() => go('fotos')}>
                <span className="feature-top"><span>01 / RECUERDOS</span><Arrow /></span>
                <div className="photo-art" aria-hidden="true"><span>★</span><i/><b>AFTER<br />THE<br />NIGHT</b></div>
                <span className="feature-bottom"><strong>FOTOS</strong><small>Revive la noche.</small></span>
              </button>
              <button className="feature arcade-feature" onClick={() => go('arcade')}>
                <span className="feature-top"><span>02 / JUEGA</span><Arrow /></span>
                <div className="snake-art" aria-hidden="true">
                  <div className="pixel-snake">{Array.from({ length: 49 }, (_, i) => <span key={i} className={[9, 16, 23, 24, 25, 32].includes(i) ? 'lit' : i === 33 ? 'food' : ''}/>)}</div>
                  <span className="snake-stamp">PRESS PLAY_</span>
                </div>
                <span className="feature-bottom"><strong>ARCADE</strong><small>Juega a DANZ Snake.</small></span>
              </button>
            </section>

            <section className="content lower-section">
              <div className="section-heading"><span>EL UNIVERSO DANZ</span><span>03 — 05</span></div>
              <div className="module-grid">
                <button onClick={() => go('danzers')} className="module"><span>DANZERS <Arrow /></span><small>EVENTOS Y FIESTAS</small></button>
                <button onClick={() => go('danzin')} className="module"><span>DANZ IN <Arrow /></span><small>MÚSICA Y ARTISTAS</small></button>
                <button onClick={() => go('danzflor')} className="module"><span>DANZFLOR <Arrow /></span><small>MODA Y COLECCIONES</small></button>
              </div>
            </section>
          </>
        )}

        {/* Se mantiene montada para conservar las fotos al cambiar entre secciones.
            El contenido solo es visible cuando estamos en Fotos. */}
        <PhotoGallery active={page === 'fotos'} onBack={() => go('inicio')} />

        {page === 'arcade' && (
          <section className="content inner-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <div className="eyebrow">DANZ ARCADE / GAME 001</div>
            <h1 className="page-title">DANZ<br /><em>SNAKE.</em></h1>
            <p className="page-lead">Nuestro primer minijuego ya se puede probar. Utiliza las flechas del teclado, WASD o los controles táctiles. Esta puntuación es solo una prueba local: aún no hay premios ni rankings oficiales.</p>
            <div className="game-panel">
              <div className="game-heading"><span>SCORE <strong>{String(game.score).padStart(4, '0')}</strong></span><span>{game.over ? 'GAME OVER' : game.running ? 'NOW PLAYING ●' : 'READY / PAUSE'}</span></div>
              <div className="game-board" role="img" aria-label={`Tablero de Snake, puntuación ${game.score}`}>
                {Array.from({ length: GRID * GRID }, (_, i) => {
                  const x = i % GRID
                  const y = Math.floor(i / GRID)
                  const head = game.snake[0].x === x && game.snake[0].y === y
                  const body = game.snake.some((p) => p.x === x && p.y === y)
                  const food = game.food.x === x && game.food.y === y
                  return <span key={i} className={head ? 'cell head' : body ? 'cell snake' : food ? 'cell apple' : 'cell'}/>
                })}
                {!game.running && <div className="game-overlay">{game.over ? 'GAME OVER' : 'DANZ SNAKE'}<small>{game.over ? 'OTRA PARTIDA?' : 'PULSA JUGAR'}</small></div>}
              </div>
              <div className="game-actions">
                <button className="primary-btn" onClick={() => dispatch({ type: game.running ? 'pause' : 'start' })}>{game.running ? 'PAUSAR' : game.over ? 'VOLVER A JUGAR' : 'JUGAR'} <span>→</span></button>
                <button className="outline-btn" onClick={() => dispatch({ type: 'reset' })}>REINICIAR</button>
              </div>
              <div className="controls" aria-label="Controles para móvil">
                <button aria-label="Arriba" onClick={() => dispatch({ type: 'turn', direction: 'up' })}>↑</button>
                <div><button aria-label="Izquierda" onClick={() => dispatch({ type: 'turn', direction: 'left' })}>←</button><button aria-label="Abajo" onClick={() => dispatch({ type: 'turn', direction: 'down' })}>↓</button><button aria-label="Derecha" onClick={() => dispatch({ type: 'turn', direction: 'right' })}>→</button></div>
              </div>
            </div>
          </section>
        )}

        {page === 'danzers' && (
          <section className="content inner-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <div className="eyebrow">DANZ COLLECTIVE / EVENTS</div>
            <h1 className="page-title">DANZ<br /><em>ERS.</em></h1>
            <p className="page-lead">Fiestas, actuaciones y eventos colaboradores. Aquí incorporaremos el acceso por QR, los sellos del pasaporte y las galerías vinculadas a cada evento.</p>
            <div className="empty-state"><span className="empty-icon">✳</span><div><h2>Próximamente: agenda y pasaporte</h2><p>Esta sección está preparada, pero todavía no gestiona entradas ni emite sellos reales.</p></div><span className="pill">EN DESARROLLO</span></div>
          </section>
        )}

        {page === 'danzin' && (
          <section className="content inner-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <div className="eyebrow">DANZ COLLECTIVE / LABEL</div>
            <h1 className="page-title">DANZ<br /><em>IN.</em></h1>
            <p className="page-lead">Artistas, sesiones, lanzamientos y favoritos musicales. Más adelante llegarán DANZ ID y los momentos musicales de cada fiesta.</p>
            <div className="empty-state"><span className="empty-icon">♫</span><div><h2>El sonido de DANZ</h2><p>Añadiremos reproductores oficiales de Spotify, SoundCloud y YouTube, cuando estén disponibles, con enlaces a las plataformas originales.</p></div><span className="pill">EN DESARROLLO</span></div>
          </section>
        )}

        {page === 'danzflor' && (
          <section className="content inner-page">
            <button className="back" onClick={() => go('inicio')}>← VOLVER AL INICIO</button>
            <div className="eyebrow">DANZ COLLECTIVE / CLOTHING</div>
            <h1 className="page-title">DANZ<br /><em>FLOR.</em></h1>
            <p className="page-lead">La ropa del colectivo. Inicialmente enlazaremos la tienda existente; más adelante podremos incorporar un catálogo integrado y ventajas por puntos.</p>
            <a className="primary-btn external-btn" href="https://danzcollective.com/" target="_blank" rel="noreferrer">VISITAR LA WEB OFICIAL <Arrow /></a>
          </section>
        )}
      </main>

      <footer className="footer content"><span>DANZ COLLECTIVE © {new Date().getFullYear()}</span><span>PRIMER PROTOTIPO LOCAL · SIN CUENTAS NI DATOS REALES</span></footer>
    </div>
  )
}
