export type Color = 'negro' | 'lima' | 'rosa' | 'violeta' | 'agua'
export type Symbol = 'flor' | 'vinilo' | 'jack' | 'luz' | 'number'

export type CardType =
  | 'normal'
  | 'yeppo'
  | 'panas'
  | 'panas_fuerte'
  | 'jack_cruzado'
  | 'drop'
  | 'resaca'
  | 'wishlist'
  | 'cambio_tema'
  | 'flor_negra'
  | 'flor_blanca'
  | 'vinilo_rallado'
  | 'luz_estroboscopica'
  | 'doble_jack'
  | 'jack_gordo'

export interface Card {
  id: string
  type: CardType
  color?: Color
  symbol?: Symbol
  value?: number
}

export interface Player {
  id: string
  name: string
  hand: Card[]
  isAI: boolean
  saidSeis: boolean
  blind: boolean
  protected: number
}

export interface GameState {
  deck: Card[]
  discard: Card[]
  players: Player[]
  currentPlayer: number
  direction: 1 | -1
  currentColor: Color | null
  currentSymbol: Symbol | null
  message: string
  yeppoMessage: string | null
  winner: string | null
  turn: number
  pendingDraw: number
  skipNext: boolean
}

export function createDeck(): Card[] {
  const deck: Card[] = []
  const colors: Color[] = ['negro', 'lima', 'rosa', 'violeta', 'agua']
  const symbols: Symbol[] = ['flor', 'vinilo', 'jack', 'luz']

  colors.forEach(color => {
    for (let v = 0; v <= 9; v++) {
      deck.push({ id: `${color}-${v}-1`, type: 'normal', color, value: v, symbol: 'number' })
      if (v !== 0) deck.push({ id: `${color}-${v}-2`, type: 'normal', color, value: v, symbol: 'number' })
    }
    symbols.forEach(sym => {
      deck.push({ id: `${color}-${sym}-1`, type: 'normal', color, symbol: sym })
      deck.push({ id: `${color}-${sym}-2`, type: 'normal', color, symbol: sym })
    })
  })

  const specials: CardType[] = [
    'yeppo', 'panas', 'panas_fuerte', 'jack_cruzado', 'drop', 'resaca',
    'wishlist', 'cambio_tema', 'flor_negra', 'flor_blanca',
    'vinilo_rallado', 'luz_estroboscopica', 'doble_jack', 'jack_gordo'
  ]
  specials.forEach((type, i) => {
    const count = (type === 'flor_negra' || type === 'jack_gordo') ? 4 : 6
    for (let n = 0; n < count; n++) {
      deck.push({ id: `${type}-${i}-${n}`, type })
    }
  })

  return shuffle(deck)
}

export function shuffle<T>(array: T[]): T[] {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function canPlay(card: Card, top: Card | undefined, currentColor: Color | null, currentSymbol: Symbol | null): boolean {
  if (!top) return true
  if (card.type === 'flor_negra' || card.type === 'jack_gordo' || card.type === 'flor_blanca') return true
  if (card.color && (card.color === currentColor || card.color === top.color)) return true
  if (card.symbol && card.symbol !== 'number' && (card.symbol === currentSymbol || card.symbol === top.symbol)) return true
  if (card.value !== undefined && top.value !== undefined && card.value === top.value) return true
  return false
}

export function drawCards(state: GameState, playerIndex: number, count: number): GameState {
  const newState = {
    ...state,
    deck: [...state.deck],
    players: state.players.map(p => ({ ...p, hand: [...p.hand] }))
  }
  const player = newState.players[playerIndex]
  for (let i = 0; i < count && newState.deck.length > 0; i++) {
    player.hand.push(newState.deck.pop()!)
  }
  return newState
}

export function nextPlayerIndex(state: GameState): number {
  return (state.currentPlayer + state.direction + state.players.length) % state.players.length
}
