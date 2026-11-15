import Phaser from 'phaser'
import { CHASE_WIDTH as W, CHASE_HEIGHT as H, CHASE_OBSTACLES, CHASE_RADIUS, type Chase } from './engine'

const COLORS = [0xffd36e, 0x86e4dc]
const color = (n: number) => '#' + n.toString(16).padStart(6, '0')
/** Static floor, cached head sprites and two moving graphics layers. */
export function createChaseRenderer(parent: HTMLElement, read: () => Chase, advance: (dt: number) => void, ready: () => void) {
  let disposed = false, lastTick = performance.now()
  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  class ChaseScene extends Phaser.Scene {
    private moving!: Phaser.GameObjects.Graphics
    private heads!: Phaser.GameObjects.Image[]
    private labels!: Phaser.GameObjects.Text[]
    private stamp!: Phaser.GameObjects.Text
    private previous: Chase | null = null
    preload() { this.load.svg('yeppo-head', '/arcade/chase/yeppo-face.svg', { width: 110, height: 110 }) }
    create() {
      const g = this.add.graphics()
      g.fillStyle(0x131f27).fillRoundedRect(0, 0, W, H, 20)
      for (let x = 20; x < W; x += 60) for (let y = 20; y < H; y += 60) {
        g.fillStyle((x + y) % 120 ? 0x1e3037 : 0x23373c).fillRoundedRect(x, y, 57, 57, 4)
        g.lineStyle(1, 0x8caa9e, .08).lineBetween(x + 3, y + 2, x + 54, y + 2)
      }
      g.lineStyle(3, 0x8bb3aa, .7).strokeRoundedRect(10, 10, W - 20, H - 20, 17)
      for (let id = 0; id < 2; id++) {
        const x = id ? W - 36 : 26
        g.fillStyle(COLORS[id], .7).fillRoundedRect(x, H / 2 - 62, 10, 124, 4)
        g.fillStyle(COLORS[id], .07).fillCircle(id ? W - 110 : 110, 300, 62)
      }
      for (const r of CHASE_OBSTACLES) {
        g.fillStyle(0x000000, .45).fillRoundedRect(r.x + 6, r.y + 10, r.w, r.h, 10)
        g.fillStyle(r.kind === 'booth' ? 0x896245 : 0x34454b).fillRoundedRect(r.x, r.y, r.w, r.h, 8)
        g.lineStyle(2, r.kind === 'booth' ? 0xc69c6c : 0x6a898b).strokeRoundedRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4, 8)
        if (r.kind === 'booth') {
          g.fillStyle(0x1b2529).fillRoundedRect(r.x + 12, r.y + 12, r.w - 24, r.h - 28, 5)
          for (const x of [r.x + 44, r.x + r.w - 44]) { g.fillStyle(0x0b141b).fillCircle(x, r.y + 60, 25); g.lineStyle(2, 0x66817e).strokeCircle(x, r.y + 60, 18); g.fillStyle(0xffd36e).fillCircle(x, r.y + 60, 7) }
          g.fillStyle(0x86e4dc, .65).fillRoundedRect(r.x + 22, r.y + r.h - 15, r.w - 44, 4, 2)
        } else {
          for (const x of [r.x + 34, r.x + r.w - 34]) { g.fillStyle(0x101c24).fillCircle(x, r.y + 31, 23); g.lineStyle(2, 0x6c8589).strokeCircle(x, r.y + 31, 16); g.fillStyle(0x263c45).fillCircle(x, r.y + 31, 7) }
        }
      }
      this.add.text(W / 2, 40, 'COLLECTA / PASA EL MARRÓN', { fontFamily: 'Arial', fontSize: 16, fontStyle: 'bold', color: '#d9c5a0', letterSpacing: 4 }).setOrigin(.5)
      this.add.text(W / 2, H - 35, 'PILLA · PASA LA FACTURA · ESCAQUÉATE', { fontFamily: 'Arial', fontSize: 13, color: '#92a7a5', letterSpacing: 5 }).setOrigin(.5)
      this.moving = this.add.graphics()
      this.heads = [0, 1].map(() => this.add.image(0, 0, 'yeppo-head').setDisplaySize(62, 62))
      this.labels = [0, 1].map(id => this.add.text(0, 0, `P${id + 1}`, { fontFamily: 'Arial', fontSize: 18, fontStyle: 'bold', color: color(COLORS[id]), backgroundColor: '#0d1822', padding: { x: 7, y: 3 } }).setOrigin(.5, 1))
      this.stamp = this.add.text(W/2,H/2+94,'TRÁMITE CERRADO', {fontFamily:'Arial',fontSize:18,fontStyle:'bold',color:'#22443c',backgroundColor:'#f2dba8',padding:{x:16,y:8}}).setOrigin(.5).setVisible(false)
      if (!disposed) ready()
    }
    update(time: number) {
      if (disposed || !this.moving) return
      const now = performance.now(); advance(Math.min(1000, Math.max(0, now - lastTick))); lastTick = now
      const s = read()
      if (s.phase !== 'playing' && s === this.previous) return
      this.previous = s
      const g = this.moving; g.clear()
      this.stamp.setVisible(s.phase === 'playing' && s.elapsed-s.lastTagAt < 650)
      if (s.elapsed - s.lastTagAt < 500) {
        const p = s.players[s.lastCatcher ?? 0]
        g.lineStyle(3, 0xfff0bc, media.matches ? .6 : 1 - (s.elapsed - s.lastTagAt) / 500).strokeCircle(p.x, p.y, 32 + (media.matches ? 0 : (s.elapsed - s.lastTagAt) * .07))
      }
      s.players.forEach((p, id) => {
        const running = s.phase === 'playing' && (p.moving || p.dashUntil > s.elapsed)
        const step = !media.matches && running ? Math.sin(time / 75 + id * Math.PI) * 6 : 0
        const bob = !media.matches && running ? Math.abs(step) * .3 : 0
        g.fillStyle(0x000000, .4).fillEllipse(p.x, p.y + 25, 56, 20)
        g.lineStyle(id === s.hunter ? 4 : 2, COLORS[id], id === s.hunter ? 1 : .5).strokeCircle(p.x, p.y + 4, CHASE_RADIUS + 7)
        if (s.elapsed < s.protectedUntil && id !== s.hunter) g.lineStyle(2, 0xffffff, .65).strokeCircle(p.x, p.y + 4, CHASE_RADIUS + 12)
        g.lineStyle(8, 0x4b3338).lineBetween(p.x - 9, p.y + 9, p.x - 14 + step, p.y + 25).lineBetween(p.x + 9, p.y + 9, p.x + 14 - step, p.y + 25)
        g.lineStyle(5, 0xffd36e).lineBetween(p.x - 9, p.y + 9, p.x - 14 + step, p.y + 25).lineBetween(p.x + 9, p.y + 9, p.x + 14 - step, p.y + 25)
        g.lineStyle(7, 0x4b3338).lineBetween(p.x - 20, p.y, p.x - 31, p.y + step).lineBetween(p.x + 20, p.y, p.x + 31, p.y - step)
        g.lineStyle(4, 0xffd36e).lineBetween(p.x - 20, p.y, p.x - 31, p.y + step).lineBetween(p.x + 20, p.y, p.x + 31, p.y - step)
        g.fillStyle(COLORS[id]).fillRoundedRect(p.x - 17, p.y + 6, 34, 7, 3)
        this.heads[id].setPosition(p.x, p.y - 13 - bob).setAngle(media.matches || !running ? 0 : step * .6)
        if (id === s.hunter) {
          const rx = Math.min(W-25,p.x+32), ry = Math.max(16,p.y-12)
          g.fillStyle(0x000000,.3).fillRoundedRect(rx-8,ry-10,21,28,2)
          g.fillStyle(0xf3dfb5).fillRoundedRect(rx-10,ry-13,20,27,2)
          g.lineStyle(2,0x75654b).lineBetween(rx-6,ry-6,rx+6,ry-6).lineBetween(rx-6,ry-1,rx+2,ry-1)
          g.lineStyle(2,0xa86a42).strokeRect(rx-6,ry+4,12,5)
        }
        const label = `P${id+1} · ${id === s.hunter ? 'COBRA' : 'SE ESCAQUEA'}`
        if (this.labels[id].text !== label) this.labels[id].setText(label)
        this.labels[id].setPosition(Math.min(W-80,Math.max(80,p.x)), Math.max(32,p.y-48-bob))
      })
    }
  }
  const game = new Phaser.Game({ type: Phaser.AUTO, parent, width: W, height: H, backgroundColor: '#101c24', banner: false, audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, fps: { target: 60 }, render: { antialias: true, roundPixels: true }, scene: ChaseScene })
  const wake = (reset = false) => { if (disposed || !game.isBooted) return; if (reset || !game.loop.running) lastTick = performance.now(); if (!game.loop.running) game.loop.wake() }
  const idle = () => { if (read().phase !== 'playing') game.loop.sleep() }
  game.events.on(Phaser.Core.Events.POST_RENDER, idle)
  const resize = new ResizeObserver(() => { if (!disposed && game.isBooted) { game.scale.refresh(); wake() } }); resize.observe(parent)
  return { wake, destroy() { disposed = true; resize.disconnect(); game.events.off(Phaser.Core.Events.POST_RENDER, idle); game.destroy(true); if (game.isBooted && !game.loop.running) game.loop.wake() } }
}
