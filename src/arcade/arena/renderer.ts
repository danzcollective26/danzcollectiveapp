import Phaser from 'phaser'
import { ARENA_COLS, ARENA_ROWS, FUSE_MS, BLAST_MS, type Arena } from './engine'

const S = 72
const COLORS = [0xdfff78, 0xff9ec7]
const hex = (color: number) => '#' + color.toString(16).padStart(6, '0')

/** Original procedural club artwork. No image requests, shaders or per-frame React renders. */
export function createArenaRenderer(parent: HTMLElement, read: () => Arena, advance: (delta: number) => void, ready: () => void) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let disposed = false, lastTick = performance.now()
  class ArenaScene extends Phaser.Scene {
    private floor!: Phaser.GameObjects.Graphics
    private moving!: Phaser.GameObjects.Graphics
    private labels!: Phaser.GameObjects.Text[]
    private previousTiles: Arena['tiles'] | null = null
    private previousState: Arena | null = null
    private display = [{ x: 1, y: 1 }, { x: 9, y: 7 }]
    create() {
      this.floor = this.add.graphics()
      this.moving = this.add.graphics()
      this.labels = [0, 1].map(id => this.add.text(0, 0, `P${id + 1}`, { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: 16, color: hex(COLORS[id]), backgroundColor: '#0c121bcc', padding: { x: 5, y: 2 } }).setOrigin(.5, 1))
      this.add.text(S * 5.5, 10, 'DANZ / SOUND ARENA', { fontFamily: 'Arial, sans-serif', fontSize: 13, fontStyle: 'bold', color: '#b7c5ca', letterSpacing: 4 }).setOrigin(.5, 0)
      if (!disposed) ready()
    }
    update(time: number, delta: number) {
      if (disposed || !this.floor) return
      // Phaser smooths/clamps its delta. Use real foreground time so a slow
      // renderer cannot lengthen the fuse or the round; the engine substeps it.
      const now = performance.now()
      advance(Math.min(1000, Math.max(0, now - lastTick)))
      lastTick = now
      const state = read(), g = this.moving
      if (state.phase !== 'playing' && state === this.previousState) return
      this.previousState = state
      if (this.previousTiles !== state.tiles) {
        this.previousTiles = state.tiles
        const bg = this.floor
        bg.clear()
        state.tiles.forEach((tile, cell) => {
          const x = cell % ARENA_COLS * S, y = Math.floor(cell / ARENA_COLS) * S
          bg.fillStyle((cell + Math.floor(cell / ARENA_COLS)) % 2 ? 0x1a2933 : 0x1d2f39).fillRect(x, y, S, S)
          bg.lineStyle(1, 0x7894a0, .12).strokeRect(x + 2, y + 2, S - 4, S - 4)
          if (tile === 1) {
            bg.fillStyle(0x090e16, .8).fillRoundedRect(x + 7, y + 16, 60, 53, 8)
            bg.fillStyle(0x354d59).fillRoundedRect(x + 6, y + 5, 60, 55, 7)
            bg.lineStyle(2, 0x58737b).strokeRoundedRect(x + 7, y + 6, 58, 53, 7)
            bg.fillStyle(0x0c1721).fillCircle(x + 36, y + 32, 20)
            bg.lineStyle(2, 0x718088, .5).strokeCircle(x + 36, y + 32, 15)
            bg.fillStyle(0x283f4c).fillCircle(x + 36, y + 32, 8)
            bg.fillStyle(0xdfff78, .65).fillRoundedRect(x + 14, y + 8, 14, 3, 1)
          } else if (tile === 2) {
            bg.fillStyle(0x050b11, .6).fillRoundedRect(x + 5, y + 14, 62, 54, 5)
            bg.fillStyle(0x8d6249).fillRoundedRect(x + 5, y + 5, 62, 54, 5)
            bg.fillStyle(0xb18159).fillRoundedRect(x + 8, y + 7, 56, 16, 3)
            bg.lineStyle(3, 0x453a33).lineBetween(x + 9, y + 28, x + 63, y + 28).lineBetween(x + 9, y + 48, x + 63, y + 48)
            bg.fillStyle(0x252e33).fillRect(x + 7, y + 5, 6, 54).fillRect(x + 59, y + 5, 6, 54)
            bg.fillStyle(0xdfcb94).fillCircle(x + 36, y + 35, 10)
            bg.fillStyle(0x3c372e).fillCircle(x + 36, y + 35, 4)
          }
        })
        bg.lineStyle(3, 0x83aaa5, .6).strokeRoundedRect(3, 3, ARENA_COLS * S - 6, ARENA_ROWS * S - 6, 10)
      }
      g.clear()
      for (const pickup of state.pickups) {
        if (pickup.readyAt > state.elapsed) continue
        const x = (pickup.cell % ARENA_COLS + .5) * S, y = (Math.floor(pickup.cell / ARENA_COLS) + .5) * S
        g.fillStyle(pickup.kind === 'range' ? 0x92e6db : 0xffdc8c).fillRoundedRect(x - 15, y - 15, 30, 30, 7)
        g.lineStyle(4, 0x17222c).lineBetween(x - 8, y, x + 8, y)
        if (pickup.kind === 'range') g.lineBetween(x, y - 8, x, y + 8)
        else g.strokeCircle(x, y, 8)
      }
      for (const b of state.bombs) {
        const x = (b.x + .5) * S, y = (b.y + .5) * S, fuse = Math.max(0, (b.due - state.elapsed) / FUSE_MS)
        const r = reduced ? 24 : 23 + Math.sin(time / (80 + fuse * 140)) * 1.5
        g.fillStyle(0x000000, .4).fillEllipse(x + 2, y + 8, 54, 35)
        g.fillStyle(0x080c15).fillCircle(x, y, r)
        g.lineStyle(1, 0x708082, .7)
        for (const ring of [13, 18, 22]) g.strokeCircle(x, y, ring)
        g.fillStyle(COLORS[b.owner]).fillCircle(x, y, 9)
        g.fillStyle(0x0b1720).fillCircle(x, y, 3)
        g.lineStyle(3, fuse < .3 ? 0xffad7b : COLORS[b.owner]).beginPath().arc(x, y, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fuse).strokePath()
      }
      for (const blast of state.blasts) {
        const x = (blast.cell % ARENA_COLS + .5) * S, y = (Math.floor(blast.cell / ARENA_COLS) + .5) * S
        const alpha = reduced ? 1 : Math.min(1, (blast.until - state.elapsed) / BLAST_MS + .3)
        g.fillStyle(0xffae68, alpha * .35).fillRoundedRect(x - 33, y - 33, 66, 66, 16)
        g.fillStyle(0xffcc85, alpha).fillRoundedRect(x - 28, y - 9, 56, 18, 8).fillRoundedRect(x - 9, y - 28, 18, 56, 8)
        g.fillStyle(0xfff9d3, alpha).fillCircle(x, y, 12)
      }
      state.players.forEach((p, id) => {
        const display = this.display[id]
        const factor = reduced || state.phase !== 'playing' ? 1 : Math.min(1, delta / 55)
        display.x += (p.x - display.x) * factor; display.y += (p.y - display.y) * factor
        const x = (display.x + .5) * S, y = (display.y + .5) * S
        this.labels[id].setPosition(x, y - 33).setVisible(p.alive)
        if (!p.alive) return
        const bob = reduced || state.phase !== 'playing' ? 0 : Math.sin(time / 130 + id) * 1.5
        g.fillStyle(0x000000, .4).fillEllipse(x, y + 23, 45, 16)
        g.lineStyle(7, 0x111922).lineBetween(x - 9, y + 9, x - 12, y + 23 + bob).lineBetween(x + 9, y + 9, x + 12, y + 23 - bob)
        g.lineStyle(8, COLORS[id]).lineBetween(x - 14, y + 22 + bob, x - 5, y + 22 + bob).lineBetween(x + 6, y + 22 - bob, x + 15, y + 22 - bob)
        for (let i = 0; i < 6; i++) {
          const angle = i * Math.PI / 3 - Math.PI / 2
          g.fillStyle(0x0a111b).fillCircle(x + Math.cos(angle) * 15, y - 6 + Math.sin(angle) * 15 + bob, 12)
          g.fillStyle(COLORS[id]).fillCircle(x + Math.cos(angle) * 15, y - 8 + Math.sin(angle) * 15 + bob, 10)
        }
        g.fillStyle(COLORS[id]).fillCircle(x, y - 8 + bob, 17)
        g.fillStyle(0x15212a).fillRoundedRect(x - 13, y - 15 + bob, 26, 13, 5)
        g.fillStyle(0xfff7db).fillRect(x - 8, y - 12 + bob, 4, 5).fillRect(x + 4, y - 12 + bob, 4, 5)
        g.lineStyle(2, 0x253236).lineBetween(x - 5, y + 3 + bob, x + 5, y + 3 + bob)
      })
    }
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: ARENA_COLS * S, height: ARENA_ROWS * S,
    backgroundColor: '#12212b', banner: false, audio: { noAudio: true },
    input: { activePointers: 4, keyboard: false, mouse: false, touch: false },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    fps: { target: 60 }, scene: ArenaScene,
    render: { antialias: true, roundPixels: true },
  })
  const wake = (resetClock = false) => {
    if (disposed || !game.isBooted) return
    if (resetClock || !game.loop.running) lastTick = performance.now()
    if (!game.loop.running) game.loop.wake()
  }
  // Render the final frame, then stop RAF entirely while menus/pauses are open.
  // DOM controls wake it on changes; resizing requests a single fresh frame.
  const idle = () => { if (read().phase !== 'playing') game.loop.sleep() }
  game.events.on(Phaser.Core.Events.POST_RENDER, idle)
  const resize = new ResizeObserver(() => { if (!disposed && game.isBooted) { game.scale.refresh(); wake() } })
  resize.observe(parent)
  return { wake, destroy() {
    disposed = true; resize.disconnect(); game.events.off(Phaser.Core.Events.POST_RENDER, idle)
    game.destroy(true)
    // Phaser performs destruction on its next step, including from sleep.
    if (game.isBooted && !game.loop.running) game.loop.wake()
  } }
}
