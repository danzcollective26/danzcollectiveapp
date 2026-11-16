import assert from 'node:assert/strict'
import { test } from 'node:test'
import { aiAction, apply, canPlay, cardOf, createMatch, fingerprint, humanWon, legalPlays, needsHuman, pile, playUntilHuman, replay, scenario, stepAi, COLORS, DECK_SIZE, HAND_SIZE, SPECIALS, type SeisState } from '../src/arcade/seis/engine.ts'

function intact(state: SeisState) {
  assert.deepEqual(pile(state).slice().sort((a, b) => a - b), Array.from({ length: DECK_SIZE }, (_, id) => id))
}
function play(state: SeisState, action: string) {
  const next = apply(state, action)
  assert.equal(next.ok, true, next.ok ? '' : `${action} ${next.error} en ${state.phase}`)
  if (!next.ok) throw new Error(next.error)
  return next.state
}
function humanAction(state: SeisState) {
  if (state.phase === 'play') {
    const legal = legalPlays(state)
    return legal[0] !== undefined ? `p${legal[0]}` : 'd'
  }
  if (state.phase === 'seis') return 's'
  if (state.phase === 'color') return 'c0'
  if (state.phase === 'demand') return 'y-'
  if (state.phase === 'panas-who') return 'a1'
  if (state.phase === 'panas-how') return 'm0'
  if (state.phase === 'wishlist') return 'w0'
  if (state.phase === 'order') return 'o0'
  if (state.phase === 'resaca') return 'r0'
  if (state.phase === 'discard') return `q${state.players[state.current].hand[0]}`
  if (state.phase === 'strobe') return 'l0'
  if (state.phase === 'give') return 'g-'
  if (state.phase === 'yeppo') return 'e0'
  if (state.phase === 'boon') return 'b1'
  return 'd'
}

test('the deck has 90 unique cards: five colours, numbers, symbols and the closed specials', () => {
  const cards = Array.from({ length: DECK_SIZE }, (_, id) => cardOf(id))
  assert.equal(new Set(cards.map(card => card.id)).size, 90)
  for (const color of COLORS) {
    assert.equal(cards.filter(card => card.color === color && card.symbol !== null && card.symbol >= '0' && card.symbol <= '9').length, 10)
    assert.equal(cards.filter(card => card.color === color && ['flor', 'vinilo', 'jack', 'luz'].includes(card.symbol ?? '')).length, 4)
  }
  for (const special of ['yeppo', 'panas', 'jack-cruzado', 'drop', 'cambio', 'doble-jack']) assert.equal(cards.filter(card => card.special === special).length, 2)
  for (const special of ['panas-fuerte', 'resaca', 'wishlist', 'flor-negra', 'flor-blanca', 'vinilo-rallado', 'luz-estrobo', 'jack-gordo']) assert.equal(cards.filter(card => card.special === special).length, 1)
  assert.equal(SPECIALS.length, 20)
  assert.equal(cards.filter(card => card.special === null).length, 70)
})

test('a match deals seven cards, opens on a normal card and repeats from the seed', () => {
  const first = createMatch(426, 2, 'normal')
  assert.equal(fingerprint(first), fingerprint(createMatch(426, 2, 'normal')))
  assert.equal(first.players.length, 3)
  for (const seat of first.players) assert.equal(seat.hand.length, HAND_SIZE)
  assert.equal(cardOf(first.discard[0]).special, null)
  assert.equal(first.color, cardOf(first.discard[0]).color)
  assert.equal(first.log.length, 1)
  intact(first)
  assert.throws(() => createMatch(0, 1, 'facil'))
})

test('a card matches by colour or symbol; specials are free and Jack gordo stays limited', () => {
  const blocked = scenario({ hands: [[17, 89, 83], [1]], top: 0 })
  assert.equal(canPlay(blocked, 17), false)
  assert.equal(canPlay(blocked, 83), true)
  assert.equal(canPlay(blocked, 89), false)
  const before = fingerprint(blocked)
  assert.equal(apply(blocked, 'p17').ok, false)
  assert.equal(fingerprint(blocked), before)
  assert.equal(canPlay(scenario({ hands: [[17, 89], [1]], top: 0 }), 89), true)
  assert.equal(canPlay(scenario({ hands: [[89, 10], [1]], top: 52 }), 89), true)
  assert.equal(canPlay(scenario({ hands: [[27], [1]], top: 7, color: 'agua' }), 27), true)
})

test('drawing plays a usable card and passes when it does not fit', () => {
  const played = play(scenario({ hands: [[11], [1]], top: 0, deck: [10] }), 'd')
  assert.equal(played.discard[0], 10)
  assert.equal(played.players[0].hand.includes(10), false)
  const passed = play(scenario({ hands: [[11], [1]], top: 0, deck: [12] }), 'd')
  assert.equal(passed.players[0].hand.includes(12), true)
  assert.notEqual(passed.current, 0)
  intact(played)
  intact(passed)
})

test('SEIS is strict: silence draws two and a called win is perfect', () => {
  const punished = play(scenario({ hands: [[4], [1, 2, 3]], top: 0, phase: 'seis' }), 'n')
  assert.equal(punished.players[0].hand.length, 3)
  assert.equal(punished.players[0].saidSeis, false)
  assert.match(punished.log.at(-1) ?? '', /SEIS/)
  const called = play(scenario({ hands: [[5, 15], [1, 2, 3]], top: 25, color: 'rosa' }), 'p15')
  assert.equal(called.phase, 'seis')
  const said = play(called, 's')
  const won = play({ ...said, current: 0, phase: 'play' }, 'p5')
  assert.equal(humanWon(won), true)
  assert.equal(won.perfect, true)
  intact(won)
})

test('specials resolve their closed effects and the pile stays complete', () => {
  const cruzado = play(scenario({ hands: [[75, 10, 11], [1, 2], [3, 4]], top: 0 }), 'p75')
  assert.equal(cruzado.direction, -1)
  assert.equal(cruzado.lock, 'jack')
  assert.equal(cruzado.current, 2)
  const drop = play(scenario({ hands: [[77, 10, 11], [1], [2]], top: 0 }), 'p77')
  assert.equal(drop.players[1].hand.length, 2)
  assert.equal(drop.players[2].hand.length, 2)
  assert.equal(drop.current, 2)
  const shielded = play(scenario({ hands: [[87, 10], [1, 2]], top: 0, shields: [false, true] }), 'p87')
  assert.equal(shielded.players[1].pendingDraw, 0)
  assert.equal(shielded.players[1].hand.length, 2)
  assert.equal(shielded.players[1].shield, false)
  const covered = play(scenario({ hands: [[87, 10], [1, 2]], top: 0, covers: [{ a: 0, b: 1, until: 5 }] }), 'p87')
  assert.equal(covered.players[1].pendingDraw, 0)
  assert.equal(covered.players[1].hand.length, 2)
  const gordo = play(scenario({ hands: [[89], [1]], top: 52 }), 'p89')
  assert.equal(gordo.players[1].pendingDraw, 4)
  assert.equal(gordo.players[1].skip, true)
  assert.equal(humanWon(gordo), true)
  const peek = play(scenario({ hands: [[80, 4], [1]], top: 0, deck: [14, 15, 16] }), 'p80')
  assert.deepEqual(peek.wish, [16, 15, 14])
  const ordered = play(play(peek, 'w0'), 'o0')
  assert.equal(ordered.players[0].hand.includes(16), true)
  assert.equal(ordered.deck.at(-1), 15)
  const white = play(play(scenario({ hands: [[84, 11, 12], [20, 21, 22]], top: 0 }), 'p84'), 'c2')
  assert.equal(white.color, 'rosa')
  assert.match(white.log.at(-1) ?? '', /ROSA/)
  const blind = play(scenario({ hands: [[85, 4], [1, 2]], top: 0 }), 'p85')
  assert.equal(blind.players[1].blind, true)
  const swapped = play(play(play(scenario({ hands: [[72, 4], [5, 6]], top: 0, rng: 8 }), 'p72'), 'a1'), 'm1')
  assert.equal(swapped.players[0].hand.includes(4), false)
  assert.equal(swapped.players[1].hand.includes(4), true)
  assert.equal(swapped.players[0].hand.length, 1)
  assert.equal(swapped.players[1].hand.length, 2)
  const strong = play(play(scenario({ hands: [[74], [5]], top: 0 }), 'p74'), 'a1')
  assert.equal(strong.covers[0]?.until, strong.players.length * 2)
  const victim = play(scenario({ hands: [[79, 6, 7], [8, 9, 10]], top: 0, deck: [30, 31] }), 'p79')
  assert.equal(victim.phase, 'resaca')
  const chosen = play(victim, 'r1')
  assert.equal(chosen.phase, 'discard')
  assert.equal(chosen.players[1].hand.length, 5)
  const strobe = play(scenario({ hands: [[86, 4], [12, 13], [22]], top: 0, rng: 3 }), 'p86')
  assert.equal(strobe.strobe.length, 3)
  const given = play(play(strobe, 'l1'), 'g0')
  assert.equal(given.players[0].hand.includes(strobe.strobe[1].card), true)
  const theme = play(play(play(scenario({ hands: [[81, 4], [2]], top: 0 }), 'p81'), 'c4'), 'yj')
  assert.equal(theme.color, 'agua')
  assert.equal(theme.lock, 'jack')
  const yeppo = play(play(scenario({ hands: [[70, 4], [2]], top: 0 }), 'p70'), 'e0')
  assert.equal(yeppo.players[0].shield, true)
  for (const state of [cruzado, drop, gordo, ordered, white, blind, swapped, strong, chosen, given, theme, yeppo]) intact(state)
})

test('hard AI saves Jack gordo and easy AI only chooses a legal card', () => {
  const hard = scenario({ level: 'dificil', hands: [[0, 1, 2, 89], [3, 4, 5, 6, 7]], top: 52, color: 'negro' })
  const normal = scenario({ level: 'normal', hands: [[0, 1, 2, 89], [3, 4, 5, 6, 7]], top: 52, color: 'negro' })
  assert.equal(aiAction(structuredClone(hard)), 'p2')
  assert.equal(aiAction(structuredClone(normal)), 'p89')
  const easy = scenario({ level: 'facil', hands: [[83, 18], [1, 2, 3, 4]], top: 52, color: 'negro', current: 1 })
  const choice = aiAction(structuredClone(easy))
  const card = Number(choice.slice(1))
  assert.equal(choice === 'd' || legalPlays(easy).includes(card), true)
  const moved = stepAi(easy)
  assert.notEqual(moved.current, 1)
  intact(moved)
})

test('simulated tables end with a complete pile and replay repeats the human game', () => {
  for (const level of ['facil', 'normal', 'dificil'] as const) {
    const actions: string[] = []
    let state = createMatch(7, 1, level)
    let guard = 0
    while (state.phase !== 'over' && guard++ < 600) {
      if (!needsHuman(state)) { state = stepAi(state); continue }
      const action = humanAction(state)
      actions.push(action)
      state = playUntilHuman(play(state, action))
      intact(state)
    }
    assert.equal(state.phase, 'over', level)
    const again = replay(7, 1, level, actions.join(','))
    assert.equal(again.ok, true)
    if (again.ok) assert.equal(fingerprint(again.state), fingerprint(state))
  }
  assert.equal(replay(7, 1, 'normal', 'p999').ok, false)
})
