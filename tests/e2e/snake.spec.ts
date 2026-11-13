import { expect, test, type Page } from '@playwright/test'
import { GRID, initialGame, MAZE_STAGES, mazeWalls } from '../../src/snake'

test.use({ hasTouch: true })
const arcade = (page: Page) => page.getByRole('navigation').getByRole('button', { name: 'ARCADANZ', exact: true }).click()
const headIndex = (page: Page) => page.locator('.game-board > .cell').evaluateAll(cells => cells.findIndex(cell => cell.classList.contains('head')))
const index = (x: number, y: number) => y * GRID + x
const spawn = initialGame().snake[0]
async function openArcade(page: Page) {
  // Exercise the dedicated viewport even where the native API is unavailable.
  await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError')) })
  await page.clock.install({ time: new Date('2026-11-12T08:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-12T08:00:01Z'))
  await page.goto('/')
  await arcade(page)
}

test('elegir una portada abre Snake inmersivo sin iniciar la partida', async ({ page }) => {
  await openArcade(page)
  await page.locator('.arcade-chooser').getByRole('button', { name: /LA QUE HAS LIAO, JACK/ }).click()
  await expect(page.locator('.game-panel')).toHaveClass(/is-immersive/)
  await expect(page.locator('.arcade-launch')).toBeAttached()
  await expect(page.locator('.arcade-launch-loading')).toBeVisible()
  await page.clock.runFor(3000)
  await expect(page.locator('.arcade-launch').getByRole('button', { name: 'JUGAR AHORA' })).toBeVisible()
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y))
  await page.getByRole('button', { name: /SALIR DEL JUEGO/ }).click()
  await expect(page.locator('.game-panel')).not.toHaveClass(/is-immersive/)
})

test('giro inmediato, segunda esquina en cola y pausa sin movimiento extra', async ({ page }) => {
  await openArcade(page)
  await expect(page.locator('.game-board > .cell')).toHaveCount(GRID * GRID)
  await expect(page.locator('.snake-cover figcaption')).toContainText('LA QUE HAS LIAO,')
  await expect(page.locator('.snake-cover figcaption')).toContainText('JACK')
  await page.getByRole('button', { name: /^JUGAR/ }).click()
  await page.keyboard.press('ArrowUp')
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowDown')
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
  await page.clock.runFor(240)
  expect(await headIndex(page)).toBe(index(spawn.x - 1, spawn.y - 1))
  await page.getByRole('button', { name: /^PAUSAR/ }).click()
  await page.clock.runFor(900)
  expect(await headIndex(page)).toBe(index(spawn.x - 1, spawn.y - 1))
  await page.getByRole('button', { name: /^JUGAR/ }).click()
  await page.clock.runFor(240)
  expect(await headIndex(page)).toBe(index(spawn.x - 2, spawn.y - 1))
  await page.getByRole('button', { name: 'REINICIAR', exact: true }).click()
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y))
})

test('el gesto táctil gira antes de levantar el dedo y sin desplazar la página', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Touch events via Chromium CDP')
  await openArcade(page)
  await page.getByRole('button', { name: /^JUGAR/ }).click()
  const rect = await page.locator('.game-board').boundingBox()
  expect(rect).not.toBeNull()
  const x = rect!.x + rect!.width / 2, y = rect!.y + rect!.height / 2
  const scrollY = await page.evaluate(() => window.scrollY)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 24 }] })
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 24, y: y - 24 }] })
  await page.clock.runFor(240)
  expect(await headIndex(page)).toBe(index(spawn.x - 1, spawn.y - 1))
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY)
  await cdp.detach()
})

test('botones opcionales responden al presionar y conservan la preferencia', async ({ page }) => {
  await openArcade(page)
  await expect(page.getByRole('button', { name: 'Arriba', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: /MOSTRAR BOTONES/ }).click()
  await page.reload()
  await arcade(page)
  const up = page.getByRole('button', { name: 'Arriba', exact: true })
  await expect(up).toBeVisible()
  await page.getByRole('button', { name: /^JUGAR/ }).click()
  const rect = await up.boundingBox()
  await page.mouse.move(rect!.x + rect!.width / 2, rect!.y + rect!.height / 2)
  await page.mouse.down()
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
  await page.mouse.up()
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
})

test('pantalla completa alternativa, salida con pausa y navegación restaurada', async ({ page }) => {
  await openArcade(page)
  await page.getByRole('button', { name: /^JUGAR/ }).click()
  await expect(page.locator('.game-panel')).toHaveClass(/is-immersive/)
  expect(await page.locator('body').evaluate(el => el.style.overflow)).toBe('hidden')
  await page.clock.runFor(240)
  const before = await headIndex(page)
  await page.getByRole('button', { name: /SALIR DEL JUEGO/ }).click()
  await expect(page.locator('.game-panel')).not.toHaveClass(/is-immersive/)
  expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden')
  await page.getByRole('navigation').getByRole('button', { name: 'INICIO', exact: true }).click()
  await page.clock.runFor(1500)
  await arcade(page)
  expect(await headIndex(page)).toBe(before)
  await expect(page.getByRole('button', { name: /^JUGAR/ })).toBeVisible()
})

test('ocultar la pestaña pausa y no reanuda automáticamente', async ({ page }) => {
  await openArcade(page)
  await page.getByRole('button', { name: /^JUGAR/ }).click()
  await page.clock.runFor(240)
  const before = await headIndex(page)
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.runFor(1500)
  expect(await headIndex(page)).toBe(before)
  await expect(page.getByRole('button', { name: /^JUGAR/ })).toBeVisible()
})

test('doce laberintos seleccionables conservan el recorrido al reiniciar', async ({ page }) => {
  await openArcade(page)
  await page.locator('.game-modes').getByRole('button', { name: /^LABERINTO/ }).click()
  const select = page.getByLabel('RECORRIDO', { exact: true })
  await expect(select.locator('option')).toHaveCount(MAZE_STAGES.length)
  for (let stage = 1; stage <= MAZE_STAGES.length; stage++) {
    await select.selectOption(String(stage))
    await expect(page.locator('.game-board > .wall')).toHaveCount(mazeWalls(stage).length)
    expect(await headIndex(page)).toBe(index(spawn.x, spawn.y))
  }
  await page.getByRole('button', { name: 'REINICIAR', exact: true }).click()
  await expect(select).toHaveValue(String(MAZE_STAGES.length))
  await page.locator('.game-modes').getByRole('button', { name: 'CLÁSICO', exact: true }).click()
  await expect(page.locator('.game-board > .wall')).toHaveCount(0)
})

test('cara original como objetivo y como segmento después de recogerla', async ({ page }) => {
  await openArcade(page)
  await page.getByRole('button', { name: /^JUGAR/ }).click()
  const image = page.locator('.cell.apple img')
  await expect(image).toHaveAttribute('src', '/arcade/faces/face-01-emotions-v1.webp')
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  // The next timeout is scheduled by React after each rendered movement.
  // Settle each frame instead of advancing past effects that have not run yet.
  for (let step=1;step<=4;step++) {
    await page.clock.runFor(240)
    await expect.poll(()=>headIndex(page)).toBe(index(spawn.x+step,spawn.y))
  }
  await expect(page.locator('.cell.snake[data-face="face-01"] img')).toHaveCount(1)
  await expect(page.locator('.cell.apple img')).toHaveAttribute('src', '/arcade/faces/face-02-emotions-v1.webp')
  await expect(page.locator('.cell.snake[data-face="face-01"] .snake-face-frame')).toHaveAttribute('data-expression','0')
  await expect(page.locator('.cell.apple .snake-face-frame')).toHaveAttribute('data-expression','1')
})

test('tablero y controles caben en móvil vertical y horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await openArcade(page)
  await page.getByRole('button', { name: /MOSTRAR BOTONES/ }).click()
  await page.getByRole('button', { name: /^JUGAR/ }).click()
  for (const size of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size)
    const board = await page.locator('.game-board').boundingBox()
    expect(board!.width).toBeGreaterThan(280)
    expect(board!.y).toBeGreaterThanOrEqual(0)
    expect(board!.y + board!.height).toBeLessThanOrEqual(size.height)
    const down = await page.getByRole('button', { name: 'Abajo', exact: true }).boundingBox()
    expect(down!.y + down!.height).toBeLessThanOrEqual(size.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('Idle Studio muestra una carátula provisional sin fingir que el juego está disponible',async({page})=>{
  await openArcade(page)
  const coming=page.getByRole('article',{name:'DANZ Idle Studio, próximamente',exact:true})
  await coming.scrollIntoViewIfNeeded()
  await expect(coming.getByText('Nombre y carátula provisionales.',{exact:true})).toBeVisible()
  const cover=coming.getByRole('img')
  await expect.poll(()=>cover.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0)
  await expect(coming.getByRole('button')).toHaveCount(0)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
})

test('GROOVE NINJA conserva su portada y ofrece su primera sesión de práctica',async({page})=>{
 await openArcade(page)
 const card=page.getByRole('article',{name:'GROOVE NINJA, jugar',exact:true})
 await card.scrollIntoViewIfNeeded()
 await expect(card.getByRole('heading',{name:'GROOVE NINJA.',exact:true})).toBeVisible()
 await expect(card.locator('figcaption')).toContainText('GROOVE')
 await expect.poll(()=>card.getByRole('img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0)
 await expect(card.getByRole('button',{name:'ABRIR GROOVE NINJA',exact:true})).toBeEnabled()
 await expect(card).toContainText('sonido de ensayo')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})
