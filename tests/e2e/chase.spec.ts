import { expect, test, type Page } from '@playwright/test'
test.use({ hasTouch: true })

async function open(page: Page) {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError'))
    localStorage.setItem('danz-yeppo-welcome-v1', 'done')
  })
  await page.goto('/test?seccion=arcade&juego=pilla-pilla')
  await expect(page.locator('.chase-board')).toHaveAttribute('data-ready', 'true', { timeout: 15000 })
  await expect(page.locator('.chase-board canvas')).toHaveCount(1)
}
async function start(page: Page) {
  await open(page)
  await page.getByRole('button', { name: 'EMPEZAR PERSECUCIÓN', exact: true }).click()
  await expect(page.locator('.chase-game')).toHaveAttribute('data-phase', 'playing')
}
const position = async (page: Page, id: number) => (await page.locator('.chase-game').getAttribute(`data-p${id}`))!.split(',').map(Number)

test('Collecta has one approved complete cover and links to both local game modes', async ({ page }) => {
  await page.goto('/?seccion=arcade')
  const card = page.locator('.arcade-choice').filter({ hasText: 'DANZ COLLECTA' })
  await expect(card).toHaveCount(1)
  const cover = card.locator('img')
  await expect(cover).toHaveAttribute('src', '/arcade/collecta-mobile-v1.webp')
  await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(600)
  await expect(cover).toHaveCSS('object-fit', 'contain')
  await card.click()
  await expect(page.getByLabel('Modos de DANZ Collecta')).toBeVisible()
  await expect(page.locator('.collecta-cover img')).toHaveAttribute('src', '/arcade/collecta-mobile-v1.webp')
  await expect(page.getByText('PENDIENTE DE DESARROLLO', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /JUGAR PERSECUCIÓN/ }).click()
  await expect(page.locator('.chase-board')).toHaveAttribute('data-ready', 'true', { timeout: 15000 })
  await page.getByRole('button', { name: 'Salir de Persecución', exact: true }).click()
  await expect(page.getByLabel('Modos de DANZ Collecta')).toBeVisible()
  await page.getByRole('button', { name: /JUGAR ARENA 1 VS 1/ }).click()
  await expect(page.locator('.arena-board')).toHaveAttribute('data-ready', 'true', { timeout: 15000 })
  await page.getByRole('button', { name: 'Salir de Arena DANZ', exact: true }).click()
  await expect(page.getByLabel('Modos de DANZ Collecta')).toBeVisible()
  expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden')
})

test('keyboard pursuit around scenery captures the opponent and swaps the roles', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 })
  await start(page)
  await page.keyboard.down('a'); await page.keyboard.down('ArrowRight')
  await expect.poll(async () => (await position(page, 1))[1]).toBeLessThan(85)
  await expect.poll(async () => (await position(page, 2))[1]).toBeLessThan(85)
  await page.keyboard.up('a'); await page.keyboard.up('ArrowRight')
  await page.keyboard.down('w')
  await expect.poll(() => page.locator('.chase-game').getAttribute('data-tags'), { timeout: 6500 }).toBe('1')
  await page.keyboard.up('w')
  await expect(page.locator('.chase-game')).toHaveAttribute('data-hunter', '1')
  await expect(page.getByLabel('Capturas del jugador 1')).toHaveText('1')
  await expect(page.getByLabel('Capturas del jugador 2')).toHaveText('0')
  await page.getByRole('button', { name: 'PAUSAR', exact: true }).click()
  const before = await page.locator('.chase-game').getAttribute('data-elapsed')
  await page.waitForTimeout(200)
  expect(await page.locator('.chase-game').getAttribute('data-elapsed')).toBe(before)
})

test('native multitoch moves each player from their side and sprint does not steal the other finger', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium')
  await page.setViewportSize({ width: 844, height: 390 }); await start(page)
  const a = (await page.getByRole('button', { name: 'P1 Arriba', exact: true }).boundingBox())!
  const b = (await page.getByRole('button', { name: 'P2 Arriba', exact: true }).boundingBox())!
  const sprint = (await page.getByRole('button', { name: 'P1 Sprint', exact: true }).boundingBox())!
  const points = [{ id: 1, x: a.x+a.width/2, y: a.y+a.height/2 }, { id: 2, x: b.x+b.width/2, y: b.y+b.height/2 }]
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points })
  await expect.poll(async () => (await position(page, 1))[0]).toBeGreaterThan(120)
  await expect.poll(async () => (await position(page, 2))[0]).toBeLessThan(760)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [...points, { id: 3, x: sprint.x+sprint.width/2, y: sprint.y+sprint.height/2 }] })
  await expect(page.getByRole('button', { name: 'P1 Sprint', exact: true })).toBeDisabled()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] })
  await page.waitForTimeout(250)
  const p2 = await page.locator('.chase-game').getAttribute('data-p2')
  await page.waitForTimeout(150)
  expect(await page.locator('.chase-game').getAttribute('data-p2')).toBe(p2)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await cdp.detach()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.chase-game')).toHaveAttribute('data-phase', 'paused')
  await page.getByRole('button', { name: 'SEGUIR CORRIENDO', exact: true }).click()
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  await expect(page.locator('.chase-game')).toHaveAttribute('data-phase', 'paused')
})

test('the ten controls are at opposite ends, turn with their players and fit compact screens', async ({ page }, testInfo) => {
  await open(page)
  for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size)
    const p1 = (await page.locator('.versus-p1').boundingBox())!, p2 = (await page.locator('.versus-p2').boundingBox())!, board = (await page.locator('.chase-board').boundingBox())!
    if (size.width > size.height) {
      expect(p1.x+p1.width).toBeLessThanOrEqual(board.x); expect(p2.x).toBeGreaterThanOrEqual(board.x+board.width)
      await expect(page.locator('.versus-p1 .versus-face')).toHaveCSS('transform', /matrix\(0, 1, -1, 0,/)
      await expect(page.locator('.versus-p2 .versus-face')).toHaveCSS('transform', /matrix\(0, -1, 1, 0,/)
    } else {
      expect(p2.y+p2.height).toBeLessThanOrEqual(board.y); expect(p1.y).toBeGreaterThanOrEqual(board.y+board.height)
      await expect(page.locator('.versus-p2 .versus-face')).toHaveCSS('transform', /matrix\(-1, 0, 0, -1,/)
    }
    await expect(page.locator('.chase-controller button')).toHaveCount(10)
    for (const button of await page.locator('.chase-controller button').all()) {
      const r = (await button.boundingBox())!
      expect(r.width).toBeGreaterThanOrEqual(44); expect(r.height).toBeGreaterThanOrEqual(44)
      expect(r.x).toBeGreaterThanOrEqual(0); expect(r.x+r.width).toBeLessThanOrEqual(size.width)
      expect(r.y).toBeGreaterThanOrEqual(0); expect(r.y+r.height).toBeLessThanOrEqual(size.height)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await testInfo.attach(`Persecución ${size.width}x${size.height}`, { body: await page.screenshot(), contentType: 'image/png' })
  }
})

test('Canvas-only rendering boots with reduced motion and Escape releases the viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type: string, ...args: unknown[]) { return type.includes('webgl') ? null : Reflect.apply(original, this, [type, ...args]) } as typeof original
  })
  await start(page)
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Modos de DANZ Collecta')).toBeVisible()
  expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden')
  await expect(page.locator('.chase-board canvas')).toHaveCount(0)
})
