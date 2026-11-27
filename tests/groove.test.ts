import assert from 'node:assert/strict'
import { test } from 'node:test'
import { advanceGroove, beginGrooveCut, cutGroove, discPosition, GROOVE_DURATION, GROOVE_WEAPONS, SCRATCH_PATTERNS, selectGrooveWeapon, grooveStage, initialGroove, keyCutGroove, readGrooveRecord, saveGrooveRecord, scratchGroove, segmentDistance, setGroovePlaying } from '../src/arcade/groove.ts'

function atVinyl() { let state = setGroovePlaying(initialGroove(), true); for (let i = 0; i < 12; i++) state = advanceGroove(state, 50); return state }
test('a fast swipe intersects the whole segment, awards once and advances a streak', () => {
  const state = atVinyl(), disc = state.discs[0], p = discPosition(disc, state.elapsed)
  const next = cutGroove(state, { x: p.x - 100, y: p.y }, { x: p.x + 100, y: p.y })
  assert.equal(next.hits, 1); assert.equal(next.score, 100); assert.equal(next.combo, 1)
  assert.equal(cutGroove(next, { x: p.x - 100, y: p.y }, { x: p.x + 100, y: p.y }).score, 100)
  assert.equal(state.score, 0); assert.equal(state.discs.length, 1)
  assert.equal(next.sparks[0].angle, 0)
  assert.deepEqual(next.sparks[0].velocity, { x: disc.drift, y: -disc.launch + 570 * (state.elapsed - disc.born) / 1000 })
  assert.equal(next.sparks[0].rotation, (state.elapsed - disc.born) * .035 + disc.spin * 40)
  assert.equal(segmentDistance({ x: 40, y: 12 }, { x: 0, y: 0 }, { x: 100, y: 0 }), 12)
})
test('keyboard cuts share hit validation; a tap or invalid coordinates cannot score', () => {
  const state = atVinyl(), p = discPosition(state.discs[0], state.elapsed)
  assert.equal(keyCutGroove(state, state.discs[0].layer).hits, 1)
  assert.equal(cutGroove(state, p, p), state)
  assert.equal(cutGroove(state, p, { x: NaN, y: 0 }), state)
})
test('feedback resets combo, takes one life, and is removed', () => {
  const state = atVinyl(); state.combo = 8; state.discs[0] = { ...state.discs[0], kind: 'feedback' }
  const p = discPosition(state.discs[0], state.elapsed), next = cutGroove(state, { x: p.x - 70, y: p.y }, { x: p.x + 70, y: p.y })
  assert.equal(next.combo, 0); assert.equal(next.lives, 4); assert.equal(next.score, 0); assert.equal(next.discs.length, 0)
})
test('missing a vinyl counts once, ends at zero lives and paused time is frozen', () => {
  let state = atVinyl(); state.lives = 1
  for (let i = 0; i < 80; i++) state = advanceGroove(state, 50)
  assert.equal(state.status, 'over'); assert.equal(state.lives, 0); assert.equal(state.misses, 1)
  const paused = setGroovePlaying(atVinyl(), false)
  assert.equal(advanceGroove(paused, 100), paused)
})
function scratchAtStart() { return advanceGroove(setGroovePlaying(initialGroove(27, 'scratch'), true), 50) }
function moveAt(state: ReturnType<typeof initialGroove>, time: number, x: number) { while (state.elapsed < time) state = advanceGroove(state, Math.min(50, time - state.elapsed)); return scratchGroove(state, x) }
test('scratch follows direction, distance and beat; random reversals do not complete a phrase', () => {
  let state = scratchAtStart(), x = 250
  state = scratchGroove(state, x)
  for (const n of [340, 250, 340, 250]) state = scratchGroove(state, n)
  assert.equal(state.scratches, 0); assert.equal(state.scratch?.turns, 0)
  assert.equal(state.judgement, 'ESPERA EL PULSO')
  state = scratchGroove(state, 250, true); state = scratchGroove(state, x)
  const challenge = state.scratch!, steps = SCRATCH_PATTERNS[challenge.pattern].steps
  for (const note of steps) { x += note.direction * note.distance; state = moveAt(state, challenge.firstAt + note.offset, x) }
  assert.equal(state.scratches, 1); assert.equal(state.scratch, null); assert.equal(state.score, 500)
  assert.equal(state.perfects, 4); assert.equal(scratchGroove(state, 350).score, 500)
})
test('short motions cannot satisfy a long pull; release never manufactures a gesture', () => {
  let state = advanceGroove({ ...setGroovePlaying(initialGroove(27, 'scratch'), true), scratches: 1 }, 50)
  const first = state.scratch!.firstAt
  state = moveAt(scratchGroove(state, 350), first, 294)
  assert.equal(state.scratch?.turns, 0)
  state = scratchGroove(state, 250); assert.equal(state.scratch?.turns, 1)
  state = scratchGroove(state, 250, true); state = scratchGroove(state, 350)
  assert.equal(state.scratch?.turns, 1)
  const paused = setGroovePlaying(state, false)
  assert.equal(paused.scratch?.anchor, null); assert.equal(paused.scratch?.turns, 1)
})
test('scratch misses the next pulse once, is deterministic and has no flying vinyls', () => {
  let a = scratchAtStart(), b = scratchAtStart()
  const expiry = a.scratch!.firstAt + a.scratch!.window + 1
  while (a.elapsed < expiry) { const ms = Math.min(50, expiry - a.elapsed); a = advanceGroove(a, ms); b = advanceGroove(b, ms) }
  assert.deepEqual(a, b); assert.equal(a.misses, 1); assert.equal(a.scratch, null); assert.equal(a.discs.length, 0)
  a = advanceGroove(a, 50); assert.equal(a.misses, 1)
})
test('weapons change reach, hazard radius and points without resetting the session', () => {
  const state = atVinyl(), disc = state.discs[0], p = discPosition(disc, state.flightTime)
  const from = { x: p.x - 10, y: p.y + 72 }, to = { x: p.x + 10, y: p.y + 72 }
  assert.equal(cutGroove(state, from, to), state)
  assert.equal(cutGroove(selectGrooveWeapon(state, 'twin'), from, to).score, 80)
  assert.equal(keyCutGroove(selectGrooveWeapon(state, 'needle'), disc.layer).score, 125)
  assert.ok(GROOVE_WEAPONS.twin.hazard > GROOVE_WEAPONS.katana.hazard)
  assert.equal(selectGrooveWeapon(state, 'needle').elapsed, state.elapsed)
})
test('gold scores triple and a third gold grants its one-time goal; ice slows only flight time', () => {
  const state = atVinyl(); state.golds = 2; state.discs[0] = { ...state.discs[0], special: 'gold' }
  const gold = keyCutGroove(state, state.discs[0].layer)
  assert.equal(gold.score, 1050); assert.equal(gold.golds, 3)
  const ice = atVinyl(); ice.discs[0] = { ...ice.discs[0], special: 'freeze' }
  const frozen = keyCutGroove(ice, ice.discs[0].layer), next = advanceGroove(frozen, 100)
  assert.equal(next.elapsed - frozen.elapsed, 100); assert.equal(next.flightTime - frozen.flightTime, 50)
})
test('arrow vinyl rejects the wrong axis and multiple cuts award a separate gesture bonus', () => {
  const state = atVinyl(); state.discs[0] = { ...state.discs[0], special: 'arrow', axis: 'y' }
  const wrong = keyCutGroove(state, state.discs[0].layer)
  assert.equal(wrong.hits, 0); assert.equal(wrong.discs.length, 1)
  assert.equal(keyCutGroove(state, state.discs[0].layer, 'y').score, 200)
  const pair = atVinyl(); pair.discs.push({ ...pair.discs[0], id: 999, x: pair.discs[0].x + 90 })
  const p = discPosition(pair.discs[0], pair.flightTime), cut = cutGroove(pair, { x: p.x - 90, y: p.y }, { x: p.x + 180, y: p.y })
  assert.equal(cut.hits, 2); assert.equal(cut.multiCuts, 1); assert.equal(cut.score, 300)
})
test('later waves contain varied layouts and all special vinyls', () => {
  let state = setGroovePlaying(initialGroove(), true)
  const types = new Set<string>(), counts = new Set<number>()
  for (let i = 0; i < 1000; i++) {
    state = advanceGroove({ ...state, lives: 1000 }, 50)
    for (const disc of state.discs) if (disc.kind === 'vinyl') types.add(disc.special!)
    counts.add(state.discs.length)
  }
  assert.deepEqual([...types].sort(), ['arrow', 'combo', 'freeze', 'gold', 'normal', 'split']); assert.ok(counts.size > 3)
})
test('three stages finish at one minute and over/complete do not keep moving', () => {
  let state = setGroovePlaying(initialGroove(), true)
  for (let i = 0; i < GROOVE_DURATION / 100; i++) state = advanceGroove({ ...state, lives: 1000 }, 100)
  assert.equal(state.status, 'complete'); assert.equal(state.elapsed, GROOVE_DURATION)
  assert.equal(advanceGroove(state, 100), state)
  assert.equal(grooveStage(0), 1); assert.equal(grooveStage(20000), 2); assert.equal(grooveStage(40000), 3)
})
test('vinyl and scratch sessions have separate challenges without song reconstruction', () => {
  let cut = setGroovePlaying(initialGroove(), true), scratch = setGroovePlaying(initialGroove(27, 'scratch'), true)
  for (let i = 0; i < 200; i++) {
    cut = advanceGroove({ ...cut, lives: 100 }, 50); scratch = advanceGroove({ ...scratch, lives: 100 }, 50)
    assert.equal(cut.scratch, null); assert.equal(scratch.discs.length, 0)
  }
  assert.equal(cut.mode, 'cut'); assert.equal(scratch.mode, 'scratch')
  assert.equal('levels' in cut, false)
})
test('practice records are distinct for both modes and reject invalid values', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } })
  try {
    saveGrooveRecord(100, 'cut'); saveGrooveRecord(400, 'scratch')
    assert.equal(readGrooveRecord('cut'), 100); assert.equal(readGrooveRecord('scratch'), 400)
    assert.equal(saveGrooveRecord(NaN, 'cut'), 100); assert.equal(saveGrooveRecord(-1, 'scratch'), 400)
  } finally { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else Reflect.deleteProperty(globalThis, 'localStorage') }
})

test('a continuous swipe awards multicuts across pointer samples; separate swipes do not', () => {
  const base = atVinyl()
  const first = { ...base.discs[0], x: 190, drift: 0 }
  const second = { ...first, id: 999, x: 420 }
  const pair = { ...base, discs: [first, second] }
  const y = discPosition(first, pair.flightTime).y
  const a = cutGroove(beginGrooveCut(pair), { x: 110, y }, { x: 270, y })
  assert.equal(a.hits, 1); assert.equal(a.multiCuts, 0)
  const b = cutGroove(a, { x: 270, y }, { x: 500, y })
  assert.equal(b.hits, 2); assert.equal(b.score, 300); assert.equal(b.multiCuts, 1)
  const separate = cutGroove(beginGrooveCut(a), { x: 340, y }, { x: 500, y })
  assert.equal(separate.score, 200); assert.equal(separate.multiCuts, 0)
})
test('ice expiry splits an update between slow and ordinary flight', () => {
  const base = { ...atVinyl(), freezeUntil: 650 }
  const next = advanceGroove(base, 100)
  assert.equal(next.elapsed - base.elapsed, 100)
  assert.equal(next.flightTime - base.flightTime, 75)
})
test('the four scratch patterns complete using their actual timed distances', () => {
  for (let pattern = 0; pattern < SCRATCH_PATTERNS.length; pattern++) {
    let state = advanceGroove({ ...setGroovePlaying(initialGroove(27, 'scratch'), true), elapsed: 25000, scratches: pattern }, 50)
    const challenge = state.scratch!
    assert.equal(challenge.pattern, pattern)
    let x = 320
    state = scratchGroove(state, x)
    for (const step of SCRATCH_PATTERNS[pattern].steps) {
      x += step.direction * step.distance
      state = moveAt(state, challenge.firstAt + step.offset, x)
    }
    assert.equal(state.scratches, pattern + 1); assert.equal(state.scratch, null)
    assert.equal(state.perfects, SCRATCH_PATTERNS[pattern].steps.length)
  }
})

function withDisc(state: ReturnType<typeof initialGroove>, special: 'normal' | 'combo' | 'split' = 'normal') {
  return { ...state, nextId: state.nextId + 1, discs: [{ id: state.nextId, kind: 'vinyl' as const, layer: 0,
    born: state.flightTime - 600, x: 320, drift: 0, launch: 700, spin: 0, special }] }
}
test('Combo Disc arms four seconds, survives an empty gesture and doubles only the next successful stroke', () => {
  const base = withDisc(atVinyl(), 'combo'), armed = keyCutGroove(base, 0)
  assert.equal(armed.score, 100); assert.equal(armed.doubleUntil, armed.elapsed + 4000)
  const empty = cutGroove(beginGrooveCut(armed), {x:0,y:100}, {x:30,y:100})
  assert.equal(empty.doubleUntil, armed.doubleUntil)
  const doubled = keyCutGroove(withDisc(empty), 0)
  assert.equal(doubled.score, 300); assert.equal(doubled.doubleUntil, 0)
  const ordinary = keyCutGroove(withDisc(doubled), 0)
  assert.equal(ordinary.score, 400)
  assert.equal(base.score, 0)
})
test('Combo Disc expires in active time and remains frozen during pause', () => {
  const armed = keyCutGroove(withDisc(atVinyl(), 'combo'), 0)
  const paused = setGroovePlaying(armed, false)
  assert.equal(advanceGroove(paused, 5000), paused)
  let state = { ...armed, discs: [], nextWaveAt: Infinity }
  for (let i=0;i<41;i++) state = advanceGroove(state,100)
  assert.equal(keyCutGroove(withDisc(state),0).score,200)
})
test('a boosted continuous multicut doubles both targets and its bonus without rearming the following stroke', () => {
  const armed = keyCutGroove(withDisc(atVinyl(), 'combo'), 0)
  const first = { ...withDisc(armed).discs[0], x:190 }, second = { ...first, id:9999,x:420 }
  const pair = beginGrooveCut({...armed,discs:[first,second]}), y = discPosition(first,pair.flightTime).y
  const one = cutGroove(pair,{x:110,y},{x:270,y}), both = cutGroove(one,{x:270,y},{x:500,y})
  assert.equal(one.score,300); assert.equal(both.score,700); assert.equal(both.multiCuts,1)
  assert.equal(beginGrooveCut(both).strokeDoubleUntil,0)
})
test('Split Disc creates exactly two smaller bonus targets at the cut position with their own trajectories', () => {
  const base=withDisc(atVinyl(),'split'), parent=base.discs[0], p=discPosition(parent,base.flightTime)
  const split=keyCutGroove(base,0)
  assert.equal(split.score,100);assert.equal(split.discs.length,2)
  assert.equal(new Set(split.discs.map(d=>d.id)).size,2)
  for(const d of split.discs){assert.equal(d.fragment,true);assert.equal(d.size,.65);assert.equal(d.special,'normal');assert.equal(discPosition(d,split.flightTime).y,p.y);assert.equal(Math.abs(d.x-p.x),28)}
  assert.ok(split.discs[0].drift<0&&split.discs[1].drift>0)
  assert.equal(base.discs.length,1);assert.equal(base.discs[0].special,'split')
  const mini=keyCutGroove(split,0)
  assert.equal(mini.hits,2);assert.equal(mini.score,150);assert.equal(mini.discs.length,1)
  assert.equal(keyCutGroove(mini,0).score,200)
})
test('the smaller Split targets require smaller hit geometry and can be missed without losing lives', () => {
  const split=keyCutGroove(withDisc(atVinyl(),'split'),0), child=split.discs[0]
  const single={...split,discs:[child],nextWaveAt:Infinity},p=discPosition(child,single.flightTime)
  assert.equal(cutGroove(single,{x:p.x-10,y:p.y+50},{x:p.x+10,y:p.y+50}),single)
  let state=single
  for(let i=0;i<50;i++)state=advanceGroove(state,100)
  assert.equal(state.discs.length,0);assert.equal(state.lives,5);assert.equal(state.misses,0)
})

test('keyboard prioritizes the current ordered sequence target when a normal vinyl shares its layer', () => {
  const base = atVinyl(), original = base.discs[0]
  const ordinary = { ...original, id: 301, x: 160, drift: 0, layer: 2 }
  const target = { ...original, id: 302, x: 480, drift: 0, layer: 2,
    special: 'arrow' as const, direction: 'right' as const, axis: 'x' as const, sequence: 300, step: 0 }
  const state = { ...base, discs: [ordinary, target],
    cutSequence: { id: 300, next: 0, directions: ['right' as const, 'left' as const] } }
  const next = keyCutGroove(state, 2, 'right')
  assert.equal(next.hits, 1)
  assert.equal(next.cutSequence?.next, 1)
  assert.deepEqual(next.discs.map(d => d.id), [301])
  assert.equal(state.cutSequence.next, 0)
})

test('later vinyl waves add a staggered fan and crossing pair without touching scoring', () => {
  const base = atVinyl()
  const fan = advanceGroove({ ...base, discs: [], wave: 5, nextWaveAt: 0, cutSequence: null }, 50)
  const vinyls = fan.discs.filter(d => d.kind === 'vinyl')
  assert.equal(vinyls.length, 3)
  assert.equal(fan.discs.filter(d => d.kind === 'feedback').length, 1, 'existing feedback hazard stays active')
  assert.deepEqual(vinyls.map(d => d.x), [155, 320, 485])
  assert.deepEqual(vinyls.map(d => d.drift), [55, 0, -55])
  const crossing = advanceGroove({ ...base, discs: [], wave: 6, nextWaveAt: 0, cutSequence: null }, 50)
  assert.equal(crossing.discs.length, 2)
  assert.deepEqual(crossing.discs.map(d => d.x), [145, 495])
  assert.deepEqual(crossing.discs.map(d => d.drift), [85, -85])
  assert.equal(fan.score, base.score)
  assert.equal(crossing.lives, base.lives)
})

test('new stage-two staircase and outward split wave layouts stay deterministic and fair', () => {
  const base = atVinyl()
  const staircase = advanceGroove({ ...base, elapsed: 25_000, discs: [], wave: 16, nextWaveAt: 0, cutSequence: null }, 50)
  const steps = staircase.discs.filter(d => d.kind === 'vinyl')
  assert.equal(steps.length, 3)
  assert.deepEqual(steps.map(d => d.x), [150, 310, 470])
  assert.deepEqual(steps.map(d => d.drift), [-28, 0, 28])
  assert.deepEqual(steps.map(d => d.originY), [760, 805, 850])
  assert.ok(steps.every(d => d.born === staircase.flightTime))
  assert.equal(staircase.score, base.score)
  assert.equal(staircase.lives, base.lives)
  assert.deepEqual(
    advanceGroove({ ...base, elapsed: 25_000, discs: [], wave: 16, nextWaveAt: 0, cutSequence: null }, 50),
    staircase,
    'same seed and input must produce the same wave'
  )

  const outward = advanceGroove({ ...base, discs: [], wave: 8, nextWaveAt: 0, cutSequence: null }, 50)
  const pair = outward.discs.filter(d => d.kind === 'vinyl')
  assert.equal(pair.length, 2)
  assert.deepEqual(pair.map(d => d.x), [245, 395])
  assert.deepEqual(pair.map(d => d.drift), [-90, 90])
  assert.ok(pair.every(d => d.originY === undefined))
  assert.equal(outward.lives, base.lives)

  const firstStage = advanceGroove({ ...base, discs: [], wave: 16, nextWaveAt: 0, cutSequence: null }, 50)
  assert.equal(firstStage.discs.filter(d => d.kind === 'vinyl').length, 2, 'intro stage stays manageable')
})
