import { menuTab,selectReel } from './consoleMenus'
import { expect, test, type Page } from '@playwright/test'
import { GRID, initialGame, MAZE_STAGES, mazeWalls } from '../../src/snake'

test.use({ hasTouch: true })
async function arcade(page: Page, select = true) {
  await page.getByRole('navigation').getByRole('button', { name: 'ARCADANZ', exact: true }).click()
  if (select) { await page.locator('.arcade-choice').filter({hasText:'LA QUE HAS LIAO, JACK'}).click(); await finishIntro(page) }
}
async function finishIntro(page: Page) {
  await expect(page.getByRole('button',{name:'JUGAR AHORA',exact:true})).toBeVisible()
  await page.clock.runFor(3000)
  await expect(page.getByRole('button', { name: 'JUGAR AHORA', exact: true })).toBeVisible()
}
async function playSnake(page: Page) {
  const launch = page.locator('.arcade-console-menu')
  if (await launch.isVisible()) await launch.getByRole('button',{name:'JUGAR AHORA',exact:true}).click()
  else await page.locator('.game-actions').getByRole('button',{name:/^JUGAR/}).click()
}
const headIndex = (page: Page) => page.locator('.game-board > .cell').evaluateAll(cells => cells.findIndex(cell => cell.classList.contains('head')))
const index = (x: number, y: number) => y * GRID + x
const spawn = initialGame().snake[0]
async function openArcade(page: Page, select = true) {
  // Exercise the dedicated viewport even where the native API is unavailable.
  await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError')) })
  await page.clock.install({ time: new Date('2026-11-12T08:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-12T08:00:01Z'))
  await page.goto('/')
  await arcade(page, select)
}

test('elegir una portada abre Snake inmersivo sin iniciar la partida', async ({ page }) => {
  await openArcade(page, false)
  await page.locator('.arcade-chooser').getByRole('button', { name: /LA QUE HAS LIAO, JACK/ }).click()
  await expect(page.locator('.game-panel')).toHaveClass(/is-immersive/)
  await expect(page.locator('.arcade-console-menu')).toBeAttached()
  await expect(page.getByRole('button',{name:'JUGAR AHORA',exact:true})).toBeVisible()
  await page.clock.runFor(3000)
  await expect(page.locator('.arcade-console-menu').getByRole('button', { name: 'JUGAR AHORA' })).toBeVisible()
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y))
  await page.getByRole('button', { name: 'Volver a la biblioteca ARCADANZ', exact:true }).click()
  await expect(page.locator('.game-panel')).toHaveCount(0)
})

test('giro inmediato, segunda esquina en cola y pausa sin movimiento extra', async ({ page }) => {
  await openArcade(page)
  await expect(page.locator('.game-board > .cell')).toHaveCount(GRID * GRID)
  await expect(page.locator('.snake-cover figcaption')).toContainText('LA QUE HAS LIAO,')
  await expect(page.locator('.snake-cover figcaption')).toContainText('JACK')
  await playSnake(page)
  await page.keyboard.press('W')
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowDown')
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
  await page.clock.runFor(240)
  expect(await headIndex(page)).toBe(index(spawn.x - 1, spawn.y - 1))
  await page.getByRole('button', { name: /^PAUSAR/ }).click()
  await expect(page.locator('.game-overlay-title')).toHaveText('EN PAUSA')
  await page.clock.runFor(900)
  expect(await headIndex(page)).toBe(index(spawn.x - 1, spawn.y - 1))
  await playSnake(page)
  await page.clock.runFor(240)
  expect(await headIndex(page)).toBe(index(spawn.x - 2, spawn.y - 1))
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')))
  await page.clock.runFor(500)
  expect(await headIndex(page)).toBe(index(spawn.x - 2, spawn.y - 1))
  await page.getByRole('button', { name: 'REINICIAR', exact: true }).click()
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y))
})

test('el gesto táctil gira antes de levantar el dedo y sin desplazar la página', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Touch events via Chromium CDP')
  await openArcade(page)
  await playSnake(page)
  const rect = await page.locator('.game-board').boundingBox()
  expect(rect).not.toBeNull()
  const x = rect!.x + rect!.width / 2, y = rect!.y + rect!.height / 2
  const scrollY = await page.evaluate(() => window.scrollY)
  // CDP acknowledges dispatch before Chromium necessarily delivers a coalesced
  // pointermove. Observe native delivery before advancing the paused game clock.
  await page.locator('.game-board').evaluate(board => {
    board.setAttribute('data-test-touch-moves', '0')
    board.addEventListener('pointermove', () => board.setAttribute('data-test-touch-moves', String(Number(board.getAttribute('data-test-touch-moves')) + 1)))
  })
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 24 }] })
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 24, y: y - 24 }] })
  await expect.poll(async () => Number(await page.locator('.game-board').getAttribute('data-test-touch-moves'))).toBeGreaterThanOrEqual(2)
  await page.clock.runFor(240)
  expect(await headIndex(page)).toBe(index(spawn.x - 1, spawn.y - 1))
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY)
  await cdp.detach()
})

test('botones opcionales responden al presionar y conservan la preferencia', async ({ page }) => {
  await openArcade(page)
  await expect(page.getByRole('button', { name: 'Arriba', exact: true })).toHaveCount(0)
  await menuTab(page,'AJUSTES')
  await page.getByRole('dialog').getByRole('button',{name:'BOTONES EN PANTALLA OFF',exact:true}).click()
  await menuTab(page,'JUGAR')
  await page.reload()
  await finishIntro(page)
  await playSnake(page)
  await page.locator('.game-actions').getByRole('button',{name:/^PAUSAR/}).click()
  const up = page.getByRole('button', { name: 'Arriba', exact: true })
  await expect(up).toBeVisible()
  await playSnake(page)
  const rect = await up.boundingBox()
  await page.mouse.move(rect!.x + rect!.width / 2, rect!.y + rect!.height / 2)
  await page.mouse.down()
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
  await page.mouse.up()
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
})

test('pantalla completa alternativa, salida con pausa y navegación restaurada', async ({ page }) => {
  await openArcade(page)
  await playSnake(page)
  await expect(page.locator('.game-panel')).toHaveClass(/is-immersive/)
  expect(await page.locator('body').evaluate(el => el.style.overflow)).toBe('hidden')
  await page.clock.runFor(240)
  const before = await headIndex(page)
  await page.getByRole('button', { name: /SALIR DEL JUEGO/ }).click()
  await expect(page.locator('.game-panel')).toHaveCount(0)
  expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden')
  await page.getByRole('navigation').getByRole('button', { name: 'INICIO', exact: true }).click()
  await page.clock.runFor(1500)
  await arcade(page)
  expect(await headIndex(page)).toBe(before)
  await expect(page.getByRole('dialog').getByRole('button', { name: 'JUGAR AHORA',exact:true })).toBeVisible()
})

test('ocultar la pestaña pausa y no reanuda automáticamente', async ({ page }) => {
  await openArcade(page)
  await playSnake(page)
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
  await selectReel(page,'Modo de Snake','LABERINTO')
  await expect(page.getByRole('group',{name:'Recorrido del laberinto',exact:true})).toContainText('01 / 12')
  for (let stage = 1; stage <= MAZE_STAGES.length; stage++) {
    await selectReel(page,'Recorrido del laberinto',MAZE_STAGES[stage-1])
    await expect(page.locator('.game-board > .wall')).toHaveCount(mazeWalls(stage).length)
    expect(await headIndex(page)).toBe(index(spawn.x, spawn.y))
  }
  await playSnake(page)
  await page.getByRole('button', { name: 'REINICIAR', exact: true }).click()
  await expect(page.getByLabel('RECORRIDO', {exact:true})).toHaveValue(String(MAZE_STAGES.length))
  await page.getByRole('button', {name:/SALIR DEL JUEGO/}).click()
  await page.locator('.arcade-choice').filter({hasText:'LA QUE HAS LIAO, JACK'}).click()
  await finishIntro(page)
  await selectReel(page,'Modo de Snake','CLÁSICO')
  await expect(page.locator('.game-board > .wall')).toHaveCount(0)
})

test('cara original como objetivo y como segmento después de recogerla', async ({ page }) => {
  await openArcade(page)
  await playSnake(page)
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
  await expect(page.locator('.cell.snake[data-face="face-01"]')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(page.locator('.cell.snake[data-face="face-01"]')).toHaveCSS('box-shadow', 'none')
  await expect(page.locator('.cell.apple .snake-face-frame')).toHaveAttribute('data-expression','1')
})

test('la flor y los rostros se integran sin cuadros ni sombras de casilla', async ({ page }, testInfo) => {
  await openArcade(page)
  await playSnake(page)
  const head = page.locator('.cell.head'), food = page.locator('.cell.apple')
  for (const cell of [head, food]) {
    await expect(cell).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(cell).toHaveCSS('background-image', 'none')
    await expect(cell).toHaveCSS('box-shadow', 'none')
    for (const side of ['top', 'right', 'bottom', 'left']) await expect(cell).toHaveCSS(`border-${side}-width`, '0px')
  }
  // Sample after the former food-glow animation would have painted a square.
  await page.clock.runFor(120)
  await expect(food).toHaveCSS('animation-name', 'none')
  await expect(food).toHaveCSS('box-shadow', 'none')
  expect(await food.evaluate(el => getComputedStyle(el, '::after').content)).toBe('none')
  await testInfo.attach('snake-transparent-artwork', { body: await page.screenshot(), contentType: 'image/png' })
  await page.keyboard.press('ArrowUp')
  expect(await headIndex(page)).toBe(index(spawn.x, spawn.y - 1))
  await expect(head).toHaveCSS('border-top-width', '0px')
  await expect.poll(() => head.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(food).toHaveCSS('animation-name', 'none')
})

test('tablero y controles caben en móvil vertical y horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await openArcade(page)
  await menuTab(page,'AJUSTES')
  await page.getByRole('dialog').getByRole('button',{name:'BOTONES EN PANTALLA OFF',exact:true}).click()
  await menuTab(page,'JUGAR')
  await playSnake(page)
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
  await openArcade(page, false)
  const coming=page.getByRole('article',{name:'DANZ Idle Studio, próximamente',exact:true})
  await coming.scrollIntoViewIfNeeded()
  await expect(coming).toContainText('Nombre y carátula provisionales')
  const cover=coming.getByRole('img')
  await expect.poll(()=>cover.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0)
  await expect(coming.getByRole('button')).toHaveCount(0)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
})

test('GROOVE NINJA conserva la portada aprobada y su entrada propia en la biblioteca',async({page})=>{
 await openArcade(page, false)
 const card=page.locator('.arcade-choice').filter({hasText:'GROOVE NINJA'})
 await expect(card).toBeEnabled()
 await expect(card).toContainText('Vinyl Cut + Scratch Session')
 await expect(card.locator('img')).toHaveAttribute('src','/arcade/groove-ninja-approved-mobile.webp')
 await expect.poll(()=>card.locator('img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})
