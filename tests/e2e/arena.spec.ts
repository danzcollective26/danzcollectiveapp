import { launchCollecta } from './consoleMenus'
import { expect, test, type Page } from '@playwright/test'
test.use({ hasTouch: true })

async function open(page: Page) {
  await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError')) })
  await page.goto('/test?seccion=arcade&juego=arena')
  await expect(page.locator('.arena-board')).toHaveAttribute('data-ready', 'true', { timeout: 15000 })
  await expect(page.locator('.arena-board canvas')).toHaveCount(1)
}
async function start(page: Page) {
  await open(page)
  await page.getByRole('button', { name: 'EMPEZAR DUELO', exact: true }).click()
  await expect(page.locator('.arena-game')).toHaveAttribute('data-phase', 'playing')
}

test('Arena is reachable from /test and the library, with its own local duel', async ({ page }) => {
  await page.goto('/test')
  await page.getByRole('button', { name: /DANZ COLLECTA.*PROBAR LOS MODOS/ }).click()
  await expect(page.getByRole('dialog',{name:'Menú de DANZ COLLECTA',exact:true})).toBeVisible()
  await launchCollecta(page,'arena')
  await expect(page.locator('.arena-board')).toHaveAttribute('data-ready', 'true', { timeout: 15000 })
  await page.getByRole('button', { name: 'Salir de Arena DANZ', exact: true }).click()
  await expect(page.getByRole('dialog',{name:'Menú de DANZ COLLECTA',exact:true})).toBeVisible()
  await page.getByRole('button', { name: 'Volver a la biblioteca ARCADANZ', exact: true }).click()
  await page.locator('.arcade-choice').filter({ hasText: 'DANZ COLLECTA' }).click()
  await launchCollecta(page,'arena')
  await expect(page.getByRole('button', { name: 'EMPEZAR DUELO', exact: true })).toBeEnabled({ timeout: 15000 })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog',{name:'Menú de DANZ COLLECTA',exact:true})).toBeVisible()
  expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden')
})

test('keyboard movement, live timer, self-elimination and next round work end to end', async ({ page }) => {
  await start(page)
  await page.keyboard.down('d')
  await expect.poll(() => page.locator('.arena-game').getAttribute('data-p1')).not.toBe('1,1')
  await page.keyboard.up('d')
  await page.keyboard.press('f')
  await expect(page.locator('.arena-game')).toHaveAttribute('data-bombs', '1')
  await expect.poll(async () => Number(await page.locator('.arena-game').getAttribute('data-elapsed'))).toBeGreaterThan(1000)
  await expect(page.locator('.arena-game')).toHaveAttribute('data-phase', 'round-over', { timeout: 7000 })
  await expect(page.getByLabel('Victorias del jugador 2')).toHaveText('1/3')
  await page.getByRole('button', { name: 'SIGUIENTE RONDA', exact: true }).click()
  await expect(page.locator('.arena-game')).toHaveAttribute('data-round', '2')
  await expect(page.locator('.arena-game')).toHaveAttribute('data-p1', '1,1')
  await expect(page.locator('.arena-game')).toHaveAttribute('data-bombs', '0')
})

test('two native fingers control both players while a third drops a disc', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Native touch through CDP')
  await page.setViewportSize({ width: 844, height: 390 })
  await start(page)
  const a = await page.getByRole('button', { name: 'P1 Arriba', exact: true }).boundingBox()
  const b = await page.getByRole('button', { name: 'P2 Arriba', exact: true }).boundingBox()
  const disc = await page.getByRole('button', { name: 'P1 Soltar disco', exact: true }).boundingBox()
  const points = [{ x: a!.x + a!.width / 2, y: a!.y + a!.height / 2, id: 1 }, { x: b!.x + b!.width / 2, y: b!.y + b!.height / 2, id: 2 }]
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points })
  await expect.poll(() => page.locator('.arena-game').getAttribute('data-p1')).not.toBe('1,1')
  await expect.poll(() => page.locator('.arena-game').getAttribute('data-p2')).not.toBe('9,7')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [...points, { x: disc!.x + disc!.width / 2, y: disc!.y + disc!.height / 2, id: 3 }] })
  await expect.poll(async () => Number(await page.locator('.arena-game').getAttribute('data-bombs'))).toBeGreaterThan(0)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await cdp.detach()
})

test('pausing and hiding the tab freeze the round until an explicit resume', async ({ page }) => {
  await start(page)
  await expect.poll(async () => Number(await page.locator('.arena-game').getAttribute('data-elapsed'))).toBeGreaterThan(200)
  await page.getByRole('button', { name: 'PAUSAR', exact: true }).click()
  const before = await page.locator('.arena-game').getAttribute('data-elapsed')
  await page.waitForTimeout(250)
  expect(await page.locator('.arena-game').getAttribute('data-elapsed')).toBe(before)
  await page.getByRole('button', { name: 'SEGUIR EL DUELO', exact: true }).click()
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  await expect(page.locator('.arena-game')).toHaveAttribute('data-phase', 'paused')
  await expect(page.getByRole('button', { name: 'SEGUIR EL DUELO', exact: true })).toBeVisible()
})

test('all ten touch controls fit compact portrait and landscape at least 44px', async ({ page }, testInfo) => {
  await open(page)
  for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size)
    for (const button of await page.locator('.arena-controller button').all()) {
      const box = await button.boundingBox()
      expect(box!.width).toBeGreaterThanOrEqual(44)
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.y + box!.height).toBeLessThanOrEqual(size.height)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const board = await page.locator('.arena-board canvas').boundingBox()
    expect(board!.width).toBeGreaterThan(200)
    expect(board!.y).toBeGreaterThanOrEqual(0)
    const p1 = (await page.locator('.versus-p1').boundingBox())!, p2 = (await page.locator('.versus-p2').boundingBox())!
    if (size.width > size.height) { expect(p1.x+p1.width).toBeLessThanOrEqual(board!.x); expect(p2.x).toBeGreaterThanOrEqual(board!.x+board!.width) }
    else { expect(p2.y+p2.height).toBeLessThanOrEqual(board!.y); expect(p1.y).toBeGreaterThanOrEqual(board!.y+board!.height) }
    const title = (await page.locator('.arena-top strong').boundingBox())!, clock = (await page.locator('.arena-round > strong').boundingBox())!
    const overlaps = title.x < clock.x+clock.width && title.x+title.width > clock.x && title.y < clock.y+clock.height && title.y+title.height > clock.y
    expect(overlaps).toBe(false)
    await testInfo.attach(`Arena ${size.width}x${size.height}`, { body: await page.screenshot(), contentType: 'image/png' })
  }
})

test('the procedural arena also boots when the browser only supports Canvas 2D', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      return type.includes('webgl') ? null : Reflect.apply(original, this, [type, ...args])
    } as typeof original
  })
  await start(page)
  await page.getByRole('button', { name: 'P1 Soltar disco', exact: true }).click()
  await expect(page.locator('.arena-game')).toHaveAttribute('data-bombs', '1')
})
