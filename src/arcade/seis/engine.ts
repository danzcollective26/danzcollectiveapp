import { YEPPO_LINES, yeppoLine } from './phrases.ts'

export const COLORS = ['negro', 'lima', 'rosa', 'violeta', 'agua'] as const
export const SYMBOLS = ['flor', 'vinilo', 'jack', 'luz'] as const
export const LEVELS = ['facil', 'normal', 'dificil'] as const
export const AI_NAMES = ['LIMA SUELTA', 'ROSA DE CABINA', 'VINILO TORCIDO'] as const
export const DECK_SIZE = 90
export const HAND_SIZE = 7
export const MAX_STEP = 500

export type Color = (typeof COLORS)[number]
export type Level = (typeof LEVELS)[number]
export type Special =
  | 'yeppo' | 'panas' | 'panas-fuerte' | 'jack-cruzado' | 'drop' | 'resaca'
  | 'wishlist' | 'cambio' | 'flor-negra' | 'flor-blanca' | 'vinilo-rallado'
  | 'luz-estrobo' | 'doble-jack' | 'jack-gordo'

export const SPECIALS: readonly Special[] = [
  'yeppo', 'yeppo', 'panas', 'panas', 'panas-fuerte', 'jack-cruzado', 'jack-cruzado',
  'drop', 'drop', 'resaca', 'wishlist', 'cambio', 'cambio', 'flor-negra', 'flor-blanca',
  'vinilo-rallado', 'luz-estrobo', 'doble-jack', 'doble-jack', 'jack-gordo',
]

const SPECIAL_VALUE: Record<Special, number> = {
  yeppo: 14, panas: 13, 'panas-fuerte': 16, 'jack-cruzado': 18, drop: 20, resaca: 17,
  wishlist: 15, cambio: 16, 'flor-negra': 22, 'flor-blanca': 12, 'vinilo-rallado': 17,
  'luz-estrobo': 16, 'doble-jack': 19, 'jack-gordo': 24,
}
const ATTACK: Special[] = ['drop', 'doble-jack', 'jack-gordo', 'resaca', 'jack-cruzado', 'vinilo-rallado', 'luz-estrobo']
const SAVE: Special[] = ['jack-gordo', 'flor-negra', 'drop', 'doble-jack']
const STRONG: Special[] = ['jack-cruzado', 'resaca', 'flor-negra', 'jack-gordo']

export type Card = { id: number; color: Color | null; symbol: string | null; special: Special | null }
export type Phase = 'play' | 'color' | 'demand' | 'panas-who' | 'panas-how' | 'wishlist' | 'order' | 'resaca' | 'discard' | 'strobe' | 'give' | 'yeppo' | 'boon' | 'seis' | 'over'
export type Seat = { hand: number[]; ai: boolean; shield: boolean; skip: boolean; pendingDraw: number; resaca: boolean; blind: boolean; saidSeis: boolean; missed: number }
export type Cover = { a: number; b: number; until: number }
export type Shown = { player: number; card: number }
export type SeisState = {
  level: Level
  rng: number
  deck: number[]
  discard: number[]
  players: Seat[]
  current: number
  direction: 1 | -1
  color: Color
  lock: string | null
  covers: Cover[]
  wish: number[]
  strobe: Shown[]
  give: number | null
  phase: Phase
  step: number
  winner: number | null
  perfect: boolean
  capped: boolean
  log: string[]
}
export type Step = { ok: true; state: SeisState } | { ok: false; error: string }

export function nextRng(rng: number) {
  return Number((BigInt(rng) * 48271n) % 2147483647n)
}
export function cardOf(id: number): Card {
  if (id < 50) return { id, color: COLORS[Math.floor(id / 10)], symbol: String(id % 10), special: null }
  if (id < 70) {
    const index = id - 50
    return { id, color: COLORS[Math.floor(index / 4)], symbol: SYMBOLS[index % 4], special: null }
  }
  const special = SPECIALS[id - 70]
  return { id, color: null, symbol: specialSymbol(special), special }
}
function specialSymbol(special: Special) {
  if (special === 'doble-jack' || special === 'jack-cruzado' || special === 'jack-gordo') return 'jack'
  if (special === 'vinilo-rallado') return 'vinilo'
  if (special === 'luz-estrobo') return 'luz'
  if (special === 'yeppo' || special === 'flor-negra' || special === 'flor-blanca') return 'flor'
  return null
}
export function seatName(index: number) {
  return index === 0 ? 'TÚ' : AI_NAMES[index - 1] ?? 'CREW'
}
export function cardLabel(id: number) {
  const card = cardOf(id)
  const color = card.color ? colorName(card.color) : 'COMODÍN'
  if (card.special) return `${specialName(card.special)} · ${color}`
  return `${color} ${card.symbol === 'flor' || card.symbol === 'vinilo' || card.symbol === 'jack' || card.symbol === 'luz' ? symbolName(card.symbol) : card.symbol}`
}
export function colorName(color: Color) {
  return color === 'negro' ? 'NEGRO' : color === 'lima' ? 'LIMA' : color === 'rosa' ? 'ROSA' : color === 'violeta' ? 'VIOLETA' : 'AGUA'
}
export function symbolName(symbol: string) {
  return symbol === 'flor' ? 'FLOR' : symbol === 'vinilo' ? 'VINILO' : symbol === 'jack' ? 'JACK' : symbol === 'luz' ? 'LUZ' : symbol
}
export function specialName(special: Special) {
  const names: Record<Special, string> = {
    yeppo: 'YEPPO', panas: 'PANAS', 'panas-fuerte': 'PANAS FUERTE', 'jack-cruzado': 'JACK CRUZADO',
    drop: 'DROP', resaca: 'RESACA', wishlist: 'WISHLIST', cambio: 'CAMBIO DE TEMA',
    'flor-negra': 'FLOR NEGRA', 'flor-blanca': 'FLOR BLANCA', 'vinilo-rallado': 'VINILO RALLADO',
    'luz-estrobo': 'LUZ ESTROBOSCÓPICA', 'doble-jack': 'DOBLE JACK', 'jack-gordo': 'JACK GORDO',
  }
  return names[special]
}
export function baseValue(id: number) {
  const card = cardOf(id)
  if (card.special) return SPECIAL_VALUE[card.special]
  if (card.symbol && card.symbol >= '0' && card.symbol <= '9') return Number(card.symbol)
  return 8
}
export function nextSeat(state: SeisState, from = state.current) {
  const count = state.players.length
  return (from + state.direction + count * 2) % count
}
export function needsHuman(state: SeisState) {
  return state.phase !== 'over' && (state.phase === 'seis' || !state.players[state.current].ai)
}
export function pile(state: SeisState) {
  return [...state.deck, ...state.discard, ...state.wish, ...state.players.flatMap(seat => seat.hand)]
}

function roll(state: SeisState, mod: number) {
  state.rng = nextRng(state.rng)
  return state.rng % mod
}
function speak(state: SeisState, bucket: readonly string[]) {
  state.log = [...state.log, yeppoLine(bucket, state.step, state.current)].slice(-8)
}
function say(state: SeisState, text: string) {
  state.log = [...state.log, text].slice(-8)
}
function covered(state: SeisState, player: number) {
  return state.covers.some(cover => (cover.a === player || cover.b === player) && cover.until > state.step)
}
function harm(state: SeisState, player: number, effect: () => void) {
  if (covered(state, player)) return false
  if (state.players[player].shield) {
    state.players[player].shield = false
    say(state, 'El escudo de Yeppo se come el marrón.')
    return false
  }
  effect()
  return true
}
function draw(state: SeisState, player: number, count: number) {
  const got: number[] = []
  for (let i = 0; i < count; i += 1) {
    if (!state.deck.length) recycle(state)
    const id = state.deck.pop()
    if (id === undefined) break
    state.players[player].hand.push(id)
    got.push(id)
  }
  return got
}
function recycle(state: SeisState) {
  if (state.discard.length <= 1) return
  const top = state.discard[0]
  const rest = state.discard.slice(1)
  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = roll(state, i + 1)
    const swap = rest[i]
    rest[i] = rest[j]
    rest[j] = swap
  }
  state.deck = rest
  state.discard = [top]
}
function canPlayPlain(state: SeisState, id: number) {
  const card = cardOf(id)
  if (card.special === 'flor-negra') return true
  if (state.lock) return card.symbol === state.lock
  if (card.special && card.special !== 'jack-gordo') return true
  const top = cardOf(state.discard[0])
  return card.color === state.color || (card.symbol !== null && card.symbol === top.symbol)
}
export function canPlay(state: SeisState, id: number) {
  const card = cardOf(id)
  if (card.special !== 'jack-gordo') return canPlayPlain(state, id)
  const hand = state.players[state.current].hand
  const emergency = !hand.some(other => other !== id && canPlayPlain(state, other))
  return cardOf(state.discard[0]).symbol === 'jack' || state.lock === 'jack' || emergency
}
export function legalPlays(state: SeisState) {
  if (state.phase !== 'play') return []
  return state.players[state.current].hand.filter(id => canPlay(state, id)).sort((a, b) => a - b)
}
function opponentPressure(state: SeisState) {
  let lowest = 99
  for (let i = 0; i < state.players.length; i += 1) if (i !== state.current) lowest = Math.min(lowest, state.players[i].hand.length)
  return lowest
}
function score(state: SeisState, id: number, level: Level) {
  const card = cardOf(id)
  const mine = state.players[state.current].hand.length
  const pressure = opponentPressure(state)
  let value = baseValue(id)
  if (mine === 1) value += 100
  if (level === 'normal' && card.special) value += 12
  if (level === 'dificil' && card.special && ATTACK.includes(card.special) && pressure <= 2) value += 50
  if (level === 'dificil' && card.special && SAVE.includes(card.special) && mine > 3 && pressure > 2) value -= 40
  return value
}
function bestIndex(ids: number[]) {
  return ids.reduce((best, id, index) => {
    const better = baseValue(id) > baseValue(ids[best]) || (baseValue(id) === baseValue(ids[best]) && id < ids[best])
    return better ? index : best
  }, 0)
}
function worstId(ids: number[]) {
  return ids.reduce((worst, id) => {
    const worse = baseValue(id) < baseValue(worst) || (baseValue(id) === baseValue(worst) && id > worst)
    return worse ? id : worst
  }, ids[0])
}
function bestTarget(state: SeisState) {
  let best = -1
  for (let i = 0; i < state.players.length; i += 1) {
    if (i === state.current) continue
    if (best < 0 || state.players[i].hand.length < state.players[best].hand.length) best = i
  }
  return best
}
function advice(state: SeisState) {
  const totals = new Map<string, number>()
  let key = 'lima'
  let best = 0
  let owner = bestTarget(state)
  for (let i = 0; i < state.players.length; i += 1) {
    if (i === state.current) continue
    const mine = new Map<string, number>()
    for (const id of state.players[i].hand) {
      const card = cardOf(id)
      const name = card.color ?? card.symbol
      if (!name) continue
      mine.set(name, (mine.get(name) ?? 0) + 1)
      totals.set(name, (totals.get(name) ?? 0) + 1)
    }
    for (const [name, value] of mine) if (value > best) { best = value; key = name; owner = i }
  }
  const count = totals.get(key) ?? best
  const label = (COLORS as readonly string[]).includes(key) ? colorName(key as Color) : symbolName(key)
  return count > 1 ? `${seatName(owner)} guarda varias de ${label}.` : `${seatName(owner)} va justo de ${label}.`
}

export function aiAction(state: SeisState) {
  const blind = state.players[state.current].blind
  const level: Level = blind ? 'facil' : state.level
  const easy = level === 'facil'
  if (state.phase === 'play') {
    const legal = legalPlays(state)
    if (!legal.length) return 'd'
    if (easy) return `p${legal[roll(state, legal.length)]}`
    return `p${legal.reduce((best, id) => score(state, id, level) > score(state, best, level) || (score(state, id, level) === score(state, best, level) && id < best) ? id : best)}`
  }
  if (state.phase === 'color') return `c${easy ? roll(state, COLORS.length) : bestColor(state)}`
  if (state.phase === 'demand') return `y${easy ? '-' : demandCode(state)}`
  if (state.phase === 'panas-who') {
    const options = state.players.map((_, index) => index).filter(index => index !== state.current)
    return `a${easy ? options[roll(state, options.length)] : bestTarget(state)}`
  }
  if (state.phase === 'panas-how') return easy ? `m${roll(state, 2)}` : `m${state.players[state.current].hand.length <= state.players[bestTarget(state)].hand.length ? 0 : 1}`
  if (state.phase === 'wishlist') return `w${easy ? roll(state, state.wish.length) : bestIndex(state.wish)}`
  if (state.phase === 'order') {
    if (easy || state.level !== 'dificil') return 'o0'
    return `o${baseValue(state.wish[0]) <= baseValue(state.wish[1]) ? 0 : 1}`
  }
  if (state.phase === 'resaca') return !easy && state.players[state.current].hand.length > 2 ? 'r1' : 'r0'
  if (state.phase === 'discard') return `q${easy ? state.players[state.current].hand[roll(state, state.players[state.current].hand.length)] : worstId(state.players[state.current].hand)}`
  if (state.phase === 'strobe') return `l${easy ? roll(state, state.strobe.length) : bestIndex(state.strobe.map(item => item.card))}`
  if (state.phase === 'give') return 'g-'
  if (state.phase === 'yeppo') return `${easy ? (roll(state, 2) === 0 ? 'e0' : 'e1') : opponentPressure(state) <= 2 ? 'e0' : 'e1'}`
  if (state.phase === 'boon') return `${easy ? (roll(state, 2) === 0 ? 'b0' : 'b1') : opponentPressure(state) <= 2 ? 'b0' : 'b1'}`
  return 'n'
}
function bestColor(state: SeisState) {
  const counts = [0, 0, 0, 0, 0]
  for (const id of state.players[state.current].hand) {
    const color = cardOf(id).color
    if (color) counts[COLORS.indexOf(color)] += 1
  }
  return counts.reduce((best, value, index) => value > counts[best] ? index : best, 0)
}
function demandCode(state: SeisState) {
  const counts = new Map<string, number>()
  for (const id of state.players[state.current].hand) {
    const symbol = cardOf(id).symbol
    if (symbol) counts.set(symbol, (counts.get(symbol) ?? 0) + 1)
  }
  let best = ''
  let count = 1
  for (const symbol of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ...SYMBOLS]) {
    const value = counts.get(symbol) ?? 0
    if (value > count) { best = symbol; count = value }
  }
  if (!best) return '-'
  return best === 'flor' ? 'f' : best === 'vinilo' ? 'v' : best === 'jack' ? 'j' : best === 'luz' ? 'l' : best
}
function codeSymbol(code: string) {
  if (code === 'f') return 'flor'
  if (code === 'v') return 'vinilo'
  if (code === 'j') return 'jack'
  if (code === 'l') return 'luz'
  return /^[0-9]$/.test(code) ? code : null
}

function claim(state: SeisState) {
  const winner = state.players.findIndex(seat => seat.hand.length === 0)
  if (winner < 0) return false
  state.winner = winner
  state.perfect = winner === 0 && state.players[0].saidSeis
  state.phase = 'over'
  if (winner === 0) speak(state, state.perfect ? YEPPO_LINES.perfect : YEPPO_LINES.win)
  else say(state, `${seatName(winner)} cierra la mesa. ${yeppoLine(YEPPO_LINES.lose, state.step, winner)}`)
  return true
}
function cap(state: SeisState) {
  if (state.step < MAX_STEP) return false
  let winner = 0
  for (let i = 1; i < state.players.length; i += 1) if (state.players[i].hand.length < state.players[winner].hand.length) winner = i
  state.winner = winner
  state.capped = true
  state.perfect = false
  state.phase = 'over'
  say(state, 'Esto ya es de día. Gana quien menos cartas arrastra.')
  return true
}
function advance(state: SeisState) {
  if (cap(state)) return
  state.players[state.current].blind = false
  for (let guard = 0; guard < 8; guard += 1) {
    state.current = nextSeat(state)
    state.step += 1
    if (cap(state)) return
    state.covers = state.covers.filter(cover => cover.until > state.step)
    const seat = state.players[state.current]
    if (seat.pendingDraw > 0) {
      const count = seat.pendingDraw
      seat.pendingDraw = 0
      draw(state, state.current, count)
    }
    if (seat.skip) {
      seat.skip = false
      seat.blind = false
      continue
    }
    if (seat.resaca) {
      seat.resaca = false
      state.phase = seat.hand.length ? 'resaca' : 'play'
      if (!seat.hand.length) claim(state)
      return
    }
    state.phase = 'play'
    return
  }
  cap(state)
}
function finish(state: SeisState) {
  if (claim(state)) return
  for (const seat of state.players) if (seat.hand.length !== 1) seat.saidSeis = false
  for (let i = 0; i < state.players.length; i += 1) {
    const seat = state.players[i]
    if (!seat.ai || seat.hand.length !== 1 || seat.saidSeis) continue
    const sayIt = state.level !== 'facil' || roll(state, 3) !== 0
    if (sayIt) {
      seat.saidSeis = true
      say(state, `${seatName(i)} suelta el SEIS.`)
    } else {
      draw(state, i, 2)
      say(state, `${seatName(i)} se come dos cartas por callarse el SEIS.`)
    }
  }
  if (state.players[0].hand.length === 1 && !state.players[0].saidSeis) {
    state.phase = 'seis'
    speak(state, YEPPO_LINES.seis)
    return
  }
  advance(state)
}
function playCard(state: SeisState, id: number) {
  const seat = state.players[state.current]
  const index = seat.hand.indexOf(id)
  if (index < 0 || !canPlay(state, id)) return 'card'
  seat.hand.splice(index, 1)
  state.discard.unshift(id)
  state.lock = null
  seat.missed = 0
  const card = cardOf(id)
  if (card.color) state.color = card.color
  resolve(state, card.special)
  return null
}
function resolve(state: SeisState, special: Special | null) {
  if (!special) { finish(state); return }
  if (STRONG.includes(special)) speak(state, YEPPO_LINES.strong)
  if (special === 'yeppo') { state.phase = 'yeppo'; return }
  if (special === 'panas' || special === 'panas-fuerte') { state.phase = 'panas-who'; return }
  if (special === 'jack-cruzado') {
    state.direction = state.direction === 1 ? -1 : 1
    const target = nextSeat(state)
    harm(state, target, () => { state.lock = 'jack' })
    finish(state)
    return
  }
  if (special === 'drop') {
    for (let i = 0; i < state.players.length; i += 1) if (i !== state.current) harm(state, i, () => { draw(state, i, 1) })
    harm(state, nextSeat(state), () => { state.players[nextSeat(state)].skip = true })
    finish(state)
    return
  }
  if (special === 'resaca') {
    harm(state, nextSeat(state), () => { state.players[nextSeat(state)].resaca = true })
    finish(state)
    return
  }
  if (special === 'wishlist') {
    state.wish = []
    for (let i = 0; i < 3; i += 1) {
      if (!state.deck.length) recycle(state)
      const id = state.deck.pop()
      if (id === undefined) break
      state.wish.push(id)
    }
    state.phase = state.wish.length ? 'wishlist' : 'play'
    if (!state.wish.length) finish(state)
    return
  }
  if (special === 'cambio' || special === 'flor-negra' || special === 'flor-blanca') { state.phase = 'color'; return }
  if (special === 'vinilo-rallado') {
    harm(state, nextSeat(state), () => { state.players[nextSeat(state)].blind = true })
    finish(state)
    return
  }
  if (special === 'luz-estrobo') {
    state.strobe = []
    for (let i = 0; i < state.players.length; i += 1) {
      const hand = state.players[i].hand
      if (!hand.length) continue
      state.strobe.push({ player: i, card: hand[roll(state, hand.length)] })
    }
    state.phase = state.strobe.length ? 'strobe' : 'play'
    if (!state.strobe.length) finish(state)
    return
  }
  if (special === 'doble-jack') {
    harm(state, nextSeat(state), () => { state.players[nextSeat(state)].pendingDraw += 2 })
    finish(state)
    return
  }
  harm(state, nextSeat(state), () => {
    const seat = state.players[nextSeat(state)]
    seat.pendingDraw += 4
    seat.skip = true
  })
  finish(state)
}
function bury(state: SeisState, id: number) {
  state.discard.splice(1, 0, id)
}
function moveCard(state: SeisState, from: number, to: number, id: number) {
  if (from === to) return
  const hand = state.players[from].hand
  const index = hand.indexOf(id)
  if (index < 0) return
  hand.splice(index, 1)
  state.players[to].hand.push(id)
}

function dispatch(state: SeisState, action: string) {
  const seat = state.players[state.current]
  if (state.phase === 'over') return 'over'
  if (state.phase === 'play') {
    if (action === 'd') {
      const got = draw(state, state.current, 1)
      if (got[0] !== undefined && canPlay(state, got[0])) return playCard(state, got[0])
      state.lock = null
      seat.missed += 1
      if (seat.missed === 2) speak(state, YEPPO_LINES.miss)
      finish(state)
      return null
    }
    const played = /^p(\d+)$/.exec(action)
    return played ? playCard(state, Number(played[1])) : 'phase'
  }
  if (state.phase === 'color') {
    const chosen = /^c([0-4])$/.exec(action)
    if (!chosen) return 'phase'
    state.color = COLORS[Number(chosen[1])]
    const special = cardOf(state.discard[0]).special
    if (special === 'cambio') { state.phase = 'demand'; return null }
    if (special === 'flor-negra') { state.phase = 'boon'; return null }
    say(state, advice(state))
    finish(state)
    return null
  }
  if (state.phase === 'demand') {
    const chosen = /^y([0-9fvlj-])$/.exec(action)
    const symbol = chosen ? codeSymbol(chosen[1]) : null
    if (!chosen || (chosen[1] !== '-' && !symbol)) return 'phase'
    state.lock = symbol
    finish(state)
    return null
  }
  if (state.phase === 'panas-who') {
    const chosen = /^a(\d)$/.exec(action)
    const target = chosen ? Number(chosen[1]) : -1
    if (target === state.current || target < 0 || target >= state.players.length) return 'target'
    if (cardOf(state.discard[0]).special === 'panas-fuerte') {
      state.covers.push({ a: state.current, b: target, until: state.step + state.players.length * 2 })
      finish(state)
      return null
    }
    state.give = target
    state.phase = 'panas-how'
    return null
  }
  if (state.phase === 'panas-how') {
    if (action !== 'm0' && action !== 'm1') return 'phase'
    const target = state.give ?? -1
    state.give = null
    if (target < 0) return 'target'
    if (action === 'm0') state.covers.push({ a: state.current, b: target, until: state.step + state.players.length })
    else swap(state, state.current, target)
    finish(state)
    return null
  }
  if (state.phase === 'wishlist') {
    const chosen = /^w([0-2])$/.exec(action)
    const index = chosen ? Number(chosen[1]) : -1
    if (index < 0 || index >= state.wish.length) return 'phase'
    seat.hand.push(state.wish[index])
    state.wish = state.wish.filter((_, item) => item !== index)
    if (state.wish.length === 2) { state.phase = 'order'; return null }
    state.deck.push(...state.wish)
    state.wish = []
    finish(state)
    return null
  }
  if (state.phase === 'order') {
    if (action !== 'o0' && action !== 'o1') return 'phase'
    const ordered = action === 'o0' ? [...state.wish].reverse() : [...state.wish]
    state.deck.push(...ordered)
    state.wish = []
    finish(state)
    return null
  }
  if (state.phase === 'resaca') {
    if (action === 'r0') {
      const id = seat.hand.splice(roll(state, seat.hand.length), 1)[0]
      bury(state, id)
      finish(state)
      return null
    }
    if (action === 'r1') {
      draw(state, state.current, 2)
      state.phase = 'discard'
      return null
    }
    return 'phase'
  }
  if (state.phase === 'discard') {
    const chosen = /^q(\d+)$/.exec(action)
    const id = chosen ? Number(chosen[1]) : -1
    const index = seat.hand.indexOf(id)
    if (index < 0) return 'card'
    seat.hand.splice(index, 1)
    bury(state, id)
    finish(state)
    return null
  }
  if (state.phase === 'strobe') {
    const chosen = /^l(\d+)$/.exec(action)
    const index = chosen ? Number(chosen[1]) : -1
    if (index < 0 || index >= state.strobe.length) return 'phase'
    state.give = index
    state.phase = 'give'
    return null
  }
  if (state.phase === 'give') {
    const chosen = /^g(-|\d)$/.exec(action)
    if (!chosen || state.give === null) return 'phase'
    const shown = state.strobe[state.give]
    const target = chosen[1] === '-' ? state.current : Number(chosen[1])
    if (target < 0 || target >= state.players.length) return 'target'
    moveCard(state, shown.player, target, shown.card)
    state.strobe = []
    state.give = null
    finish(state)
    return null
  }
  if (state.phase === 'yeppo') {
    if (action === 'e0') { seat.shield = true; speak(state, YEPPO_LINES.shield); finish(state); return null }
    if (action === 'e1') {
      const got = draw(state, state.current, 1)
      if (got[0] !== undefined && canPlay(state, got[0])) return playCard(state, got[0])
      finish(state)
      return null
    }
    return 'phase'
  }
  if (state.phase === 'boon') {
    if (action === 'b0') { seat.shield = true; speak(state, YEPPO_LINES.shield); finish(state); return null }
    if (action === 'b1') { say(state, advice(state)); finish(state); return null }
    return 'phase'
  }
  if (action === 's') { state.players[0].saidSeis = true; advance(state); return null }
  if (action === 'n') {
    draw(state, 0, 2)
    state.players[0].saidSeis = false
    speak(state, YEPPO_LINES.mock)
    advance(state)
    return null
  }
  return 'phase'
}
function swap(state: SeisState, left: number, right: number) {
  if (!state.players[left].hand.length || !state.players[right].hand.length) return
  const leftCard = state.players[left].hand.splice(roll(state, state.players[left].hand.length), 1)[0]
  const rightCard = state.players[right].hand.splice(roll(state, state.players[right].hand.length), 1)[0]
  state.players[right].hand.push(leftCard)
  state.players[left].hand.push(rightCard)
}

function blankSeat(ai: boolean): Seat {
  return { hand: [], ai, shield: false, skip: false, pendingDraw: 0, resaca: false, blind: false, saidSeis: false, missed: 0 }
}
function shell(level: Level, players: Seat[], rng: number, deck: number[], discard: number[], color: Color): SeisState {
  return {
    level, rng, deck, discard, players, current: 0, direction: 1, color, lock: null, covers: [], wish: [], strobe: [],
    give: null, phase: 'play', step: 0, winner: null, perfect: false, capped: false, log: [],
  }
}
export function createMatch(seed: number, opponents: number, level: Level) {
  if (!Number.isInteger(seed) || seed < 1 || seed > 2147483646 || !Number.isInteger(opponents) || opponents < 1 || opponents > 3 || !LEVELS.includes(level)) throw new Error('Invalid SEIS setup')
  let rng = seed
  const cards = Array.from({ length: DECK_SIZE }, (_, id) => id)
  for (let i = cards.length - 1; i > 0; i -= 1) {
    rng = nextRng(rng)
    const j = rng % (i + 1)
    const swapCard = cards[i]
    cards[i] = cards[j]
    cards[j] = swapCard
  }
  const players = Array.from({ length: opponents + 1 }, (_, index) => blankSeat(index !== 0))
  for (let round = 0; round < HAND_SIZE; round += 1) for (const seat of players) seat.hand.push(cards.pop()!)
  for (let guard = 0; guard < 30 && cards.length && cardOf(cards[cards.length - 1]).special; guard += 1) cards.unshift(cards.pop()!)
  const starter = cards.pop()!
  const state = shell(level, players, rng, cards, [starter], cardOf(starter).color ?? 'lima')
  speak(state, YEPPO_LINES.open)
  return state
}
export function scenario(input: { level?: Level; hands: number[][]; top: number; deck?: number[]; rng?: number; current?: number; direction?: 1 | -1; lock?: string | null; color?: Color; phase?: Phase; said?: boolean[]; shields?: boolean[]; covers?: Cover[]; step?: number }): SeisState {
  const used = new Set<number>([input.top, ...input.hands.flat(), ...(input.deck ?? [])])
  const spare = Array.from({ length: DECK_SIZE }, (_, id) => id).filter(id => !used.has(id))
  const players = input.hands.map((hand, index) => ({ ...blankSeat(index !== 0), hand: [...hand], saidSeis: input.said?.[index] ?? false, shield: input.shields?.[index] ?? false }))
  const state = shell(input.level ?? 'normal', players, input.rng ?? 1, input.deck ?? spare, [input.top, ...(input.deck ? spare : [])], input.color ?? cardOf(input.top).color ?? 'lima')
  state.current = input.current ?? 0
  state.direction = input.direction ?? 1
  state.lock = input.lock ?? null
  state.phase = input.phase ?? 'play'
  state.covers = input.covers ?? []
  state.step = input.step ?? 0
  return state
}
export function apply(state: SeisState, action: string): Step {
  const next = structuredClone(state)
  const error = dispatch(next, action)
  return error ? { ok: false, error } : { ok: true, state: next }
}
export function stepAi(state: SeisState) {
  if (state.phase === 'over' || needsHuman(state)) return state
  const draft = structuredClone(state)
  const action = aiAction(draft)
  const next = apply({ ...state, rng: draft.rng }, action)
  return next.ok ? next.state : state
}
export function playUntilHuman(state: SeisState) {
  let current = state
  for (let guard = 0; guard < 800 && current.phase !== 'over' && !needsHuman(current); guard += 1) {
    const next = stepAi(current)
    if (next === current) break
    current = next
  }
  return current
}
export function replay(seed: number, opponents: number, level: Level, actions: string): Step {
  if (!Number.isInteger(seed) || seed < 1 || seed > 2147483646 || opponents < 1 || opponents > 3 || !LEVELS.includes(level)) return { ok: false, error: 'setup' }
  if (actions.length > 8000 || (actions !== '' && !/^([a-z0-9-]+)(,[a-z0-9-]+)*$/.test(actions))) return { ok: false, error: 'actions' }
  let state = createMatch(seed, opponents, level)
  if (actions) for (const action of actions.split(',')) {
    if (!needsHuman(state)) return { ok: false, error: 'turn' }
    const next = apply(state, action)
    if (!next.ok) return next
    state = playUntilHuman(next.state)
  }
  return { ok: true, state }
}
export function fingerprint(state: SeisState) {
  return [
    state.phase,
    state.current,
    COLORS.indexOf(state.color),
    state.lock ?? '-',
    state.direction,
    state.discard.join('.'),
    state.players.map(seat => seat.hand.join('.')).join('/'),
    state.deck.join('.'),
    state.winner ?? '-',
    state.capped ? 1 : 0,
    state.step,
    state.rng,
    state.players.map(seat => [seat.shield ? 1 : 0, seat.skip ? 1 : 0, seat.pendingDraw, seat.resaca ? 1 : 0, seat.blind ? 1 : 0, seat.saidSeis ? 1 : 0, seat.missed].join('.')).join('/'),
    state.covers.map(cover => `${cover.a}.${cover.b}.${cover.until}`).join('/'),
    state.wish.join('.'),
    state.strobe.map(item => `${item.player}.${item.card}`).join('/'),
    state.give ?? '-',
    state.perfect ? 1 : 0,
  ].join('|')
}
export function humanWon(state: SeisState) {
  return state.phase === 'over' && state.winner === 0 && state.players[0].hand.length === 0 && !state.capped
}
