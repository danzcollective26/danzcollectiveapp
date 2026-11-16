import { useEffect, useRef, useState } from 'react'
import ArcadeMenu from '../ArcadeMenu'
import SelectionReel from '../SelectionReel'
import { useAuth } from '../../auth/AuthProvider'
import { useIdentity } from '../../auth/useIdentity'
import { apply, cardLabel, cardOf, colorName, COLORS, createMatch, humanWon, legalPlays, needsHuman, seatName, stepAi, symbolName, SYMBOLS, type Level, type SeisState } from './engine.ts'
import { chooseSeisBack, readSeisProgress, recordSeisResult, unlockedBacks } from './progress.ts'
import './seis.css'

const LEVELS: { id: Level; name: string; note: string }[] = [
  { id: 'facil', name: 'FÁCIL', note: 'Juega casi al azar y a veces se olvida el SEIS.' },
  { id: 'normal', name: 'NORMAL', note: 'Prioriza números altos y cartas especiales.' },
  { id: 'dificil', name: 'DIFÍCIL', note: 'Guarda las fuertes y aprieta cuando te queda poco.' },
]
const RIVALS = [
  { id: '1', name: '1 RIVAL', note: 'Una mesa corta.' },
  { id: '2', name: '2 RIVALES', note: 'Más jaleo, mismas reglas.' },
  { id: '3', name: '3 RIVALES', note: 'La mesa llena.' },
]
const PRIZES = [
  { id: 'local', name: 'PRÁCTICA', note: 'En este navegador. No suma DANZPOINTS.' },
  { id: 'ranked', name: 'CON PREMIO', note: 'El servidor rejuega la partida y decide los puntos.' },
]

export default function SeisGame({ onBack }: { onBack: () => void }) {
  const auth = useAuth()
  const identity = useIdentity()
  const [page, setPage] = useState('play')
  const [rivals, setRivals] = useState('1')
  const [level, setLevel] = useState<Level>('normal')
  const [prize, setPrize] = useState('local')
  const [progress, setProgress] = useState(readSeisProgress)
  const [match, setMatch] = useState<SeisState | null>(null)
  const [paused, setPaused] = useState(false)
  const [notice, setNotice] = useState('')
  const [serverNote, setServerNote] = useState('')
  const [reduced, setReduced] = useState(false)
  const actions = useRef<string[]>([])
  const ticket = useRef<{ id: string } | null>(null)
  const recorded = useRef('')
  const live = useRef<SeisState | null>(null)
  const alive = useRef(true)
  live.current = match

  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(media.matches)
    sync(); media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    const hide = () => { if (document.hidden) setPaused(true) }
    document.addEventListener('visibilitychange', hide)
    return () => document.removeEventListener('visibilitychange', hide)
  }, [])
  useEffect(() => {
    if (!match || paused || match.phase === 'over' || needsHuman(match)) return
    const timer = window.setTimeout(() => setMatch(current => current && current.phase !== 'over' && !needsHuman(current) ? stepAi(current) : current), reduced ? 0 : 420)
    return () => window.clearTimeout(timer)
  }, [match, paused, reduced])
  useEffect(() => {
    if (!match || match.phase !== 'over') return
    const key = `${match.rng}:${match.step}:${match.winner}`
    if (recorded.current === key) return
    recorded.current = key
    setProgress(recordSeisResult(humanWon(match), match.perfect))
  }, [match])
  useEffect(() => {
    const current = ticket.current
    if (!match || match.phase !== 'over' || !current || !auth.client) return
    const log = actions.current.join(',')
    const abort = new AbortController()
    void (async () => {
      try {
        const response = await auth.client!.rpc('danz_seis_submit', { p_id: current.id, p_actions: log }).abortSignal(abort.signal)
        const value = object(response.data)
        if (response.error || value.saved !== true || !Number.isSafeInteger(value.points)) throw new Error('invalid')
        if (alive.current) setServerNote(value.won === true ? `El servidor ha validado la victoria: ${value.points} DANZPOINTS (${String(value.reason)}).` : 'El servidor ha revisado la partida y no concede puntos.')
      } catch {
        if (abort.signal.aborted || !alive.current) return
        setServerNote('La partida ha terminado aquí. El servidor no ha concedido puntos.')
      }
    })()
    return () => abort.abort()
  }, [match, auth.client])

  async function start() {
    const opponents = Number(rivals)
    setNotice(''); setServerNote(''); actions.current = []; ticket.current = null; recorded.current = ''; setPaused(false)
    if (prize === 'local') {
      setMatch(createMatch(1 + Math.floor(Math.random() * 2147483646), opponents, level))
      return
    }
    if (!auth.user || !identity.data?.verified || !auth.client) {
      setNotice('Para el premio hacen falta correo confirmado e Instagram verificado. La práctica sigue abierta.')
      return
    }
    const id = crypto.randomUUID()
    const alias = `DANZER-${auth.user.id.slice(0, 4).toUpperCase()}`
    const response = await auth.client.rpc('danz_seis_start', { p_id: id, p_opponents: opponents, p_level: level, p_alias: alias })
    const value = object(response.data)
    const seed = Number(value.seed)
    if (response.error || value.id !== id || !Number.isSafeInteger(seed) || seed < 1 || value.level !== level || Number(value.opponents) !== opponents) {
      setNotice(response.error?.code === '42501' ? 'Confirma el correo y verifica Instagram para optar al premio.' : 'No se ha podido preparar la partida puntuable.')
      return
    }
    ticket.current = { id }
    setMatch(createMatch(seed, opponents, level))
  }

  function act(action: string) {
    const current = live.current
    if (!current || !needsHuman(current)) return
    const next = apply(current, action)
    if (!next.ok) return
    if (ticket.current) actions.current.push(action)
    live.current = next.state
    setMatch(next.state)
  }

  if (!match) return <ArcadeMenu title="SEIS" eyebrow="DE LA MAÑANA, QUÉ JALEO" art="/arcade/seis-mark.svg" accent="#d9ff6b" tabs={[{ id: 'play', label: 'JUGAR' }, { id: 'settings', label: 'DORSO' }, { id: 'help', label: 'CÓMO JUGAR' }]} page={page} onPage={setPage} onBack={onBack} action={{ label: 'JUGAR AHORA', onClick: () => void start() }} footer={prize === 'ranked' ? '10 PUNTOS SI EL SERVIDOR VALIDA LA VICTORIA' : 'PRÁCTICA LOCAL · SIN DANZPOINTS'}>
    {page === 'play' && <div className="menu-setup-stack">
      <SelectionReel label="Rivales" choices={RIVALS} value={rivals} onChange={setRivals}><div className="console-mode-icon">6</div></SelectionReel>
      <SelectionReel label="Nivel de la IA" choices={LEVELS} value={level} onChange={id => setLevel(id as Level)} />
      <SelectionReel label="Premio" choices={PRIZES} value={prize} onChange={setPrize} />
      <p className="seis-note">Victorias en este navegador: {progress.wins}. Racha: {progress.streak}. SEIS perfectos: {progress.perfect}.</p>
      {notice && <p role="alert">{notice}</p>}
    </div>}
    {page === 'settings' && <div className="menu-settings" role="group" aria-label="Dorso de carta">{unlockedBacks(progress).map(item => <button key={item.id} type="button" aria-pressed={progress.back === item.id} onClick={() => setProgress(chooseSeisBack(item.id))}>{item.name}</button>)}<small>Los dorsos se desbloquean a la 1, 3 y 7 victorias locales. No cambian las reglas ni los puntos.</small></div>}
    {page === 'help' && <div className="menu-help"><h2>QUÉDATE SIN CARTAS.</h2><p>Juega una carta del mismo color o del mismo símbolo. Si no puedes, roba una: si encaja, sale sola.</p><p>Con una carta hay que decir <b>SEIS</b> antes del turno siguiente. Si no, robas dos.</p><p>Las especiales salen sobre cualquier color, menos Jack gordo: solo sobre un Jack o si no tienes otra jugada.</p><small>Yeppo vacila y, a veces, tapa un marrón. La práctica no suma DANZPOINTS. En el modo con premio el servidor reparte la semilla y rejuega tus decisiones.</small></div>}
  </ArcadeMenu>

  const you = match.players[0]
  const legal = legalPlays(match)
  const blind = you.blind && match.phase === 'play'
  return <section className="seis-table" data-back={progress.back} aria-label="Partida de SEIS" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setPaused(true) } }}>
    <header className="seis-top"><div><small>DE LA MAÑANA, QUÉ JALEO</small><h1>SEIS</h1></div><div><button type="button" onClick={() => setPaused(true)}>PAUSA</button><button type="button" onClick={onBack}>SALIR</button></div></header>
    <p className="seis-yeppo" role="status">{match.log.at(-1) ?? 'Yeppo baraja.'}</p>
    <div className="seis-rivals">{match.players.slice(1).map((seat, index) => <article key={seatName(index + 1)} className="seis-rival"><small>{seatName(index + 1)}</small><strong>{seat.hand.length} cartas</strong><b>{seat.shield ? 'ESCUDO' : seat.blind ? 'A CIEGAS' : seat.skip ? 'SE SALTA' : 'EN MESA'}</b></article>)}</div>
    <div className="seis-board">
      <div className="seis-deck seis-back" aria-label={`${match.deck.length} cartas en el mazo`}><span>{match.deck.length}</span></div>
      <div>{match.discard[0] !== undefined && <Card id={match.discard[0]} />}<p className="seis-note">Color {colorName(match.color)}{match.lock ? ` · exige ${symbolName(match.lock)}` : ''}</p></div>
    </div>
    <div className="seis-zone">
      {match.phase !== 'play' && match.phase !== 'over' && match.phase !== 'discard' && <div className="seis-choices">{choices(match, act)}</div>}
      {match.phase !== 'over' && match.phase !== 'discard' && <div className="seis-hand" aria-label="Tu mano">{you.hand.map(id => <button key={id} type="button" className="seis-play" disabled={match.phase !== 'play' || !legal.includes(id)} aria-label={blind ? 'Carta oculta' : cardLabel(id)} onClick={() => act(`p${id}`)}>{blind ? <span className="seis-card seis-back" /> : <Card id={id} />}</button>)}{match.phase === 'play' && legal.length === 0 && <button type="button" onClick={() => act('d')}>ROBAR</button>}</div>}
      {match.phase === 'discard' && <div className="seis-choices">{choices(match, act)}</div>}
      {match.phase === 'over' && <div className="seis-over"><h2>{humanWon(match) ? 'MANO VACÍA' : 'OTRA MESA'}</h2><p>{humanWon(match) ? (match.perfect ? 'SEIS dicho y ganado.' : 'Te has quedado sin cartas.') : `${seatName(match.winner ?? 1)} cierra la mano.`}</p><p>{serverNote || (ticket.current ? 'Comprobando la partida en el servidor…' : 'Práctica local. No suma DANZPOINTS.')}</p><button type="button" className="seis-call" onClick={() => void start()}>OTRA PARTIDA</button><button type="button" onClick={onBack}>VOLVER A LA BIBLIOTECA</button></div>}
    </div>
    {paused && match.phase !== 'over' && <div className="seis-over"><h2>PAUSA</h2><p>La mesa espera. Al volver de otra aplicación también se para.</p><button type="button" className="seis-call" onClick={() => setPaused(false)}>SEGUIR</button><button type="button" onClick={onBack}>SALIR</button></div>}
  </section>
}

function Card({ id }: { id: number }) {
  const card = cardOf(id)
  return <span className="seis-card" data-color={card.color ?? 'comodin'}><small>{card.special ? specialShort(card.special) : symbolName(card.symbol ?? '')}</small><b>{card.special ? '✦' : card.symbol}</b><small>{card.color ? colorName(card.color) : 'COMODÍN'}</small></span>
}
function specialShort(special: string) {
  if (special === 'flor-negra') return 'FLOR NEGRA'
  if (special === 'flor-blanca') return 'FLOR BLANCA'
  if (special === 'jack-cruzado') return 'JACK CRUZADO'
  if (special === 'jack-gordo') return 'JACK GORDO'
  if (special === 'doble-jack') return 'DOBLE JACK'
  if (special === 'panas-fuerte') return 'PANAS FUERTE'
  if (special === 'vinilo-rallado') return 'VINILO RALLADO'
  if (special === 'luz-estrobo') return 'LUZ ESTROBO'
  return special.toUpperCase()
}
function choices(match: SeisState, act: (action: string) => void) {
  if (match.phase === 'color') return COLORS.map((color, index) => <button key={color} type="button" className={`seis-c-${color}`} onClick={() => act(`c${index}`)}>{colorName(color)}</button>)
  if (match.phase === 'demand') return <>{SYMBOLS.map(symbol => <button key={symbol} type="button" onClick={() => act(`y${symbol === 'flor' ? 'f' : symbol === 'vinilo' ? 'v' : symbol === 'jack' ? 'j' : 'l'}`)}>{symbolName(symbol)}</button>)}{'0123456789'.split('').map(number => <button key={number} type="button" onClick={() => act(`y${number}`)}>{number}</button>)}<button type="button" onClick={() => act('y-')}>NINGUNO</button></>
  if (match.phase === 'panas-who') return match.players.map((_, index) => index === match.current ? null : <button key={index} type="button" onClick={() => act(`a${index}`)}>{seatName(index)}</button>)
  if (match.phase === 'panas-how') return <><button type="button" onClick={() => act('m0')}>PROTECCIÓN</button><button type="button" onClick={() => act('m1')}>INTERCAMBIAR</button></>
  if (match.phase === 'wishlist') return match.wish.map((id, index) => <button key={id} type="button" className="seis-choice" aria-label={`Quedarme ${cardLabel(id)}`} onClick={() => act(`w${index}`)}><Card id={id} /></button>)
  if (match.phase === 'order') return <><button type="button" onClick={() => act('o0')}>ARRIBA {cardLabel(match.wish[0])}</button><button type="button" onClick={() => act('o1')}>ARRIBA {cardLabel(match.wish[1])}</button></>
  if (match.phase === 'resaca') return <><button type="button" onClick={() => act('r0')}>DESCARTAR UNA</button><button type="button" onClick={() => act('r1')}>ROBAR DOS Y ELEGIR</button></>
  if (match.phase === 'discard') return match.players[match.current].hand.map(id => <button key={id} type="button" className="seis-choice" aria-label={`Descartar ${cardLabel(id)}`} onClick={() => act(`q${id}`)}><Card id={id} /></button>)
  if (match.phase === 'strobe') return match.strobe.map((item, index) => <button key={`${item.player}-${item.card}`} type="button" className="seis-choice" aria-label={`Elegir ${cardLabel(item.card)} de ${seatName(item.player)}`} onClick={() => act(`l${index}`)}><Card id={item.card} /></button>)
  if (match.phase === 'give') return <><button type="button" onClick={() => act('g-')}>QUEDÁRMELA</button>{match.players.map((_, index) => index === match.current ? null : <button key={index} type="button" onClick={() => act(`g${index}`)}>DAR A {seatName(index)}</button>)}</>
  if (match.phase === 'yeppo') return <><button type="button" onClick={() => act('e0')}>ESCUDO</button><button type="button" onClick={() => act('e1')}>ROBAR Y JUGAR</button></>
  if (match.phase === 'boon') return <><button type="button" onClick={() => act('b0')}>ESCUDO</button><button type="button" onClick={() => act('b1')}>CONSEJO</button></>
  if (match.phase === 'seis') return <><button type="button" className="seis-call" onClick={() => act('s')}>DECIR SEIS</button><button type="button" onClick={() => act('n')}>ME LO CALLO</button></>
  return null
}
function object(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
