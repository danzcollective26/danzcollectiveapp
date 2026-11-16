import { extractionOpen, heistStage, type Agent, type HeistState, type LootKind } from './engine.ts'

const TILE = 16
const VIEW_W = 9
const VIEW_H = 7
const LIGHT = [4.4, 3.6, 2.9, 2.2]

const INK: Record<Agent['kind'] | 'player', string> = {
  player: '#d9fa69',
  tech: '#7ee0d0',
  crew: '#ff78a8',
  manager: '#e6d3a1',
  bouncer: '#8aa4ff',
  hangover: '#8b9474',
}

export function heistCanvasSize() {
  return { width: VIEW_W * TILE, height: VIEW_H * TILE }
}

export function drawHeist(ctx: CanvasRenderingContext2D, state: HeistState, reduced: boolean) {
  const { width, height } = heistCanvasSize()
  ctx.imageSmoothingEnabled = false
  let camX = state.player.x - VIEW_W / 2
  let camY = state.player.y - VIEW_H / 2
  camX = Math.max(0, Math.min(state.cols - VIEW_W, camX))
  camY = Math.max(0, Math.min(state.rows - VIEW_H, camY))
  const shake = !reduced && state.elapsed < state.invulnUntil && state.elapsed > state.invulnUntil - 220
  if (shake) { camX += ((Math.floor(state.elapsed / 30) % 2) ? 0.08 : -0.08) }
  ctx.fillStyle = state.map === 'terrace' ? '#120e12' : '#100d16'
  ctx.fillRect(0, 0, width, height)
  for (let y = Math.floor(camY); y < Math.ceil(camY + VIEW_H); y++) for (let x = Math.floor(camX); x < Math.ceil(camX + VIEW_W); x++) {
    if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) continue
    const screenX = Math.round((x - camX) * TILE)
    const screenY = Math.round((y - camY) * TILE)
    drawTile(ctx, state, x, y, screenX, screenY, reduced)
  }
  for (const pad of state.extractions) drawPad(ctx, state, pad.x, pad.y, camX, camY, extractionOpen(state, pad), pad.moved, reduced)
  if (state.smokeAt) drawLoot(ctx, 'merch', state.smokeAt.x, state.smokeAt.y, camX, camY, true)
  for (const item of state.loot) if (!item.taken) drawLoot(ctx, item.kind, item.x, item.y, camX, camY, false)
  for (const agent of state.agents) drawActor(ctx, agent.kind, agent.x, agent.y, camX, camY, agent, state)
  drawDark(ctx, state, camX, camY, reduced)
  const blink = !reduced && state.invulnUntil > state.elapsed && Math.floor(state.elapsed / 70) % 2 === 0
  if (!blink) drawActor(ctx, 'player', state.player.x, state.player.y, camX, camY, null, state)
  for (const item of state.loot) if (!item.taken && item.revealed) ping(ctx, item.x, item.y, camX, camY, '#d9fa69')
  for (const pad of state.extractions) if (extractionOpen(state, pad)) chevron(ctx, pad.x, pad.y, camX, camY)
  if (state.hiddenUntil > state.elapsed) {
    ctx.fillStyle = '#c9d4dc55'
    ctx.fillRect(0, 0, width, height)
  }
}

function drawTile(ctx: CanvasRenderingContext2D, state: HeistState, x: number, y: number, sx: number, sy: number, reduced: boolean) {
  const tile = state.tiles[y * state.cols + x]
  const night = state.map === 'terrace'
  if (tile === 'wall') {
    ctx.fillStyle = night ? '#2a241c' : '#2a2433'
    ctx.fillRect(sx, sy, TILE, TILE)
    ctx.fillStyle = night ? '#4a3d2e' : '#463c52'
    ctx.fillRect(sx, sy, TILE, 2)
    return
  }
  if (tile === 'cover') {
    ctx.fillStyle = night ? '#1c1714' : '#18141e'
    ctx.fillRect(sx, sy, TILE, TILE)
    ctx.fillStyle = '#3c2c38'
    ctx.fillRect(sx + 1, sy + 3, TILE - 2, TILE - 5)
    ctx.fillStyle = '#d9fa69'
    ctx.fillRect(sx + 5, sy + 6, 6, 6)
    ctx.fillStyle = '#111'
    ctx.fillRect(sx + 7, sy + 8, 2, 2)
    return
  }
  ctx.fillStyle = (x + y) % 2 === 0 ? (night ? '#2a221c' : '#241c2c') : (night ? '#34281e' : '#2e2436')
  ctx.fillRect(sx, sy, TILE, TILE)
  if (tile === 'feedback') {
    ctx.fillStyle = state.feedbackSafeUntil > state.elapsed ? '#24584a' : '#16343c'
    ctx.fillRect(sx, sy, TILE, TILE)
    ctx.fillStyle = '#7ee0d088'
    ctx.fillRect(sx + 2, sy + (reduced ? 6 : 4 + (Math.floor(state.elapsed / 120) % 3) * 2), TILE - 4, 2)
  }
  if (tile === 'door' || tile === 'vip') {
    const open = state.forcedDoors.some(door => door.x === x && door.y === y && door.until > state.elapsed)
      || (tile === 'door' && state.inventory.some(item => item.kind === 'contract'))
      || (tile === 'vip' && state.inventory.some(item => item.kind === 'vip'))
    ctx.fillStyle = open ? '#203028' : '#4a3428'
    ctx.fillRect(sx + 2, sy, TILE - 4, TILE)
    ctx.fillStyle = open ? '#d9fa69' : '#c4784a'
    ctx.fillRect(sx + (open ? 2 : 6), sy + 4, open ? 2 : 4, 8)
  }
}

function drawPad(ctx: CanvasRenderingContext2D, state: HeistState, x: number, y: number, camX: number, camY: number, open: boolean, moved: boolean, reduced: boolean) {
  const sx = Math.round((x - camX) * TILE - 7)
  const sy = Math.round((y - camY) * TILE - 7)
  const pulse = open && !reduced ? 2 + (Math.floor(state.elapsed / 180) % 2) : 2
  ctx.strokeStyle = open ? '#d9fa69' : '#5c5348'
  ctx.lineWidth = 2
  ctx.strokeRect(sx - pulse, sy - pulse, 14 + pulse * 2, 14 + pulse * 2)
  ctx.fillStyle = open ? '#d9fa6988' : '#5c534844'
  ctx.fillRect(sx + 3, sy + 3, 8, 8)
  if (moved) { ctx.fillStyle = '#ff78a8'; ctx.fillRect(sx + 6, sy - 4, 2, 2) }
}

function drawLoot(ctx: CanvasRenderingContext2D, kind: LootKind | 'smoke', x: number, y: number, camX: number, camY: number, smoke: boolean) {
  const sx = Math.round((x - camX) * TILE)
  const sy = Math.round((y - camY) * TILE)
  if (smoke) {
    ctx.fillStyle = '#d0d8dc'
    ctx.fillRect(sx - 3, sy - 5, 6, 8)
    ctx.fillStyle = '#8aa0aa'
    ctx.fillRect(sx - 1, sy - 2, 2, 2)
    return
  }
  if (kind === 'vinyl') {
    ctx.fillStyle = '#111'
    ctx.fillRect(sx - 5, sy - 5, 10, 10)
    ctx.fillStyle = '#d9fa69'
    ctx.fillRect(sx - 2, sy - 2, 4, 4)
  } else if (kind === 'stems') {
    ctx.fillStyle = '#ff78a8'
    ctx.fillRect(sx - 5, sy - 3, 10, 6)
    ctx.fillStyle = '#1a1014'
    ctx.fillRect(sx - 1, sy - 2, 2, 4)
  } else if (kind === 'contract') {
    ctx.fillStyle = '#f0e2c4'
    ctx.fillRect(sx - 4, sy - 5, 8, 10)
    ctx.fillStyle = '#333'
    ctx.fillRect(sx - 2, sy - 3, 4, 1)
    ctx.fillRect(sx - 2, sy - 1, 4, 1)
  } else if (kind === 'merch') {
    ctx.fillStyle = '#e6d3a1'
    ctx.fillRect(sx - 5, sy - 3, 10, 8)
    ctx.fillStyle = '#1a1612'
    ctx.fillRect(sx - 2, sy - 3, 4, 2)
  } else if (kind === 'vip') {
    ctx.fillStyle = '#8aa4ff'
    ctx.fillRect(sx - 5, sy - 4, 10, 7)
    ctx.fillStyle = '#d9fa69'
    ctx.fillRect(sx - 3, sy - 2, 3, 2)
  } else {
    ctx.fillStyle = '#f4d2b4'
    ctx.fillRect(sx - 2, sy - 6, 4, 4)
    ctx.fillStyle = '#d9fa69'
    ctx.fillRect(sx - 3, sy - 2, 6, 6)
  }
}

function drawActor(ctx: CanvasRenderingContext2D, kind: Agent['kind'] | 'player', x: number, y: number, camX: number, camY: number, agent: Agent | null, state: HeistState) {
  const sx = Math.round((x - camX) * TILE)
  const sy = Math.round((y - camY) * TILE)
  const color = INK[kind]
  const hidden = kind === 'player' && state.hiddenUntil > state.elapsed
  ctx.save()
  if (hidden) ctx.globalAlpha = 0.45
  ctx.fillStyle = '#07060a'
  ctx.fillRect(sx - 7, sy - 12, 14, 20)
  ctx.fillStyle = '#111'
  ctx.fillRect(sx - 4, sy + 2, 3, 6)
  ctx.fillRect(sx + 1, sy + 2, 3, 6)
  ctx.fillStyle = color
  ctx.fillRect(sx - 5, sy - 5, 10, 9)
  ctx.fillStyle = kind === 'player' ? '#f4d2b4' : '#1a1418'
  ctx.fillRect(sx - 3, sy - 11, 7, 7)
  if (kind === 'bouncer') { ctx.fillStyle = '#1a1418'; ctx.fillRect(sx - 6, sy - 2, 12, 3) }
  if (kind === 'manager') { ctx.fillStyle = '#1a1418'; ctx.fillRect(sx - 4, sy - 1, 8, 2) }
  if (agent?.enraged || (kind !== 'player' && state.lockdown)) {
    ctx.fillStyle = '#ff5a4a'
    ctx.fillRect(sx - 5, sy - 9, 2, 2)
    ctx.fillRect(sx + 3, sy - 9, 2, 2)
  } else if (agent && agent.allyUntil > state.elapsed && !state.lockdown) {
    ctx.strokeStyle = '#d9fa69'
    ctx.strokeRect(sx - 6, sy - 10, 12, 18)
  }
  if (agent && agent.stunUntil > state.elapsed) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(sx + 5, sy - 8, 2, 2)
  }
  ctx.restore()
}

function drawDark(ctx: CanvasRenderingContext2D, state: HeistState, camX: number, camY: number, reduced: boolean) {
  const radius = LIGHT[heistStage(state.elapsed) - 1] * TILE
  const sx = (state.player.x - camX) * TILE
  const sy = (state.player.y - camY) * TILE
  const { width, height } = heistCanvasSize()
  const shade = ctx.createRadialGradient(sx, sy, radius * (reduced ? 0.55 : 0.35), sx, sy, radius)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, state.map === 'terrace' ? 'rgba(6,4,8,0.9)' : 'rgba(4,3,8,0.92)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, width, height)
  if (state.map === 'terrace') {
    ctx.strokeStyle = reduced ? '#ff78a855' : '#ff78a844'
    ctx.beginPath()
    const drift = reduced ? 0 : Math.floor(state.elapsed / 200) % 8
    ctx.moveTo(0, 20 + drift)
    ctx.lineTo(width, 70 - drift)
    ctx.moveTo(width, 16)
    ctx.lineTo(0, 100 + drift)
    ctx.stroke()
  }
}

function ping(ctx: CanvasRenderingContext2D, x: number, y: number, camX: number, camY: number, color: string) {
  const sx = Math.round((x - camX) * TILE)
  const sy = Math.round((y - camY) * TILE)
  ctx.fillStyle = color
  ctx.fillRect(sx - 1, sy - 12, 2, 4)
}

function chevron(ctx: CanvasRenderingContext2D, x: number, y: number, camX: number, camY: number) {
  const { width, height } = heistCanvasSize()
  let sx = (x - camX) * TILE
  let sy = (y - camY) * TILE
  if (sx > 8 && sy > 8 && sx < width - 8 && sy < height - 8) return
  sx = Math.max(8, Math.min(width - 8, sx))
  sy = Math.max(8, Math.min(height - 8, sy))
  ctx.fillStyle = '#d9fa69'
  ctx.fillRect(sx - 2, sy - 2, 4, 4)
}
