import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GrooveMusic, GROOVE_SONGS, type GrooveMusicStatus } from '../src/arcade/grooveMusic.ts'
const SONGS = GROOVE_SONGS.map(song => ({ ...song, src: 'https://example.invalid/' + song.id }))
import { advanceGroove, initialGroove, readGrooveRecord, saveGrooveRecord, scratchGroove, scratchOffset, SCRATCH_PATTERNS, setGroovePlaying } from '../src/arcade/groove.ts'

class Media extends EventTarget {
  src = ''; preload = ''; muted = false; volume = 1; currentTime = 0; readyState = 4; paused = true; seeking = false
  resolvePlay: (() => void) | null = null
  rejectPlay: (() => void) | null = null
  play() { this.paused = false; return new Promise<void>((resolve, reject) => { this.resolvePlay = resolve; this.rejectPlay = () => reject(new Error('blocked')) }) }
  pause() { this.paused = true }
  load() {}
  removeAttribute(name: string) { if (name === 'src') this.src = '' }
  playing() { this.dispatchEvent(new Event('playing')); this.resolvePlay?.() }
}
function setup() {
  const media = new Media(), statuses: GrooveMusicStatus[] = [], failures: number[] = []
  const player = new GrooveMusic(media as unknown as HTMLAudioElement, state => statuses.push(state), () => failures.push(1))
  return { media, player, statuses, failures }
}
test('the song clock follows decoded media, remains frozen while waiting and resumes at the paused position', async () => {
  const { media, player, statuses } = setup()
  try {
    const start = player.start(SONGS[0], 2500, false)
    assert.equal(media.currentTime, SONGS[0].cue + 2.5)
    media.playing(); assert.equal(await start, true)
    media.currentTime += .4; assert.ok(Math.abs(player.clock()! - 2900) < .001)
    media.readyState = 2; media.dispatchEvent(new Event('waiting')); assert.equal(player.clock(), null)
    media.readyState = 4; media.playing(); assert.equal(statuses.at(-1), 'playing')
    player.pause(); assert.equal(player.clock(), null); assert.equal(media.paused, true)
    const resume = player.start(SONGS[0], 2900, true)
    assert.equal(media.currentTime, SONGS[0].cue + 2.9); assert.equal(media.muted, true)
    media.playing(); assert.equal(await resume, true)
    player.mute(false); assert.equal(media.muted, false)
  } finally { player.destroy() }
})
test('leaving before play resolves cannot restart music or report a stale error', async () => {
  const { media, player, failures } = setup()
  const start = player.start(SONGS[0], 0, false)
  player.destroy(); media.playing()
  assert.equal(await start, null); assert.equal(media.paused, true); assert.equal(player.clock(), null)
  media.dispatchEvent(new Event('error')); assert.equal(failures.length, 0)
})
test('a rejected play or network error ends the clock once; retry creates a fresh generation', async () => {
  const { media, player, failures, statuses } = setup()
  try {
    const start = player.start(SONGS[1], 0, false); media.rejectPlay!()
    assert.equal(await start, false); assert.equal(player.clock(), null); assert.equal(failures.length, 1)
    assert.equal(statuses.at(-1), 'error')
    media.dispatchEvent(new Event('error')); assert.equal(failures.length, 1)
    const retry = player.start(SONGS[1], 1500, false); media.playing(); assert.equal(await retry, true)
    media.dispatchEvent(new Event('error')); assert.equal(failures.length, 2); assert.equal(media.paused, true)
  } finally { player.destroy() }
})
test('changing tracks cancels a pending play and uses the new source and cue only', async () => {
  const { media, player } = setup()
  try {
    const old = player.start(SONGS[0], 2000, false), oldPlay = media.resolvePlay!
    const next = player.start(SONGS[1], 0, true)
    oldPlay(); assert.equal(await old, null)
    assert.equal(media.src, SONGS[1].src); assert.equal(media.currentTime, SONGS[1].cue)
    media.playing(); assert.equal(await next, true)
  } finally { player.destroy() }
})
test('a stalled audio request has a finite deadline and can never complete as a late success', async context => {
  context.mock.timers.enable({ apis: ['setTimeout'] })
  const { media, player, failures } = setup()
  try {
    const pending = player.start(SONGS[0], 0, false)
    context.mock.timers.tick(12_000)
    assert.equal(await pending, false); assert.equal(failures.length, 1); assert.equal(media.paused, true)
    media.playing(); assert.equal(player.clock(), null); assert.equal(failures.length, 1)
  } finally { player.destroy() }
})
test('127 BPM waves lie on the song half-beat grid through every stage', () => {
  let state = setGroovePlaying(initialGroove(27, 'cut', 'katana', 127), true)
  const waves: number[] = []
  for (let i = 0; i < 1200; i++) {
    const previous = state.wave
    state = advanceGroove({ ...state, lives: 1000 }, 50)
    if (state.wave > previous) {
      const ticks = state.nextWaveAt / (state.beatMs / 2)
      assert.ok(Math.abs(ticks - Math.round(ticks)) < 1e-8)
      waves.push(state.elapsed)
    }
  }
  assert.equal(state.status, 'complete'); assert.ok(waves.length > 40)
  assert.equal(state.elapsed, 60_000)
})
test('Scratch gestures and judgement windows follow the song tempo and score only one complete phrase', () => {
  let state = advanceGroove(setGroovePlaying(initialGroove(27, 'scratch', 'katana', 127), true), 20)
  const challenge = state.scratch!, notes = SCRATCH_PATTERNS[challenge.pattern].steps
  assert.ok(Math.abs(challenge.firstAt / state.beatMs - Math.round(challenge.firstAt / state.beatMs)) < 1e-8)
  let x = 200; state = scratchGroove(state, x)
  for (const note of notes) {
    const target = challenge.firstAt + scratchOffset(state, note.offset)
    while (state.elapsed < target) state = advanceGroove(state, Math.min(20, target - state.elapsed))
    x += note.direction * note.distance; state = scratchGroove(state, x)
  }
  assert.equal(state.scratches, 1); assert.equal(state.perfects, 4); assert.equal(state.score, 500)
  const paused = setGroovePlaying(state, false); assert.equal(advanceGroove(paused, 100), paused)
})
test('song records do not overwrite legacy practice records or the other mode', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage'), values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } })
  try {
    saveGrooveRecord(100, 'cut'); saveGrooveRecord(200, 'cut', 'funky'); saveGrooveRecord(300, 'cut', 'wthimh')
    assert.equal(readGrooveRecord('cut'), 100); assert.equal(readGrooveRecord('cut', 'funky'), 200)
    assert.equal(readGrooveRecord('cut', 'wthimh'), 300); assert.equal(readGrooveRecord('scratch', 'funky'), 0)
  } finally { if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor); else Reflect.deleteProperty(globalThis, 'localStorage') }
})
