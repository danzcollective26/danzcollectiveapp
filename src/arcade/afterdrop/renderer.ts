import Phaser from 'phaser'
import { entityDepth, projectDrop, type Drop, type Kind } from './logic.ts'

type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: number }

/** Original procedural booth. No external images, fonts or shaders. */
export function createAfterDropRenderer(parent: HTMLElement, read: () => Drop, advance: (delta: number) => void, ready: () => void) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let disposed = false
  let lastTick = performance.now()
  const sparks: Spark[] = []
  class DropScene extends Phaser.Scene {
    private booth!: Phaser.GameObjects.Graphics
    private world!: Phaser.GameObjects.Graphics
    private grade!: Phaser.GameObjects.Text
    private sized = ''
    private display = 1
    private seenGrade = -1
    create() {
      this.booth = this.add.graphics()
      this.world = this.add.graphics()
      this.grade = this.add.text(0, 0, '', {
        fontFamily: 'Impact, Arial Narrow, sans-serif', fontSize: '54px', color: '#d6ff3c',
      }).setOrigin(0.5).setDepth(4)
      if (!disposed) ready()
    }
    update() {
      if (disposed || !this.world) return
      const now = performance.now()
      const frame = Math.min(1000, Math.max(0, now - lastTick))
      lastTick = now
      advance(frame)
      const state = read()
      const width = Math.max(1, this.scale.width)
      const height = Math.max(1, this.scale.height)
      const key = `${Math.round(width)}x${Math.round(height)}`
      if (key !== this.sized) { this.sized = key; this.paintBooth(width, height) }
      this.display += (state.lane - this.display) * (reduced || state.phase !== 'playing' ? 1 : 0.28)
      this.paintWorld(state, width, height)
    }
    private paintBooth(width: number, height: number) {
      const g = this.booth
      g.clear()
      g.fillStyle(0x07060d, 1).fillRect(0, 0, width, height)
      g.fillStyle(0xff2ea6, 0.16).fillCircle(width * 0.5, height * 0.12, width * 0.42)
      g.fillStyle(0xd6ff3c, 0.05).fillCircle(width * 0.5, height * 0.22, width * 0.2)
      g.fillStyle(0x120814, 1).fillRect(0, 0, width * 0.12, height).fillRect(width * 0.88, 0, width * 0.12, height)
      for (const side of [0.02, 0.9]) {
        const x = width * side
        g.fillStyle(0x1b1e24, 1).fillRoundedRect(x, height * 0.08, width * 0.08, height * 0.34, 6)
        g.fillStyle(0x2a3038, 1).fillRoundedRect(x + width * 0.01, height * 0.1, width * 0.06, height * 0.12, 4)
        g.fillStyle(0x101216, 1).fillCircle(x + width * 0.04, height * 0.16, width * 0.02)
        g.fillStyle(0xff2ea6, 0.8).fillCircle(x + width * 0.04, height * 0.16, width * 0.006)
        g.fillStyle(0x101216, 1).fillCircle(x + width * 0.04, height * 0.28, width * 0.018)
        g.lineStyle(2, 0xd6ff3c, 0.35).strokeRoundedRect(x, height * 0.46, width * 0.08, height * 0.1, 3)
      }
      g.lineStyle(2, 0xff2ea6, 0.35)
      for (let rung = 0; rung < 5; rung++) {
        const y = 8 + rung * 14
        g.lineBetween(width * 0.12, y, width * 0.88, y)
      }
      g.lineStyle(2, 0xd6ff3c, 0.45).lineBetween(width * 0.14, height * 0.155, width * 0.86, height * 0.155)
    }
    private paintWorld(state: Drop, width: number, height: number) {
      const g = this.world
      g.clear()
      const shock = state.elapsed - state.lastHitAt
      const shake = !reduced && shock >= 0 && shock < 240 ? (1 - shock / 240) * 8 : 0
      const ox = shake ? Math.sin(state.elapsed * 0.09) * shake : 0
      const pulse = reduced ? 0.5 : 0.28 + 0.72 * (1 - (state.beat % 1)) ** 2
      if (!reduced && state.phase === 'playing') {
        const shift = state.beat % 1
        for (let index = 0; index < 5; index++) {
          const depth = (1 - ((index / 5 + shift) % 1))
          const left = projectDrop(-0.15, depth, width, height)
          const right = projectDrop(2.15, depth, width, height)
          g.lineStyle(1, 0xff2ea6, 0.08 + (1 - depth) * 0.16).lineBetween(left.x + ox, left.y, right.x + ox, right.y)
        }
      }
      for (const lane of [0, 1, 2]) {
        const far = projectDrop(lane, 1, width, height)
        const near = projectDrop(lane, 0, width, height)
        const active = Math.abs(this.display - lane) < 0.45
        g.fillStyle(active ? 0xff2ea6 : 0x140c18, active ? 0.16 + pulse * 0.08 : 0.34)
        g.fillTriangle(far.x - far.spread / 2 + ox, far.y, far.x + far.spread / 2 + ox, far.y, near.x + near.spread / 2 + ox, near.y)
        g.fillTriangle(far.x - far.spread / 2 + ox, far.y, near.x + near.spread / 2 + ox, near.y, near.x - near.spread / 2 + ox, near.y)
        g.lineStyle(active ? 3 : 1.5, active ? 0xd6ff3c : 0xff2ea6, active ? 0.45 + pulse * 0.4 : 0.28)
        g.lineBetween(far.x - far.spread / 2 + ox, far.y, near.x - near.spread / 2 + ox, near.y)
        g.lineBetween(far.x + far.spread / 2 + ox, far.y, near.x + near.spread / 2 + ox, near.y)
      }
      const line = projectDrop(1, 0, width, height)
      g.lineStyle(4, 0xd6ff3c, 0.35 + pulse * 0.55).lineBetween(width * 0.16 + ox, line.y, width * 0.84 + ox, line.y)
      const ordered = [...state.entities].sort((a, b) => entityDepth(b, state.beat) - entityDepth(a, state.beat))
      for (const entity of ordered) {
        const depth = entityDepth(entity, state.beat)
        if (depth < -0.2 || depth > 1.05) continue
        const point = projectDrop(entity.lane, depth, width, height)
        paintGlyph(g, entity.kind, point.x + ox, point.y, 84 * point.scale, entity.resolved ? 0.35 : 1)
      }
      const player = projectDrop(this.display, 0, width, height)
      paintPlayer(g, player.x + ox, Math.min(height - 36, player.y + 8), reduced ? 0 : state.beat)
      if (state.judgement && state.judgement.at !== this.seenGrade) {
        this.seenGrade = state.judgement.at
        if (!reduced && state.judgement.grade === 'PERFECTO') burst(sparks, width / 2, height * 0.42)
      }
      for (let index = sparks.length - 1; index >= 0; index--) {
        const spark = sparks[index]
        spark.life -= 0.04
        spark.x += spark.vx
        spark.y += spark.vy
        spark.vy += 0.08
        if (spark.life <= 0) { sparks.splice(index, 1); continue }
        g.fillStyle(spark.color, spark.life).fillCircle(spark.x, spark.y, 3)
      }
      const judgement = state.judgement
      const age = judgement ? state.elapsed - judgement.at : 999
      const visible = Boolean(judgement) && age < 520
      this.grade.setVisible(visible)
      if (judgement && visible) {
        const color = judgement.grade === 'PERFECTO' ? '#d6ff3c' : judgement.grade === 'BIEN' ? '#8aecff' : '#ff5b93'
        this.grade.setColor(color).setText(judgement.grade).setAlpha(1 - age / 560).setPosition(width / 2, height * 0.4 - (reduced ? 0 : age * 0.04))
      }
    }
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: Math.max(320, parent.clientWidth), height: Math.max(420, parent.clientHeight),
    backgroundColor: '#07060d', banner: false, audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false },
    scale: { mode: Phaser.Scale.RESIZE, autoRound: true }, fps: { target: 60 }, scene: DropScene,
    render: { antialias: true, desynchronized: true, powerPreference: 'high-performance' },
  })
  const wake = (resetClock = false) => {
    if (disposed || !game.isBooted) return
    if (resetClock || !game.loop.running) lastTick = performance.now()
    if (!game.loop.running) game.loop.wake()
  }
  const idle = () => { if (read().phase !== 'playing') game.loop.sleep() }
  game.events.on(Phaser.Core.Events.POST_RENDER, idle)
  const resize = new ResizeObserver(() => { if (!disposed && game.isBooted) { game.scale.refresh(); wake() } })
  resize.observe(parent)
  return { wake, destroy() {
    disposed = true
    resize.disconnect()
    game.events.off(Phaser.Core.Events.POST_RENDER, idle)
    game.destroy(true)
    if (game.isBooted && !game.loop.running) game.loop.wake()
  } }
}

function burst(sparks: Spark[], x: number, y: number) {
  if (sparks.length > 28) sparks.splice(0, sparks.length - 20)
  for (let index = 0; index < 8; index++) {
    const angle = (Math.PI * 2 * index) / 8
    sparks.push({ x, y, vx: Math.cos(angle) * 2.4, vy: Math.sin(angle) * 2.2, life: 1, color: index % 2 ? 0xd6ff3c : 0xff2ea6 })
  }
}

function paintGlyph(g: Phaser.GameObjects.Graphics, kind: Kind, x: number, y: number, size: number, alpha: number) {
  const s = Math.max(10, size)
  if (kind === 'vinyl') {
    g.fillStyle(0x140910, 0.35 * alpha).fillCircle(x + s * 0.04, y + s * 0.06, s * 0.42)
    g.fillStyle(0xf7f1e6, alpha).fillCircle(x, y, s * 0.42)
    g.lineStyle(Math.max(2, s * 0.04), 0xff2ea6, alpha).strokeCircle(x, y, s * 0.28)
    g.fillStyle(0x161616, alpha).fillCircle(x, y, s * 0.12)
    g.fillStyle(0xd6ff3c, alpha).fillCircle(x, y, s * 0.045)
    return
  }
  if (kind === 'hater') {
    g.fillStyle(0x3a1024, alpha).fillRoundedRect(x - s * 0.26, y - s * 0.02, s * 0.52, s * 0.5, s * 0.08)
    g.fillStyle(0xff2ea6, alpha).fillCircle(x, y - s * 0.22, s * 0.26)
    g.fillStyle(0x1a0610, alpha).fillCircle(x - s * 0.09, y - s * 0.24, s * 0.045).fillCircle(x + s * 0.09, y - s * 0.24, s * 0.045)
    g.lineStyle(Math.max(2, s * 0.05), 0x1a0610, alpha)
    g.lineBetween(x - s * 0.18, y - s * 0.36, x - s * 0.02, y - s * 0.3)
    g.lineBetween(x + s * 0.18, y - s * 0.36, x + s * 0.02, y - s * 0.3)
    return
  }
  if (kind === 'resaca') {
    g.fillStyle(0x16361c, alpha).fillRoundedRect(x - s * 0.24, y - s * 0.02, s * 0.5, s * 0.46, s * 0.12)
    g.fillStyle(0x8dff6a, alpha).fillCircle(x + s * 0.06, y - s * 0.18, s * 0.22)
    g.fillStyle(0x102416, alpha).fillCircle(x - s * 0.02, y - s * 0.18, s * 0.04).fillCircle(x + s * 0.12, y - s * 0.18, s * 0.04)
    g.fillStyle(0x8dff6a, 0.7 * alpha).fillCircle(x - s * 0.16, y + s * 0.28, s * 0.05).fillCircle(x + s * 0.02, y + s * 0.36, s * 0.035)
    return
  }
  g.fillStyle(0x2a2416, alpha).fillRoundedRect(x - s * 0.28, y - s * 0.08, s * 0.56, s * 0.58, 4)
  g.fillStyle(0xffd56a, alpha).fillRect(x - s * 0.05, y - s * 0.02, s * 0.1, s * 0.42)
  g.fillStyle(0xf2d7a2, alpha).fillCircle(x, y - s * 0.24, s * 0.18)
  g.fillStyle(0x14110c, alpha).fillRect(x - s * 0.14, y - s * 0.28, s * 0.28, s * 0.06)
  g.fillStyle(0xd6ff3c, alpha).fillRoundedRect(x + s * 0.16, y - s * 0.02, s * 0.16, s * 0.22, 2)
}

function paintPlayer(g: Phaser.GameObjects.Graphics, x: number, y: number, beat: number) {
  const bob = beat ? Math.sin(beat * Math.PI * 2) * 2 : 0
  g.fillStyle(0x09070d, 0.35).fillRoundedRect(x - 22, y + 24, 44, 8, 4)
  g.fillStyle(0x24182c, 1).fillRoundedRect(x - 16, y - 8 + bob, 32, 36, 8)
  g.fillStyle(0xff2ea6, 1).fillCircle(x, y - 24 + bob, 14)
  g.lineStyle(3, 0xd6ff3c, 1).lineBetween(x - 16, y - 24 + bob, x + 16, y - 24 + bob)
  g.fillStyle(0x111, 1).fillCircle(x - 16, y - 24 + bob, 6).fillCircle(x + 16, y - 24 + bob, 6)
  g.fillStyle(0xd6ff3c, 1).fillCircle(x + 10, y - 2 + bob, 4)
}
