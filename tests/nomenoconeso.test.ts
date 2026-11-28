import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { ARCHETYPES, CAMEOS, DIALOGUES, EVENTS, HIDDEN_ITEMS, NIGHTS, PERSON_SEEDS, TRAITS, UPGRADES, VISUAL_CUES } from '../src/arcade/collecta/nomenoconeso/data/index.ts'
import { nightDifficulty } from '../src/arcade/collecta/nomenoconeso/logic/difficulty.ts'
import { applyNightResult, readEndCondition } from '../src/arcade/collecta/nomenoconeso/logic/end.ts'
import { resolveFrisk, resolveInspection } from '../src/arcade/collecta/nomenoconeso/logic/inspection.ts'
import { updateMetrics } from '../src/arcade/collecta/nomenoconeso/logic/metrics.ts'
import { createInitialNightState, reduceNight } from '../src/arcade/collecta/nomenoconeso/logic/night.ts'
import { NomeNoConEsoPendiente } from '../src/arcade/collecta/nomenoconeso/logic/pending.ts'
import { generatePerson } from '../src/arcade/collecta/nomenoconeso/logic/people.ts'
import { buildPointsIntent } from '../src/arcade/collecta/nomenoconeso/logic/points.ts'
import { NOMENOCONESO_STORAGE_KEY, createProgression, loadProgression, parseProgression, rememberRecord, saveProgression } from '../src/arcade/collecta/nomenoconeso/logic/progression.ts'
import { resolveScan, scannerFromUpgrades } from '../src/arcade/collecta/nomenoconeso/logic/scanner.ts'
import { PARTY_OVER_LABEL, PAUSE_LABEL } from '../src/arcade/collecta/nomenoconeso/copy.ts'
import { NOMENOCONESO_VISIBLE } from '../src/arcade/collecta/nomenoconeso/visibility.ts'
import {
  CAMEO_CATALOG_IDS,
  HIDDEN_ITEM_IDS,
  NIGHT_EVENT_KINDS,
  NOMENOCONESO_SCHEMA_VERSION,
  PERSON_ARCHETYPE_IDS,
  PROHIBITION_REASONS,
  type InspectionResolution,
  type Person,
} from '../src/arcade/collecta/nomenoconeso/types.ts'
import { ADMIT_CORRECT } from '../src/arcade/collecta/nomenoconeso/data/balance.ts'

const collective = JSON.parse(readFileSync(new URL('../src/content/collective.json', import.meta.url), 'utf8')) as {
  artists: { id: string; name: string }[]
}

function unique(ids: readonly string[], label: string) {
  assert.equal(new Set(ids).size, ids.length, label)
}

function sameMembers(actual: readonly string[], expected: readonly string[], label: string) {
  assert.deepEqual([...actual].sort(), [...expected].sort(), label)
}

test('catalog ids are unique and cover the closed lists', () => {
  unique(ARCHETYPES.map((item) => item.id), 'arquetipos')
  unique(EVENTS.map((item) => item.id), 'eventos')
  unique(UPGRADES.map((item) => item.id), 'mejoras')
  unique(TRAITS.map((item) => item.id), 'rasgos')
  unique(HIDDEN_ITEMS.map((item) => item.id), 'objetos')
  unique(VISUAL_CUES.map((item) => item.id), 'pistas')
  unique(DIALOGUES.map((item) => item.id), 'diálogos')
  unique(PERSON_SEEDS.map((item) => item.id), 'semillas')
  unique(CAMEOS.map((item) => item.id), 'cameos')
  unique(CAMEOS.map((item) => item.catalogId), 'catálogo')
  unique(NIGHTS.map((item) => item.id), 'noches')
  sameMembers(ARCHETYPES.map((item) => item.id), PERSON_ARCHETYPE_IDS, 'arquetipos cerrados')
  sameMembers(EVENTS.map((item) => item.kind), NIGHT_EVENT_KINDS, 'clases de evento')
  sameMembers(HIDDEN_ITEMS.map((item) => item.id), HIDDEN_ITEM_IDS, 'objetos cerrados')
  sameMembers(CAMEOS.map((item) => item.catalogId), CAMEO_CATALOG_IDS, 'cameos cerrados')
  assert.equal(NOMENOCONESO_SCHEMA_VERSION, 1)
  assert.equal(NOMENOCONESO_STORAGE_KEY, 'danz-collecta-nomenoconeso-v1')
})

test('every referenced id exists and seeds match the door rules', () => {
  const archetypes = new Map(ARCHETYPES.map((item) => [item.id, item]))
  const traits = new Map(TRAITS.map((item) => [item.id, item]))
  const items = new Map(HIDDEN_ITEMS.map((item) => [item.id, item]))
  const cues = new Set(VISUAL_CUES.map((item) => item.id))
  const lines = new Map(DIALOGUES.map((item) => [item.id, item]))
  const seen = new Set<string>()

  for (const archetype of ARCHETYPES) {
    assert.ok(archetype.minNight >= 1 && archetype.minNight <= NIGHTS.length)
    assert.ok(archetype.weight > 0)
    assert.ok(archetype.blurb.length > 0 && archetype.name.length > 0)
    for (const id of archetype.traitIds) assert.ok(traits.has(id), id)
    for (const id of archetype.itemIds) if (id) assert.ok(items.has(id), id)
    for (const id of archetype.cueIds) assert.ok(cues.has(id), id)
    for (const id of archetype.dialogueIds) assert.ok(lines.has(id), id)
  }

  for (const seed of [...PERSON_SEEDS, ...CAMEOS]) {
    const archetype = archetypes.get(seed.archetypeId)
    assert.ok(archetype, seed.id)
    assert.ok(seed.displayName.trim().length > 0)
    assert.ok(seed.dialogueIds.length > 0)
    for (const id of seed.traitIds) {
      assert.ok(archetype.traitIds.includes(id), `${seed.id}:${id}`)
    }
    for (const id of seed.visualCueIds) {
      assert.ok(archetype.cueIds.includes(id), `${seed.id}:${id}`)
      assert.ok(cues.has(id))
    }
    for (const id of seed.dialogueIds) {
      assert.ok(archetype.dialogueIds.includes(id), `${seed.id}:${id}`)
      const line = lines.get(id)
      assert.ok(line && line.text.trim().length > 8)
    }
    if (seed.hiddenItemId) {
      assert.ok(archetype.itemIds.includes(seed.hiddenItemId), seed.id)
      const item = items.get(seed.hiddenItemId)
      assert.ok(item)
      if (item.prohibited && seed.prohibition !== 'menor') assert.notEqual(seed.prohibition, null, seed.id)
      if (!item.prohibited) assert.equal(seed.prohibition === 'mal-rollo' || seed.prohibition === null, true, seed.id)
    }
    if (seed.age === null) assert.equal(seed.prohibition, null)
    if (seed.age !== null && seed.age < 18) assert.equal(seed.prohibition, 'menor')
    if (seed.prohibition === 'menor') {
      assert.ok(seed.age !== null && seed.age < 18)
      assert.ok(seed.dialogueIds.includes('puerta-menor'))
    }
    if (!seed.ticket.valid && seed.prohibition !== 'menor') assert.equal(seed.prohibition, 'sin-entrada')
    if (seed.prohibition === 'sin-entrada') assert.equal(seed.ticket.valid, false)
    if (seed.ticket.kind === 'ninguno') assert.equal(seed.ticket.valid, false)
    if (seed.prohibition === 'botella-exterior') assert.equal(seed.hiddenItemId, 'botella')
    if (seed.prohibition === 'objeto-peligroso') assert.equal(seed.hiddenItemId, 'objeto-ligero')
    if (seed.prohibition === 'hater') {
      assert.equal(seed.archetypeId, 'hater')
      assert.ok(seed.traitIds.includes('hater'))
    }
    if (seed.prohibition === 'expulsado') assert.ok(seed.traitIds.includes('expulsado-antes'))
    if (seed.prohibition === 'energia-negativa') assert.ok(seed.traitIds.includes('drama'))
    if (seed.prohibition === 'mal-rollo') assert.ok(seed.traitIds.includes('mal-rollo') || seed.traitIds.includes('grabando'))
    if (seed.prohibition) seen.add(seed.prohibition)
  }

  sameMembers([...seen], PROHIBITION_REASONS, 'motivos de prohibición')
  assert.equal(lines.get('puerta-menor')?.text, 'Hoy no. Esta puerta no es para ti todavía.')
  assert.equal(lines.get('puerta-menor')?.speaker, 'puerta')
})

test('cameos use the public catalog names and stay admissible', () => {
  const artists = new Map(collective.artists.map((artist) => [artist.id, artist.name]))
  for (const cameo of CAMEOS) {
    assert.equal(cameo.archetypeId, 'cameo')
    assert.equal(cameo.prohibition, null)
    assert.equal(cameo.hiddenItemId, null)
    assert.equal(cameo.ticket.valid, true)
    if (cameo.catalogId === 'yeppo') {
      assert.equal(cameo.displayName, 'Yeppo')
      assert.equal(cameo.age, null)
    } else {
      assert.equal(cameo.displayName, artists.get(cameo.catalogId), cameo.catalogId)
      assert.ok(cameo.age !== null && cameo.age >= 18)
    }
  }
})

test('nights escalate and only reference groups that already exist', () => {
  assert.deepEqual(NIGHTS.map((night) => night.index), [1, 2, 3, 4, 5])
  const pressure = NIGHTS.map(nightDifficulty)
  assert.deepEqual(pressure, [56, 84, 120, 160, 209])
  for (let index = 1; index < NIGHTS.length; index += 1) {
    const previous = NIGHTS[index - 1]
    const night = NIGHTS[index]
    assert.ok(night.durationMs < previous.durationMs)
    assert.ok(night.spawnEveryMs < previous.spawnEveryMs)
    assert.ok(night.queueSize > previous.queueSize)
    assert.ok(night.archetypeIds.length > previous.archetypeIds.length)
    assert.ok(night.eventIds.length > previous.eventIds.length)
    assert.ok(pressure[index] > pressure[index - 1])
  }
  for (const night of NIGHTS) {
    assert.equal(night.objectives.maxCapacity, night.start.capacityMax)
    assert.ok(night.start.capacity >= 0 && night.start.capacity < night.start.capacityMax)
    assert.ok(night.start.vibe > night.objectives.minVibe && night.start.vibe <= 100)
    assert.ok(night.objectives.minVibe > 0 && night.objectives.minScore > 0)
    assert.equal(night.start.score, 0)
    assert.equal(night.start.doorMoney, 0)
    assert.equal(night.start.reputation, 0)
    assert.ok(night.briefing.length > 20)
    const expectedArchetypes = ARCHETYPES.filter((item) => item.minNight <= night.index).map((item) => item.id)
    const expectedEvents = EVENTS.filter((item) => item.minNight <= night.index).map((item) => item.id)
    sameMembers(night.archetypeIds, expectedArchetypes, night.id)
    sameMembers(night.eventIds, expectedEvents, night.id)
    for (const id of night.archetypeIds) {
      const archetype = ARCHETYPES.find((item) => item.id === id)
      assert.ok(archetype && archetype.minNight <= night.index)
    }
    for (const id of night.eventIds) {
      const event = EVENTS.find((item) => item.id === id)
      assert.ok(event && event.minNight <= night.index)
      assert.ok(event.effects.length > 0)
    }
  }
})

test('events and upgrades point at real ids and upgrades do not cycle', () => {
  for (const event of EVENTS) {
    assert.ok(event.name.length > 0 && event.blurb.length > 0)
    for (const effect of event.effects) {
      if (effect.kind === 'obligatorio') assert.ok(ARCHETYPES.some((item) => item.id === effect.archetypeId))
      if (effect.kind === 'ritmo') assert.notEqual(effect.spawnMsDelta, 0)
      if (effect.kind === 'cola') assert.ok(effect.extraPeople > 0)
      if (effect.kind === 'vibe') assert.notEqual(effect.delta, 0)
    }
  }
  const ids = new Set(UPGRADES.map((item) => item.id))
  for (const upgrade of UPGRADES) {
    assert.ok(upgrade.cost > 0 && upgrade.minReputation >= 0)
    assert.ok(upgrade.effects.length > 0)
    assert.ok(upgrade.requiresId === null || ids.has(upgrade.requiresId))
    if (upgrade.requiresId) {
      const parent = UPGRADES.find((item) => item.id === upgrade.requiresId)
      assert.ok(parent)
      assert.ok(upgrade.cost > parent.cost)
      assert.ok(upgrade.minReputation > parent.minReputation)
      const seen = new Set<string>([upgrade.id])
      let cursor = parent
      while (cursor.requiresId) {
        assert.equal(seen.has(cursor.requiresId), false, upgrade.id)
        seen.add(cursor.requiresId)
        const next = UPGRADES.find((item) => item.id === cursor.requiresId)
        assert.ok(next)
        cursor = next
      }
    }
  }
})

test('progression keeps a versioned local record and ignores other keys', () => {
  const fresh = createProgression()
  assert.deepEqual(fresh.unlockedArchetypeIds, ['normal', 'crew'])
  assert.deepEqual(fresh.unlockedEventIds, [])
  assert.equal(fresh.schemaVersion, 1)
  const bag = new Map<string, string>([['danz-snake-best-v1', '12']])
  const storage = {
    getItem: (key: string) => bag.get(key) ?? null,
    setItem: (key: string, value: string) => { bag.set(key, value) },
  }
  assert.deepEqual(saveProgression(storage, fresh), { ok: true })
  assert.equal(bag.get('danz-snake-best-v1'), '12')
  assert.equal([...bag.keys()].filter((key) => key !== 'danz-snake-best-v1').join(','), NOMENOCONESO_STORAGE_KEY)
  const loaded = loadProgression(storage)
  assert.equal(loaded.warning, null)
  assert.deepEqual(loaded.state, fresh)

  const recorded = rememberRecord(rememberRecord(fresh, NIGHTS[0].id, 40), NIGHTS[0].id, 10)
  assert.equal(recorded.bestScoreByNight[NIGHTS[0].id], 40)
  assert.equal(rememberRecord(recorded, 'noche-inventada', 80), recorded)
  assert.equal(rememberRecord(recorded, NIGHTS[0].id, 1.5), recorded)

  const cleared = parseProgression({ ...fresh, nightsCleared: [NIGHTS[0].id], pointsIntent: null })
  assert.ok(cleared)
  assert.deepEqual(cleared.unlockedArchetypeIds, ['normal', 'crew', 'escondite'])
  assert.deepEqual(cleared.unlockedEventIds, ['ev-drop'])
  assert.equal(parseProgression({ ...fresh, nightsCleared: [NIGHTS[1].id] }), null)
  assert.equal(parseProgression({ ...fresh, upgradeIds: ['ojo-clinico'] }), null)

  const legacy = loadProgression({ getItem: () => JSON.stringify({ schemaVersion: 0, doorMoney: 40 }) })
  assert.equal(legacy.migrated, true)
  assert.equal(legacy.state.doorMoney, 0)
  assert.match(legacy.warning ?? '', /Empiezas de cero/)
  const newer = loadProgression({ getItem: () => JSON.stringify({ schemaVersion: 2 }) })
  assert.equal(newer.migrated, true)
  assert.match(newer.warning ?? '', /más nueva/)
  const broken = loadProgression({ getItem: () => '{no' })
  assert.equal(broken.migrated, false)
  assert.match(broken.warning ?? '', /no encaja/)
  const blocked = loadProgression({ getItem: () => { throw new Error('cerrado') } })
  assert.equal(blocked.saveAvailable, false)
  assert.equal(blocked.state.doorMoney, 0)
})

test('the points hook stays local and does not claim a reward', () => {
  const intent = buildPointsIntent(NIGHTS[0].id, 20)
  assert.equal(intent.claim, false)
  assert.equal(intent.status, 'no-implementado')
  assert.equal(intent.gameId, 'collecta-nomenoconeso')
  assert.throws(() => buildPointsIntent('noche-inventada', 1), /Noche desconocida/)
  assert.throws(() => buildPointsIntent(NIGHTS[0].id, -1), /puntuación local/)
})

const N1 = NIGHTS[0]
const person = (overrides: Partial<Person> = {}): Person => ({ ...PERSON_SEEDS[0], cameoId: null, roll: 0, ...overrides })
const started = (seed = 7) => reduceNight(createInitialNightState(N1), { type: 'empezar', seed })

test('the generator is deterministic, copies seeds and forces minors out', () => {
  const a = generatePerson({ nightId: N1.id, index: 3, seed: 42, archetypeIds: N1.archetypeIds })
  const b = generatePerson({ nightId: N1.id, index: 3, seed: 42, archetypeIds: N1.archetypeIds })
  assert.deepEqual(a, b)
  assert.equal(a.id, `p-${N1.id}-3-42`)
  assert.ok(N1.archetypeIds.includes(a.archetypeId))
  assert.ok(a.roll >= 0 && a.roll < 1)
  a.traitIds.push('mutado')
  assert.ok(!PERSON_SEEDS.some(seed => seed.traitIds.includes('mutado')), 'seeds are copied, not mutated')
  for (let index = 0; index < 200; index++) {
    const p = generatePerson({ nightId: NIGHTS[4].id, index, seed: 9, archetypeIds: NIGHTS[4].archetypeIds })
    if (p.age !== null && p.age < 18) assert.equal(p.prohibition, 'menor')
  }
})

test('door verdicts: right and wrong admits and rejects, VVIP extras', () => {
  const clean = person({ prohibition: null })
  const banned = person({ prohibition: 'sin-entrada' })
  const pass = resolveInspection({ person: clean, choice: 'pasa', revealedItem: false, frisked: false })
  assert.equal(pass.correct, true); assert.deepEqual([pass.score, pass.capacity], [ADMIT_CORRECT.score, 1])
  const wrongIn = resolveInspection({ person: banned, choice: 'pasa', revealedItem: false, frisked: false })
  assert.equal(wrongIn.correct, false); assert.ok(wrongIn.vibe < 0); assert.equal(wrongIn.capacity, 1)
  const out = resolveInspection({ person: banned, choice: 'fuera', revealedItem: false, frisked: false })
  assert.equal(out.correct, true); assert.ok(out.score > 0); assert.equal(out.line, 'Sin sello no hay after. Hay acera.')
  const wrongOut = resolveInspection({ person: clean, choice: 'fuera', revealedItem: false, frisked: false })
  assert.equal(wrongOut.correct, false); assert.ok(wrongOut.vibe < 0)
  const minor = resolveInspection({ person: person({ age: 16, prohibition: 'menor' }), choice: 'fuera', revealedItem: false, frisked: false })
  assert.equal(minor.line, 'Hoy no. Esta puerta no es para ti todavía.')
  const vvipIn = resolveInspection({ person: person({ archetypeId: 'vvip', prohibition: null }), choice: 'pasa', revealedItem: false, frisked: false })
  assert.ok(vvipIn.vvip > 0)
  const vvipOut = resolveInspection({ person: person({ archetypeId: 'vvip', prohibition: null }), choice: 'fuera', revealedItem: false, frisked: false })
  assert.ok(vvipOut.vvip < 0)
  const vvipBanned = resolveInspection({ person: person({ archetypeId: 'vvip', prohibition: 'hater' }), choice: 'fuera', revealedItem: false, frisked: false })
  assert.equal(vvipBanned.vvip, 0, 'rejecting a prohibited VVIP has no happiness penalty')
  assert.equal(resolveFrisk(clean, { startedAtMs: 100, windowMs: 700, hitAtMs: 500 }).hit, true)
  assert.equal(resolveFrisk(clean, { startedAtMs: 100, windowMs: 700, hitAtMs: 900 }).hit, false)
})

test('metrics clamp, never mutate and capacity never drops', () => {
  const before = { ...N1.start }
  const after = updateMetrics(before, { ...ADMIT_CORRECT, vibe: 500, capacity: -5, correct: true, prohibition: null, angered: false, line: '' })
  assert.deepEqual(before, N1.start)
  assert.equal(after.vibe, 100)
  assert.equal(after.capacity, before.capacity)
})

test('a night plays: start, decide, pause freezes the clock, objectives close it', () => {
  let state = started()
  assert.equal(state.phase, 'puerta'); assert.ok(state.current); assert.equal(state.queue.length, N1.queueSize - 1)
  state = reduceNight(state, { type: 'tick', dtMs: 1000 })
  assert.equal(state.elapsedMs, 1000)
  const paused = reduceNight(state, { type: 'pausar', reason: 'pestana' })
  assert.equal(paused.phase, 'pausa')
  assert.equal(reduceNight(paused, { type: 'tick', dtMs: 5000 }).elapsedMs, 1000)
  assert.equal(reduceNight(paused, { type: 'decidir', choice: 'pasa' }), paused)
  state = reduceNight(paused, { type: 'reanudar' })
  assert.equal(state.phase, 'puerta')
  for (const bad of [NaN, -5, 0, Infinity]) assert.equal(reduceNight(state, { type: 'tick', dtMs: bad }).elapsedMs, 1000)
  // Always choose right until the clock runs out.
  for (let i = 0; i < 12; i++) state = reduceNight(state, { type: 'decidir', choice: state.current!.prohibition ? 'fuera' : 'pasa' })
  assert.equal(state.queue.length, N1.queueSize - 1, 'the queue refills')
  state = reduceNight(state, { type: 'tick', dtMs: N1.durationMs })
  assert.equal(state.phase, 'cierre'); assert.equal(state.result?.reason, 'objetivos-cumplidos'); assert.equal(state.result?.passed, true)
})

test('vibe at zero and a blown capacity end the night at once as PARTY OVER', () => {
  let state = started(3)
  state = { ...state, metrics: { ...state.metrics, vibe: 1 }, current: person({ prohibition: 'hater' }) }
  state = reduceNight(state, { type: 'decidir', choice: 'pasa' })
  assert.equal(state.phase, 'game-over'); assert.equal(state.result?.reason, 'vibe-cero'); assert.equal(state.result?.hard, true)
  let full = started(3)
  full = { ...full, metrics: { ...full.metrics, capacity: N1.start.capacityMax }, current: person({ prohibition: null }) }
  full = reduceNight(full, { type: 'decidir', choice: 'pasa' })
  assert.equal(full.result?.reason, 'aforo-reventado'); assert.equal(full.phase, 'game-over')
  const left = reduceNight(started(), { type: 'salir' })
  assert.equal(left.result?.reason, 'abandonada'); assert.equal(left.result?.passed, false)
})

test('night results: records, bank and unlocks follow the plan; abandoned keeps nothing', () => {
  const base = createProgression()
  const metrics = { ...N1.start, score: 90, doorMoney: 12, reputation: 4 }
  const passed = applyNightResult(base, { nightId: N1.id, passed: true, hard: false, reason: 'objetivos-cumplidos', metrics, score: 90, doorMoneyEarned: 12, reputationDelta: 4 })
  assert.deepEqual(passed.nightsCleared, [N1.id]); assert.equal(passed.doorMoney, 12); assert.equal(passed.reputation, 4)
  assert.equal(passed.bestScoreByNight[N1.id], 90); assert.equal(passed.pointsIntent?.claim, false)
  const failed = applyNightResult(base, { nightId: N1.id, passed: false, hard: true, reason: 'vibe-cero', metrics, score: 30, doorMoneyEarned: 12, reputationDelta: 4 })
  assert.deepEqual(failed.nightsCleared, []); assert.equal(failed.doorMoney, 0); assert.equal(failed.bestScoreByNight[N1.id], 30)
  const left = applyNightResult(base, { nightId: N1.id, passed: false, hard: false, reason: 'abandonada', metrics, score: 50, doorMoneyEarned: 0, reputationDelta: 0 })
  assert.equal(left.bestScoreByNight[N1.id], undefined)
  const skip = applyNightResult(base, { nightId: NIGHTS[2].id, passed: true, hard: false, reason: 'objetivos-cumplidos', metrics, score: 90, doorMoneyEarned: 12, reputationDelta: 4 })
  assert.deepEqual(skip.nightsCleared, [], 'night 3 cannot be cleared before 1 and 2')
})

test('v1 pieces stay pending: frisk, scanner and events', () => {
  const state = started()
  assert.throws(() => reduceNight(state, { type: 'cachear' }), (error: unknown) => error instanceof NomeNoConEsoPendiente)
  assert.throws(() => resolveScan(scannerFromUpgrades([]), 0, 0.2), (error: unknown) => error instanceof NomeNoConEsoPendiente)
  assert.equal(createInitialNightState(N1, true).reducedMotion, true)
})

test('the mode is wired into Collecta only, behind the visibility flag', () => {
  assert.equal(NOMENOCONESO_VISIBLE, true)
  const hub = readFileSync(new URL('../src/arcade/CollectaHub.tsx', import.meta.url), 'utf8')
  assert.match(hub, /NOMENOCONESO_VISIBLE/)
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(app, /nomenoconeso/)
  const chooser = readFileSync(new URL('../src/arcade/ArcadeChooser.tsx', import.meta.url), 'utf8').toLowerCase()
  assert.equal((chooser.match(/collecta-mobile-v1/g) ?? []).length <= 1, true, 'no extra library card')
  assert.match(PAUSE_LABEL, /PAUSA/)
  assert.match(PARTY_OVER_LABEL, /PARTY OVER/)
})
