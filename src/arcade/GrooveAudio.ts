// An original synthesized practice loop. Real DANZ releases/stems are not included.
export class GrooveAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  // A full backing loop, independent of score. Song reconstruction is parked.
  private readonly levels = [.85, .75, .65, .65]
  private anchor = 0
  private step = 0
  private muted = false
  private generation = 0
  private closed = false
  private lastScratchAt = -1

  async start(elapsed: number, muted: boolean) {
    const generation = ++this.generation
    if (this.closed) return null
    try {
      if (!this.context) {
        this.context = new AudioContext()
        this.master = this.context.createGain()
        const limiter = this.context.createDynamicsCompressor()
        limiter.threshold.value = -12; limiter.ratio.value = 10
        this.master.connect(limiter); limiter.connect(this.context.destination)
        this.noise = this.context.createBuffer(1, this.context.sampleRate * .12, this.context.sampleRate)
        const data = this.noise.getChannelData(0)
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
      }
      await this.context.resume()
      if (this.closed || generation !== this.generation) return null
      this.muted = muted; this.master!.gain.setValueAtTime(muted ? 0 : .42, this.context.currentTime)
      this.anchor = this.context.currentTime - elapsed / 1000 + .04
      this.step = Math.ceil(elapsed / 125)
      if (this.timer) clearInterval(this.timer)
      this.timer = setInterval(() => this.schedule(), 25)
      this.schedule()
      return this.context.state === 'running'
    } catch { return false }
  }
  mute(value: boolean) {
    this.muted = value
    if (this.context && this.master) this.master.gain.setTargetAtTime(value ? 0 : .42, this.context.currentTime, .025)
  }
  pause() {
    this.generation++
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    if (this.context && this.master) {
      this.master.gain.cancelScheduledValues(this.context.currentTime)
      this.master.gain.setValueAtTime(0, this.context.currentTime)
      void this.context.suspend().catch(() => {})
    }
  }
  destroy() { this.pause(); this.closed = true; if (this.context) void this.context.close().catch(() => {}) }
  private tone(time: number, frequency: number, length: number, volume: number, type: OscillatorType, end?: number) {
    if (!this.context || !this.master || volume <= 0) return
    const oscillator = this.context.createOscillator(), gain = this.context.createGain()
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, time)
    if (end) oscillator.frequency.exponentialRampToValueAtTime(end, time + length)
    gain.gain.setValueAtTime(.0001, time); gain.gain.exponentialRampToValueAtTime(volume, time + .006)
    gain.gain.exponentialRampToValueAtTime(.0001, time + length)
    oscillator.connect(gain); gain.connect(this.master); oscillator.start(time); oscillator.stop(time + length + .01)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  }
  private hat(time: number, volume: number) {
    if (!this.context || !this.master || !this.noise || volume <= 0) return
    const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), gain = this.context.createGain()
    source.buffer = this.noise; filter.type = 'highpass'; filter.frequency.value = 7000; gain.gain.value = volume
    source.connect(filter); filter.connect(gain); gain.connect(this.master); source.start(time)
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect() }
  }
  private schedule() {
    const context = this.context
    if (!context || context.state !== 'running') return
    const until = context.currentTime - this.anchor + .085
    // Avoid catching up a suspended browser's complete audio backlog.
    this.step = Math.max(this.step, Math.floor((context.currentTime - this.anchor) / .125))
    for (let count = 0; this.step * .125 <= until && count < 8; count++, this.step++) {
      const time = Math.max(context.currentTime + .003, this.anchor + this.step * .125), beat = this.step % 16
      if (beat % 4 === 0) this.tone(time, 125, .18, .12 + this.levels[0] * .34, 'sine', 42)
      if (beat % 4 === 2) this.hat(time, .01 + this.levels[3] * .075)
      if (beat % 2 === 0 && this.levels[1] > 0) {
        const bass = [55, 55, 65.406, 48.999][Math.floor(this.step / 16) % 4]
        this.tone(time, bass * (beat === 14 ? 2 : 1), .18, this.levels[1] * .13, 'triangle')
      }
      if (beat % 4 === 1 && this.levels[2] > 0) {
        const note = [220, 261.626, 329.628, 293.665][Math.floor(this.step / 4) % 4]
        this.tone(time, note, .16, this.levels[2] * .08, 'triangle')
        this.tone(time, note * 1.5, .23, this.levels[2] * .025, 'sine')
      }
    }
  }
  slice(layer: number) { if (this.context && !this.muted) this.tone(this.context.currentTime + .005, 600 + layer * 90, .065, .1, 'sine', 180) }
  scratch(direction: number) {
    if (this.context && !this.muted && this.context.currentTime - this.lastScratchAt >= .055) {
      this.lastScratchAt = this.context.currentTime
      this.tone(this.context.currentTime + .003, direction > 0 ? 170 : 700, .075, .08, 'sawtooth', direction > 0 ? 700 : 170)
    }
  }
  stumble() { if (this.context && !this.muted) this.tone(this.context.currentTime + .005, 150, .18, .1, 'triangle', 55) }
}
