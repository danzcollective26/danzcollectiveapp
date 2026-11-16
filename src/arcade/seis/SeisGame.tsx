import { useState } from 'react'
import { createDeck, canPlay, type Card, type Player, type GameState } from './engine'

const AI_NAMES = ['Yeppo Bot', 'Jack', 'Vinilo', 'Luz']

export default function SeisGame() {
  const [state, setState] = useState<GameState | null>(null)
  const [yeppoText, setYeppoText] = useState<string | null>(null)

  const startGame = (aiCount = 2) => {
    let deck = createDeck()
    const players: Player[] = [
      { id: 'player', name: 'Tú', hand: [], isAI: false, saidSeis: false, blind: false, protected: 0 }
    ]
    for (let i = 0; i < aiCount; i++) {
      players.push({
        id: `ai-${i}`,
        name: AI_NAMES[i % AI_NAMES.length],
        hand: [],
        isAI: true,
        saidSeis: false,
        blind: false,
        protected: 0
      })
    }

    players.forEach(p => {
      p.hand = deck.splice(0, 7)
    })

    const first = deck.pop()!
    const initial: GameState = {
      deck,
      discard: [first],
      players,
      currentPlayer: 0,
      direction: 1,
      currentColor: first.color || null,
      currentSymbol: first.symbol || null,
      message: '¡Empieza la partida!',
      yeppoMessage: 'A ver quién se queda sin cartas antes, figuras.',
      winner: null,
      turn: 1
    }
    setState(initial)
    setYeppoText(initial.yeppoMessage)
  }

  const playCard = (cardId: string) => {
    if (!state || state.winner) return
    const playerIdx = state.currentPlayer
    const player = state.players[playerIdx]
    if (player.isAI) return

    const cardIndex = player.hand.findIndex(c => c.id === cardId)
    if (cardIndex === -1) return
    const card = player.hand[cardIndex]
    const top = state.discard[state.discard.length - 1]

    if (!canPlay(card, top, state.currentColor, state.currentSymbol)) {
      setYeppoText('Esa no vale, figura. Prueba con otra.')
      return
    }

    const newHand = player.hand.filter((_, i) => i !== cardIndex)
    const newDiscard = [...state.discard, card]

    const newPlayers = state.players.map((p, i) =>
      i === playerIdx ? { ...p, hand: newHand, saidSeis: newHand.length === 1 } : p
    )

    const newState: GameState = {
      ...state,
      discard: newDiscard,
      players: newPlayers,
      currentColor: card.color ?? state.currentColor,
      currentSymbol: card.symbol ?? state.currentSymbol,
      message: `Has jugado ${card.type}`
    }

    if (newHand.length === 0) {
      newState.winner = player.name
      newState.yeppoMessage = '¡SEIS! Te has quedado sin cartas. No está mal, figura.'
      setYeppoText(newState.yeppoMessage)
    } else if (newHand.length === 1) {
      setYeppoText('¡SEIS! Di SEIS o robas dos, figura.')
    }

    setState(newState)
    if (!newState.winner) {
      setTimeout(() => advanceTurn(newState), 700)
    }
  }

  const advanceTurn = (gs: GameState) => {
    const next = (gs.currentPlayer + gs.direction + gs.players.length) % gs.players.length
    setState(prev => prev ? { ...prev, currentPlayer: next, turn: prev.turn + 1 } : null)
  }

  const drawCard = () => {
    if (!state || state.deck.length === 0) return
    const playerIdx = state.currentPlayer
    if (state.players[playerIdx].isAI) return
    const card = state.deck[state.deck.length - 1]
    const newDeck = state.deck.slice(0, -1)
    const newPlayers = state.players.map((p, i) =>
      i === playerIdx ? { ...p, hand: [...p.hand, card] } : p
    )
    setState({ ...state, deck: newDeck, players: newPlayers })
    setYeppoText('Has robado. A ver si te sirve.')
  }

  if (!state) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#f3f0e8' }}>
        <h1>SEIS <small style={{ fontSize: '0.5em', opacity: 0.7 }}>(de la mañana, qué jaleo)</small></h1>
        <p>Juego de cartas del colectivo DANZ</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button onClick={() => startGame(1)} style={btnStyle}>1 IA</button>
          <button onClick={() => startGame(2)} style={btnStyle}>2 IA</button>
          <button onClick={() => startGame(3)} style={btnStyle}>3 IA</button>
        </div>
      </div>
    )
  }

  const me = state.players[0]
  const top = state.discard[state.discard.length - 1]
  const isMyTurn = state.currentPlayer === 0 && !state.winner

  return (
    <div style={{ padding: 20, maxWidth: 960, margin: '0 auto', color: '#f3f0e8' }}>
      <h2>SEIS <small style={{ fontSize: 14, opacity: 0.6 }}>(de la mañana, qué jaleo)</small></h2>
      {yeppoText && (
        <div style={{ background: '#101011', color: '#d9ff6b', padding: '12px 16px', borderRadius: 10, margin: '12px 0', border: '1px solid #38383c' }}>
          🌸 {yeppoText}
        </div>
      )}
      <div style={{ opacity: 0.8, marginBottom: 12 }}>
        Turno de <strong>{state.players[state.currentPlayer].name}</strong> · Mazo: {state.deck.length} · Dirección: {state.direction === 1 ? '→' : '←'}
      </div>
      <div style={{ background: '#1a1a1c', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 13, opacity: 0.6 }}>DESCARTE</div>
        <div style={{ fontSize: 18, marginTop: 4 }}>{formatCard(top)}</div>
      </div>
      <div>
        <h3>Tu mano ({me.hand.length}) {me.hand.length === 1 && <span style={{ color: '#ff789f' }}>— ¡DI SEIS!</span>}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {me.hand.map(card => (
            <button
              key={card.id}
              disabled={!isMyTurn}
              onClick={() => playCard(card.id)}
              style={{
                padding: '10px 14px',
                background: isMyTurn ? '#2a2a2e' : '#1a1a1c',
                color: '#f3f0e8',
                border: '1px solid #38383c',
                borderRadius: 8,
                cursor: isMyTurn ? 'pointer' : 'default',
                fontSize: 14
              }}
            >
              {formatCard(card)}
            </button>
          ))}
        </div>
        {isMyTurn && (
          <button onClick={drawCard} style={{ ...btnStyle, marginTop: 16 }}>Robar carta</button>
        )}
      </div>
      <div style={{ marginTop: 24, opacity: 0.7 }}>
        {state.players.map(p => (
          <div key={p.id}>{p.name}: {p.hand.length} cartas {p.protected > 0 && '🛡️'}</div>
        ))}
      </div>
      {state.winner && (
        <div style={{ marginTop: 24, padding: 20, background: '#d9ff6b', color: '#101011', borderRadius: 12, textAlign: 'center' }}>
          <h2 style={{ margin: 0 }}>Ganador: {state.winner}</h2>
          <button onClick={() => setState(null)} style={{ ...btnStyle, marginTop: 12, background: '#101011', color: '#d9ff6b' }}>Nueva partida</button>
        </div>
      )}
    </div>
  )
}

function formatCard(card: Card): string {
  if (card.type === 'normal') {
    return card.value !== undefined ? `${card.value} ${card.color}` : `${card.symbol} ${card.color}`
  }
  return card.type.replace(/_/g, ' ')
}

const btnStyle: React.CSSProperties = {
  padding: '10px 18px',
  background: '#d9ff6b',
  color: '#101011',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer'
}
