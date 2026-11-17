// Original synthesized drop. No samples, stems or DANZ releases live here.
export class AfterDropAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private muted = false
  private closed = false
  private generation = 0
  private anchorTime = 0
  private anchorBeat = 0
  private bpm = 96
  private nextQuantum = 0
  private intensity = 0

  async start(beat: number, bpm: number) {
    const generation = ++this.generation
    if (this.closed) return false
    try {
      if (!this.context) {
        this.context = new AudioContext()
        this.master = this.context.createGain()
        const limiter = this.context.createDynamicsCompressor()
        limiter.threshold.value = -14
        limiter.knee.value = 8
        limiter.ratio.value = 8
        this.master.connect(limiter)
        limiter.connect(this.context.destination)
        this.noise = this.context.createBuffer(1, this.context.sampleRate * 0.08, this.context.sampleRate)
        const data = this.noise.getChannelData(0)
        for (let index = 0; index < data.length; index++) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length)
      }
      await this.context.resume()
      if (this.closed || generation !== this.generation) return false
      this.master!.gain.setValueAtTime(this.muted ? 0 : 0.34, this.context.currentTime)
      this.anchor(beat, bpm)
      return this.context.state === 'running'
    } catch {
      return false
    }
  }

  sync(beat: number, bpm: number, intensity: number) {
    if (!this.context || this.context.state !== 'running' || this.closed) return
    this.intensity = Math.max(0, Math.min(1, intensity))
    if (Math.abs(bpm - this.bpm) > 0.8) this.anchor(beat, bpm)
    this.bpm = bpm
    this.schedule()
  }

  mute(value: boolean) {
    this.muted = value
    if (this.context && this.master) this.master.gain.setTargetAtTime(value ? 0 : 0.34, this.context.currentTime, 0.03)
  }

  pause() {
    this.generation++
    if (this.context && this.master) {
      this.master.gain.cancelScheduledValues(this.context.currentTime)
      this.master.gain.setValueAtTime(0, this.context.currentTime)
      void this.context.suspend().catch(() => {})
    }
  }

  destroy() {
    this.pause()
    this.closed = true
    if (this.context) void this.context.close().catch(() => {})
  }

  perfecto() { this.tone(880, 0.09, 0.08, 'sine', 1320); this.tone(1320, 0.12, 0.03, 'triangle') }
  bien() { this.tone(523.25, 0.07, 0.05, 'triangle') }
  fallo() { this.tone(118, 0.12, 0.05, 'sine', 70) }
  hit() { this.tone(180, 0.16, 0.07, 'sawtooth', 48) }
  extract() {
    ;[523.25, 659.25, 783.99].forEach((note, index) => this.tone(note, 0.14, 0.05, 'triangle', undefined, index * 0.06))
  }
  over() { this.tone(196, 0.42, 0.07, 'triangle', 55) }

  private anchor(beat: number, bpm: number) {
    if (!this.context) return
    this.anchorTime = this.context.currentTime
    this.anchorBeat = beat
    this.bpm = bpm
    this.nextQuantum = Math.ceil(beat * 4) / 4
  }

  private schedule() {
    const context = this.context
    if (!context) return
    const beatLen = 60 / Math.max(60, this.bpm)
    const nowBeat = this.anchorBeat + (context.currentTime - this.anchorTime) / beatLen
    if (this.nextQuantum < nowBeat - 0.05) this.nextQuantum = Math.ceil(nowBeat * 4) / 4
    const horizon = context.currentTime + 0.11
    for (let count = 0; count < 8; count++) {
      const time = this.anchorTime + (this.nextQuantum - this.anchorBeat) * beatLen
      if (time > horizon) break
      if (time >= context.currentTime - 0.02) this.voice(time, Math.round(this.nextQuantum * 4))
      this.nextQuantum += 0.25
    }
  }

  private voice(time: number, sixteenth: number) {
    const step = ((sixteenth % 16) + 16) % 16
    if (step % 4 === 0) this.tone(step % 8 === 0 ? 132 : 118, 0.16, 0.16, 'sine', 42, 0, time)
    if (step % 4 === 2) this.hat(time, 0.025 + this.intensity * 0.03)
    if (step % 8 === 0) {
      const bass = [55, 55, 65.41, 49][Math.floor(sixteenth / 16) % 4]
      this.tone(bass, 0.2, 0.07, 'triangle', undefined, 0, time)
    }
    if (step % 4 === 1 && this.intensity > 0.18) {
      const stab = [220, 246.94, 196, 261.63][Math.floor(sixteenth / 4) % 4]
      this.tone(stab, 0.09, 0.018 + this.intensity * 0.02, 'square', undefined, 0, time)
    }
    if (this.intensity > 0.55 && step % 4 === 3) this.hat(time, 0.015)
  }

  private tone(frequency: number, length: number, volume: number, type: OscillatorType, end?: number, delay = 0, when?: number) {
    if (!this.context || !this.master || volume <= 0 || this.muted) return
    const time = (when ?? this.context.currentTime) + delay
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), time)
    if (end) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), time + length)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length)
    oscillator.connect(gain)
    gain.connect(this.master)
    oscillator.start(time)
    oscillator.stop(time + length + 0.02)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  }

  private hat(time: number, volume: number) {
    if (!this.context || !this.master || !this.noise || volume <= 0 || this.muted) return
    const source = this.context.createBufferSource()
    const filter = this.context.createBiquadFilter()
    const gain = this.context.createGain()
    source.buffer = this.noise
    filter.type = 'highpass'
    filter.frequency.value = 6800
    gain.gain.setValueAtTime(volume, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04)
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    source.start(time)
    source.stop(time + 0.05)
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect() }
  }
}
