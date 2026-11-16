import { HEIST_MS, HANGOVER_AT } from './engine.ts'

/** Original booth pulse. No stems, no protected tracks, and nothing starts before a gesture. */
export class HeistAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private next = 0
  private noise: AudioBuffer | null = null
  private armed = false
  private closed = false

  arm() {
    if (this.closed) return
    this.armed = true
    if (this.ctx) {
      void this.ctx.resume().catch(() => {})
      return
    }
    const AudioCtx = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = this.ctx = new AudioCtx()
    const master = this.master = ctx.createGain()
    master.gain.value = 0.0001
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -16
    compressor.ratio.value = 8
    master.connect(compressor)
    compressor.connect(ctx.destination)
    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate)
    const data = noise.getChannelData(0)
    let seed = 90
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0
      data[i] = (seed / 4294967296 * 2 - 1) * (1 - i / data.length)
    }
    this.noise = noise
    void ctx.resume().catch(() => {})
  }

  sync(elapsed: number, playing: boolean, enabled: boolean) {
    if (!this.armed || !this.ctx || !this.master || this.closed) return
    if (!playing || !enabled) {
      this.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.04)
      if (this.ctx.state === 'running') void this.ctx.suspend().catch(() => {})
      this.next = 0
      return
    }
    if (this.ctx.state !== 'running') {
      void this.ctx.resume().catch(() => {})
      return
    }
    const drop = 1 - Math.min(1, Math.max(0, elapsed) / HEIST_MS) * 0.72
    this.master.gain.setTargetAtTime(0.2 * drop, this.ctx.currentTime, 0.08)
    const beat = elapsed >= HEIST_MS ? 0.3 : elapsed >= HANGOVER_AT ? 0.38 : elapsed >= 90_000 ? 0.48 : 0.58
    if (this.next < this.ctx.currentTime) this.next = this.ctx.currentTime + 0.02
    for (let guard = 0; this.next < this.ctx.currentTime + 0.16 && guard < 3; guard++) {
      const accent = Math.round(this.next / beat) % 4 === 0
      this.kick(this.next, accent ? 0.2 : 0.08)
      if (accent) this.hat(this.next + beat * 0.5, 0.03 * drop)
      this.next += beat
    }
  }

  sting(kind: 'hit' | 'extract' | 'over') {
    if (!this.armed || !this.ctx || !this.master || this.ctx.state !== 'running') return
    if (kind === 'hit') this.tone(180, 90, 0.12, 0.12, 'square')
    else if (kind === 'extract') { this.tone(320, 480, 0.18, 0.1, 'triangle'); this.tone(480, 720, 0.22, 0.08, 'triangle') }
    else { this.tone(220, 70, 0.4, 0.12, 'sawtooth') }
  }

  destroy() {
    this.closed = true
    const ctx = this.ctx
    this.ctx = null
    this.master = null
    if (ctx) void ctx.close().catch(() => {})
  }

  private tone(from: number, to: number, duration: number, volume: number, type: OscillatorType) {
    const ctx = this.ctx, master = this.master
    if (!ctx || !master) return
    const at = ctx.currentTime + 0.01
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(from, at)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, to), at + duration)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(at)
    oscillator.stop(at + duration + 0.02)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  }

  private kick(time: number, volume: number) {
    this.toneAt(time, 150, 48, 0.12, volume, 'sine')
  }

  private hat(time: number, volume: number) {
    const ctx = this.ctx, master = this.master
    if (!ctx || !master || !this.noise || volume <= 0) return
    const source = ctx.createBufferSource()
    source.buffer = this.noise
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    filter.type = 'highpass'
    filter.frequency.value = 1800
    gain.gain.value = volume
    source.connect(filter)
    filter.connect(gain)
    gain.connect(master)
    source.start(time)
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect() }
  }

  private toneAt(time: number, from: number, to: number, duration: number, volume: number, type: OscillatorType) {
    const ctx = this.ctx, master = this.master
    if (!ctx || !master || volume <= 0) return
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(from, time)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, to), time + duration)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
    oscillator.connect(gain)
    gain.connect(master)
    oscillator.start(time)
    oscillator.stop(time + duration + 0.02)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  }
}
