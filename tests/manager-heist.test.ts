import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ALLY_MS, BLUFF_ALLY_MS, EARLY_OPEN, EXTRACT_MS, HEIST_IDLE, HEIST_MAPS, HEIST_MS, HANGOVER_AT, LATE_OPEN, LOCKDOWN_GRACE,
  RECORD_KEY, TAXI_MOVE, createHeist, extractionOpen, heistClock, heistStage, heistTileBlocked, pauseHeist, readHeistRecord,
  saveHeistRecord, scoreHeist, startHeist, stepHeist, type HeistInput, type HeistState,
} from '../src/arcade/heist/engine.ts'

function play(state: HeistState, ms: number, input: Partial<HeistInput> = {}) {
  const full = { ...HEIST_IDLE, ...input }
  let current = state.phase === 'ready' ? startHeist(state) : state
  let left = ms
  while (left > 0 && current.phase === 'playing') {
    const dt = Math.min(50, left)
    current = stepHeist(current, full, dt)
    left -= dt
  }
  return current
}

function once(state: HeistState, input: Partial<HeistInput>) {
  const current = state.phase === 'ready' ? startHeist(state) : state
  return stepHeist(current, { ...HEIST_IDLE, ...input }, 50)
}

function route(state: HeistState, x: number, y: number, avoid: ReadonlySet<number> = new Set()) {
  const sx = Math.floor(state.player.x), sy = Math.floor(state.player.y)
  const gx = Math.floor(x), gy = Math.floor(y)
  const cols = state.cols
  const key = (tx: number, ty: number) => ty * cols + tx
  if (sx === gx && sy === gy) return { x, y }
  const queue = [[sx, sy]]
  const prev = new Map<number, number>([[key(sx, sy), -1]])
  for (let index = 0; index < queue.length; index++) {
    const [cx, cy] = queue[index]
    if (cx === gx && cy === gy) break
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = cx + dx, ny = cy + dy, id = key(nx, ny)
      if (prev.has(id) || avoid.has(id) || heistTileBlocked(state, nx, ny)) continue
      prev.set(id, key(cx, cy))
      queue.push([nx, ny])
    }
  }
  const goal = key(gx, gy)
  if (!prev.has(goal)) return null
  let cursor = goal
  let parent = prev.get(cursor) ?? -1
  while (parent !== key(sx, sy) && parent !== -1) {
    cursor = parent
    parent = prev.get(cursor) ?? -1
  }
  return { x: cursor % cols + 0.5, y: Math.floor(cursor / cols) + 0.5 }
}

function cellKey(state: HeistState, x: number, y: number) {
  return Math.floor(y) * state.cols + Math.floor(x)
}

function walk(state: HeistState, x: number, y: number, limit = 30_000, stop = 0.28, avoid: ReadonlySet<number> = new Set()) {
  let current = state.phase === 'ready' ? startHeist(state) : state
  let elapsed = 0
  let stuck = 0
  while (elapsed < limit && current.phase === 'playing' && Math.hypot(current.player.x - x, current.player.y - y) > stop) {
    const step = route(current, x, y, avoid)
    if (!step) break
    const dx = step.x - current.player.x, dy = step.y - current.player.y
    const length = Math.hypot(dx, dy) || 1
    const next = stepHeist(current, { ...HEIST_IDLE, moveX: dx / length, moveY: dy / length }, 50)
    if (Math.hypot(next.player.x - current.player.x, next.player.y - current.player.y) < 0.001) {
      if (++stuck > 8) break
    } else stuck = 0
    current = next
    elapsed += 50
  }
  return current
}

function reachable(state: HeistState, x: number, y: number) {
  const start = { x: Math.floor(state.player.x), y: Math.floor(state.player.y) }
  const seen = new Set<number>([start.y * state.cols + start.x])
  const queue = [start]
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i]
    if (cell.x === Math.floor(x) && cell.y === Math.floor(y)) return true
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cell.x + dx, ny = cell.y + dy, id = ny * state.cols + nx
      if (seen.has(id) || heistTileBlocked(state, nx, ny)) continue
      seen.add(id)
      queue.push({ x: nx, y: ny })
    }
  }
  return false
}

test('both afters place three loot pieces, two exits and their factions', () => {
  for (const id of ['studio', 'terrace'] as const) {
    const state = createHeist(id, 3)
    const layout = HEIST_MAPS[id]
    assert.equal(state.loot.length, 3)
    assert.equal(state.extractions.length, 2)
    assert.equal(state.lives, 3)
    assert.equal(state.fakes, 1)
    assert.ok(layout.hangovers.length >= 2)
    assert.ok(layout.factions.length >= 2)
    for (const faction of layout.factions) assert.ok(state.agents.some(agent => agent.kind === faction))
    for (const item of state.loot) assert.equal(reachable(state, item.x, item.y), true, item.kind)
    assert.equal(reachable(state, state.extractions[0].x, state.extractions[0].y), true)
    assert.equal(reachable(state, state.extractions[1].x, state.extractions[1].y), true)
  }
  assert.deepEqual(HEIST_MAPS.studio.factions, ['tech', 'crew'])
  assert.deepEqual(HEIST_MAPS.terrace.factions, ['manager', 'bouncer'])
  assert.equal(HEIST_MAPS.studio.lateKey, 'contract')
  assert.equal(HEIST_MAPS.terrace.lateKey, 'vip')
})

test('walls stop the player and paused time does not move', () => {
  let state = play(createHeist('studio', 1, { calm: true }), 2_000, { moveX: -1 })
  assert.ok(state.player.x > 1.15)
  const paused = pauseHeist(state)
  assert.equal(paused.phase, 'paused')
  assert.equal(stepHeist(paused, { ...HEIST_IDLE, moveX: 1 }, 500), paused)
  assert.equal(heistStage(0), 1)
  assert.equal(heistStage(90_000), 2)
  assert.equal(heistStage(HANGOVER_AT), 3)
  assert.equal(heistStage(HEIST_MS), 4)
  assert.equal(heistClock(0), '6:00')
})

test('loot is picked up and extraction scores loot, time left and alliances', () => {
  let state = createHeist('studio', 2, { calm: true })
  const vinyl = state.loot.find(item => item.kind === 'vinyl')!
  const avoid = new Set(state.loot.filter(item => item.kind !== 'vinyl').map(item => cellKey(state, item.x, item.y)))
  state = walk(state, vinyl.x, vinyl.y, 30_000, 0.28, avoid)
  assert.equal(state.inventory.length, 1)
  assert.equal(state.inventory[0].kind, 'vinyl')
  const exit = state.extractions[0]
  state = play(state, EARLY_OPEN)
  assert.equal(extractionOpen(state, state.extractions[0]), true)
  state = walk(state, exit.x, exit.y, 30_000, 0.28, avoid)
  assert.ok(Math.hypot(state.player.x - state.extractions[0].x, state.player.y - state.extractions[0].y) < 0.62)
  const before = state.elapsed
  state = play(state, EXTRACT_MS + 80, { holdExtract: true })
  assert.equal(state.phase, 'extracted')
  assert.ok(state.score)
  assert.equal(state.score.loot, 480)
  assert.ok(state.score.timeLeft > 0.5)
  assert.equal(state.score.total, Math.round(state.score.loot * state.score.timeFactor * state.score.allianceFactor))
  assert.ok(state.score.total > state.score.loot)
  const early = scoreHeist({ ...state, elapsed: before, inventory: state.inventory, agents: state.agents })
  const late = scoreHeist({ ...state, elapsed: 300_000, inventory: state.inventory, agents: state.agents })
  assert.ok(early.timeLeft > late.timeLeft)
  assert.ok(early.timeFactor > late.timeFactor)
  const greedy = scoreHeist({ ...state, elapsed: before, betrayals: 1, inventory: state.inventory, agents: state.agents })
  assert.ok(greedy.allianceFactor > early.allianceFactor)
  assert.ok(greedy.total > early.total)
})

test('leaving with empty pockets is allowed and banks nothing', () => {
  const fresh = createHeist('studio', 4, { calm: true })
  const avoid = new Set(fresh.loot.map(item => cellKey(fresh, item.x, item.y)))
  let state = play(fresh, EARLY_OPEN)
  state = walk(state, state.extractions[0].x, state.extractions[0].y, 30_000, 0.28, avoid)
  state = play(state, EXTRACT_MS + 80, { holdExtract: true })
  assert.equal(state.phase, 'extracted')
  assert.equal(state.score?.loot, 0)
  assert.equal(state.score?.total, 0)
})

test('a hit spends aguante, interrupts the channel and party over ends the run', () => {
  let state = createHeist('studio', 5, { calm: true })
  const tech = state.agents.find(agent => agent.kind === 'tech')!
  state = walk(startHeist(state), tech.x, tech.y)
  state = play(state, 400)
  assert.ok(state.lives < 3)
  assert.match(state.message, /AGUANTE|PARTY OVER/)
  state = createHeist('studio', 5, { calm: true })
  state = play(startHeist(state), EARLY_OPEN)
  state = walk(state, state.extractions[0].x, state.extractions[0].y)
  const channel = play(state, 400, { holdExtract: true })
  assert.equal(channel.phase, 'playing')
  assert.ok(channel.channel > 0)
  const released = stepHeist(channel, HEIST_IDLE, 50)
  assert.equal(released.channel, 0)
  let bruised = channel
  bruised.lives = 1
  bruised.invulnUntil = 0
  bruised.player = { ...tech }
  const over = stepHeist(startHeist({ ...bruised, phase: 'playing' }), HEIST_IDLE, 50)
  assert.equal(over.phase, 'over')
  assert.equal(over.lives, 0)
  assert.match(over.message, /PARTY OVER/)
  assert.equal(over.score, null)
})

test('an alliance blocks damage and a betrayal is worth more and only counts once', () => {
  let state = createHeist('studio', 6, { calm: true })
  const crew = state.agents.find(agent => agent.kind === 'crew')!
  const avoid = new Set(state.agents.filter(agent => agent.id !== crew.id).map(agent => cellKey(state, agent.x, agent.y)))
  state = walk(startHeist(state), crew.x, crew.y, 30_000, 1.2, avoid)
  assert.ok(Math.hypot(state.player.x - crew.x, state.player.y - crew.y) <= 1.3)
  state = once(state, { ally: true })
  assert.ok(state.agents.filter(agent => agent.kind === 'crew').every(agent => agent.allyUntil > state.elapsed))
  const allied = play(walk(state, crew.x, crew.y, 30_000, 0.15, avoid), 1_000)
  assert.equal(allied.lives, 3)
  const betrayed = once(allied, { betray: true })
  assert.equal(betrayed.betrayals, 1)
  assert.equal(betrayed.marked, true)
  assert.ok(betrayed.agents.some(agent => agent.kind === 'crew' && agent.enraged))
  const again = once(betrayed, { betray: true })
  assert.equal(again.betrayals, 1)
  assert.match(again.message, /NO HAY PACTO|ESPALDA/)
  const fresh = createHeist('studio', 6, { calm: true })
  const tech = fresh.agents.find(agent => agent.kind === 'tech')!
  let pact = walk(startHeist(fresh), tech.x, tech.y, 30_000, 1.2, new Set(fresh.agents.filter(agent => agent.id !== tech.id).map(agent => cellKey(fresh, agent.x, agent.y))))
  pact = once(pact, { ally: true })
  pact = walk(pact, 1.5, 1.5)
  pact = play(pact, ALLY_MS + 100)
  assert.equal(pact.pactsKept, 1)
  assert.equal(pact.pact.tech, 'kept')
})

test('bluff is different for technicians, crews and bouncers, and the fake is spent once', () => {
  const studio = startHeist(createHeist('studio', 7, { calm: true }))
  const tech = walk(studio, studio.agents.find(agent => agent.kind === 'tech')!.x, studio.agents.find(agent => agent.kind === 'tech')!.y)
  const stunned = once(tech, { bluff: true })
  assert.equal(stunned.fakes, 0)
  assert.ok(stunned.agents.some(agent => agent.kind === 'tech' && agent.stunUntil >= stunned.elapsed + 4_000))
  assert.ok(stunned.feedbackSafeUntil > stunned.elapsed)
  const dry = once(stunned, { bluff: true })
  assert.match(dry.message, /NADA QUE ENSEÑAR/)
  const crewHome = studio.agents.find(agent => agent.kind === 'crew')!
  const crewRun = walk(startHeist(createHeist('studio', 7, { calm: true })), crewHome.x, crewHome.y, 30_000, 1.2)
  const fooled = once(crewRun, { bluff: true })
  assert.ok(fooled.agents.filter(agent => agent.kind === 'crew').every(agent => agent.turncoat && agent.allyUntil > fooled.elapsed))
  const clear = walk(fooled, 1.5, 1.5)
  const turned = play(clear, BLUFF_ALLY_MS + 80)
  assert.ok(turned.agents.some(agent => agent.kind === 'crew' && agent.enraged))
  assert.equal(turned.betrayals, 0)
  assert.match(turned.message, /SAMPLE/)
  const terrace = startHeist(createHeist('terrace', 8, { calm: true }))
  const bouncer = walk(terrace, terrace.agents.find(agent => agent.kind === 'bouncer')!.x, terrace.agents.find(agent => agent.kind === 'bouncer')!.y)
  const shrug = once(bouncer, { bluff: true })
  assert.ok(shrug.agents.some(agent => agent.kind === 'bouncer' && agent.slowUntil - shrug.elapsed <= 1_000))
  assert.match(shrug.message, /NI PESTAÑEA/)
  const manager = walk(startHeist(createHeist('terrace', 8, { calm: true })), terrace.agents.find(agent => agent.kind === 'manager')!.x, terrace.agents.find(agent => agent.kind === 'manager')!.y)
  const deal = once(manager, { bluff: true })
  assert.ok(deal.forcedDoors.length === 1)
  assert.match(deal.message, /TRATO FALSO/)
})

test('a contract opens the van early and the terrace taxi changes corner', () => {
  let state = createHeist('studio', 9, { calm: true })
  assert.equal(extractionOpen(startHeist(state), state.extractions[1]), false)
  const contract = state.loot.find(item => item.kind === 'contract')!
  state = walk(startHeist(state), contract.x, contract.y)
  assert.equal(state.inventory.some(item => item.kind === 'contract'), true)
  assert.equal(extractionOpen(state, state.extractions[1]), true)
  assert.ok(state.elapsed < LATE_OPEN)
  let terrace = play(createHeist('terrace', 9, { calm: true }), TAXI_MOVE)
  const taxi = terrace.extractions.find(pad => pad.id === 'early')!
  assert.equal(taxi.moved, true)
  assert.ok(Math.hypot(taxi.x - (HEIST_MAPS.terrace.taxiAlt!.x + 0.5), taxi.y - (HEIST_MAPS.terrace.taxiAlt!.y + 0.5)) < 0.01)
  assert.match(terrace.message, /TAXI/)
})

test('the after gets meaner, then shuts', () => {
  const state = play(createHeist('studio', 10, { calm: true }), HANGOVER_AT + 200)
  assert.ok(state.agents.some(agent => agent.kind === 'hangover'))
  assert.match(state.message, /RESACAS/)
  const closed = play(state, HEIST_MS + LOCKDOWN_GRACE)
  assert.equal(closed.phase, 'over')
  assert.match(closed.message, /PARTY OVER/)
  assert.equal(closed.score, null)
})

test('the local record stays in its own key and ignores junk', () => {
  const memory = new Map<string, string>()
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } })
  try {
    memory.set(RECORD_KEY, 'no')
    assert.equal(readHeistRecord(), 0)
    assert.equal(saveHeistRecord(1200), 1200)
    assert.equal(memory.get(RECORD_KEY), '1200')
    assert.equal(saveHeistRecord(80), 1200)
    assert.equal(saveHeistRecord(-5), 1200)
    assert.equal(saveHeistRecord(9_999_999), 1200)
    memory.set('danzpoints', '999')
    assert.equal(readHeistRecord(), 1200)
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  }
})
