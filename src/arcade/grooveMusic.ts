/** Track metadata only. Media sources come from authenticated short-lived grants. */
export const GROOVE_SONGS = [
  { id: 'funky', title: 'Funky Fiesta', artist: 'Rawayana · Cheo / LEÖN · TonyDawgs edit', bpm: 127, cue: .025 },
  { id: 'wthimh', title: 'WTHIMH', artist: 'Master aportado', bpm: 127, cue: .035 },
] as const
export type GrooveSong = typeof GROOVE_SONGS[number] & { src: string }
export type GrooveMusicId = 'practice' | typeof GROOVE_SONGS[number]['id']
export const GROOVE_MUSIC_KEY = 'danz-groove-music-v1'
export const GROOVE_MUSIC_CHOICES = [
  ...GROOVE_SONGS.map(song => ({ id: song.id, name: song.title.toUpperCase(), badge: `${song.bpm} BPM APROX.`, note: song.artist })),
  { id: 'practice', name: 'ENSAYO', badge: '120 BPM · SIN CONEXIÓN', note: 'Base original de práctica.' },
]
export function grooveSong(id: string) { return GROOVE_SONGS.find(song => song.id === id) }
export function readGrooveMusic(): GrooveMusicId {
  // A fresh offline visit keeps the shell playable without downloading music.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'practice'
  try {
    const saved = localStorage.getItem(GROOVE_MUSIC_KEY)
    if (saved === 'practice' || grooveSong(saved ?? '')) return saved as GrooveMusicId
  } catch { /* Optional local preference. */ }
  return 'practice'
}

export type GrooveMusicStatus = 'idle' | 'loading' | 'playing' | 'error'
/** The media position, rather than a second RAF timer, owns the song clock. */
export class GrooveMusic {
  private generation = 0
  private wanted = false
  private closed = false
  private song: GrooveSong | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private settle: ((value: boolean | null) => void) | null = null
  private listeners: Array<[string, EventListener]> = []
  private audio: HTMLAudioElement
  private report: (status: GrooveMusicStatus) => void
  private failed: () => void

  constructor(audio: HTMLAudioElement, report: (status: GrooveMusicStatus) => void, failed: () => void) {
    this.audio = audio; this.report = report; this.failed = failed
  }
  private clearTimer() { if (this.timer) clearTimeout(this.timer); this.timer = null }
  private watchdog() {
    this.clearTimer()
    this.timer = setTimeout(() => this.fail(), 12_000)
  }
  private fail() {
    if (!this.wanted || this.closed) return
    this.wanted = false; this.clearTimer(); this.audio.pause()
    this.settle?.(false); this.settle = null
    this.report('error'); this.failed()
  }
  start(song: GrooveSong, elapsed: number, muted: boolean): Promise<boolean | null> {
    this.pause()
    if (this.closed) return Promise.resolve(null)
    const generation = ++this.generation
    const active = () => !this.closed && this.wanted && generation === this.generation
    const position = song.cue + elapsed / 1000
    this.wanted = true; this.report('loading')
    const listen = (name: string, action: () => void) => {
      const listener = () => { if (active()) action() }
      this.audio.addEventListener(name, listener); this.listeners.push([name, listener])
    }
    listen('waiting', () => { this.report('loading'); this.watchdog() })
    listen('playing', () => { this.clearTimer(); this.report('playing') })
    listen('error', () => this.fail())
    listen('ended', () => this.fail())
    listen('pause', () => { if (this.audio.paused) this.fail() })
    listen('loadedmetadata', () => {
      try { this.audio.currentTime = position } catch { this.fail() }
    })
    if (this.audio.src !== song.src) this.audio.src = song.src
    this.song = song
    this.audio.preload = 'none'; this.audio.muted = muted; this.audio.volume = .72
    try { this.audio.currentTime = position } catch { /* loadedmetadata will seek. */ }
    this.watchdog()
    return new Promise(resolve => {
      this.settle = resolve
      // Called in the original pointer/keyboard action, before any await.
      void this.audio.play().then(() => {
        if (!active()) { resolve(null); return }
        this.clearTimer(); this.report('playing'); this.settle = null; resolve(true)
      }).catch(() => { if (active()) this.fail(); else resolve(null) })
    })
  }
  clock(): number | null {
    if (!this.wanted || !this.song || this.audio.paused || this.audio.seeking || this.audio.readyState < 3) return null
    const time = (this.audio.currentTime - this.song.cue) * 1000
    return Number.isFinite(time) ? Math.max(0, time) : null
  }
  mute(value: boolean) { this.audio.muted = value }
  pause() {
    this.wanted = false; this.generation++; this.clearTimer()
    this.settle?.(null); this.settle = null
    for (const [name, listener] of this.listeners) this.audio.removeEventListener(name, listener)
    this.listeners = []; this.audio.pause()
  }
  destroy() {
    this.pause(); this.closed = true; this.audio.removeAttribute('src'); this.audio.load()
  }
}
