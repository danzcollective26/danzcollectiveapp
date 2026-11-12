import { expect, test, type Page } from '@playwright/test'
test.use({ hasTouch: true })

async function openGroove(page: Page) {
  await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError')) })
  await page.clock.install({ time: new Date('2026-11-12T15:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-12T15:00:01Z'))
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  await expect(page.getByRole('heading', { name: 'GROOVE NINJA.', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'SONIDO ON', exact: true }).click()
}
async function start(page: Page) {
  await page.getByRole('button', { name: 'JUGAR GROOVE NINJA ↗', exact: true }).click()
  await page.clock.runFor(700)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'playing')
}
async function target(page: Page) {
  const rect = await page.locator('.gn-board').boundingBox()
  const disc = await page.locator('.gn-vinyl').first().evaluate(el => ({ x: Number(el.getAttribute('data-x')), y: Number(el.getAttribute('data-y')) }))
  return { x: rect!.x + disc.x * rect!.width / 640, y: rect!.y + disc.y * rect!.height / 760, dx: 95 * rect!.width / 640 }
}
async function slice(page: Page) {
  const p = await target(page)
  await page.mouse.move(p.x - p.dx, p.y); await page.mouse.down(); await page.mouse.move(p.x + p.dx, p.y, { steps: 1 }); await page.mouse.up()
}

test('a fast swipe cuts immediately, splits a vinyl and advances its streak exactly once', async ({ page }) => {
  await openGroove(page); await start(page); await slice(page)
  await expect(page.getByTestId('groove-score')).toHaveText('00100')
  await expect(page.locator('.gn-cut-pieces')).toHaveCount(1)
  await expect(page.getByRole('meter', { name: 'Racha de la sesión' })).toHaveAttribute('aria-valuenow', '1')
  await page.clock.runFor(900)
  await expect(page.locator('.gn-cut-pieces')).toHaveCount(0)
  await expect(page.getByTestId('groove-score')).toHaveText('00100')
})
test('touchmove scores before touchend and cannot scroll the play surface', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium')
  await openGroove(page); await start(page)
  const p = await target(page), before = await page.evaluate(() => window.scrollY)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x - p.dx, y: p.y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x + p.dx, y: p.y }] })
  await expect(page.getByTestId('groove-score')).toHaveText('00100')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect(await page.evaluate(() => window.scrollY)).toBe(before)
  await cdp.detach()
})
test('pause, tab hiding and exit freeze play; local record and sound choice survive reload', async ({ page }) => {
  await openGroove(page); await start(page); await slice(page)
  await page.getByRole('button', { name: 'PAUSAR ↗', exact: true }).click()
  const board = await page.locator('.gn-board').getAttribute('aria-label')
  await page.clock.runFor(6000)
  await expect(page.locator('.gn-board')).toHaveAttribute('aria-label', board!)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'paused')
  await page.getByRole('button', { name: 'REANUDAR ↗', exact: true }).click()
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'paused')
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await expect(page.locator('.gn-panel')).not.toHaveClass(/gn-immersive/)
  expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden')
  await page.reload()
  await expect(page.getByRole('button', { name: 'SONIDO OFF', exact: true })).toBeVisible()
  await expect(page.locator('.gn-bottom')).toContainText('RÉCORD LOCAL 100')
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'ready')
})
test('scratch is earned through three pointer reversals without releasing', async ({ page }) => {
  await openGroove(page)
  await page.locator('.gn-mode-picker').getByRole('button', { name: /^SCRATCH SESSION/ }).click()
  await start(page)
  await expect(page.locator('.gn-scratch')).toBeVisible()
  const previous = Number(await page.getByTestId('groove-score').textContent())
  const rect = await page.locator('.gn-board').boundingBox()
  const x = (n: number) => rect!.x + n * rect!.width / 640, y = rect!.y + 355 * rect!.height / 760
  await page.mouse.move(x(260), y); await page.mouse.down()
  for (const n of [340, 260, 340]) await page.mouse.move(x(n), y, { steps: 1 })
  await expect(page.locator('.gn-scratch')).toHaveAttribute('data-turns', '2')
  await page.mouse.move(x(260), y, { steps: 1 })
  await expect(page.locator('.gn-scratch')).toHaveCount(0)
  await page.mouse.up()
  expect(Number(await page.getByTestId('groove-score').textContent())).toBeGreaterThan(previous)
  await expect(page.getByRole('status').filter({ hasText: 'SCRATCH LIMPIO' })).toBeVisible()
})
test('playfield, mixer and primary controls fit 320px portrait and short landscape', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await openGroove(page); await start(page)
  for (const size of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size)
    for (const selector of ['.gn-top', '.gn-hud', '.gn-play-area', '.gn-flow', '.gn-actions']) {
      const r = await page.locator(selector).boundingBox()
      expect(r!.x).toBeGreaterThanOrEqual(0); expect(r!.y).toBeGreaterThanOrEqual(0)
      expect(r!.x + r!.width).toBeLessThanOrEqual(size.width + 1); expect(r!.y + r!.height).toBeLessThanOrEqual(size.height + 1)
    }
    const r = await page.locator('.gn-board').boundingBox()
    expect(Math.abs(r!.width / r!.height - 640 / 760)).toBeLessThan(.01)
  }
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'paused')
})
test('browser back and forward restore the selected game and never reset Snake mode', async ({ page }) => {
  await openGroove(page)
  await page.getByRole('button', { name: '← VOLVER A ARCADANZ', exact: true }).click()
  await page.locator('.game-modes').getByRole('button', { name: /^LABERINTO/ }).click()
  await page.getByLabel('RECORRIDO', { exact: true }).selectOption('8')
  await page.getByRole('button', { name: 'GROOVE NINJA ↗', exact: true }).click()
  await expect(page.locator('.gn-panel')).toBeVisible()
  await page.goBack()
  await expect(page.getByLabel('RECORRIDO', { exact: true })).toHaveValue('8')
  await page.goForward()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'ready')
  await page.getByRole('navigation').getByRole('button', { name: 'INICIO', exact: true }).click()
  await expect(page).not.toHaveURL(/juego=/)
})
test('an unattended session ends with PARTY OVER and offers a clean new session', async ({ page }) => {
  await openGroove(page); await start(page)
  await page.clock.runFor(12_000)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'over')
  await expect(page.getByText('PARTY OVER', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'OTRA SESIÓN ↗', exact: true }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'playing')
  await expect(page.getByTestId('groove-score')).toHaveText('00000')
  await expect(page.locator('.gn-board')).toHaveAttribute('aria-label', 'Cabina de Groove Ninja, 0 cortes, 0 scratches, 5 vidas')
})
test('audio starts only from play, suspends on pause and closes when leaving the game', async ({ page }) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError'))
    const original = window.AudioContext
    ;(window as any).__grooveContexts = []
    window.AudioContext = class extends original {
      constructor(options?: AudioContextOptions) { super(options); (window as any).__grooveContexts.push(this) }
    }
  })
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  await expect(page.getByRole('button', { name: 'JUGAR GROOVE NINJA ↗', exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as any).__grooveContexts.length)).toBe(0)
  await page.getByRole('button', { name: 'JUGAR GROOVE NINJA ↗', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__grooveContexts[0]?.state)).toBe('running')
  await page.getByRole('button', { name: 'PAUSAR ↗', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__grooveContexts[0]?.state)).toBe('suspended')
  await page.getByRole('button', { name: 'REANUDAR ↗', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__grooveContexts[0]?.state)).toBe('running')
  expect(await page.evaluate(() => (window as any).__grooveContexts.length)).toBe(1)
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await page.getByRole('button', { name: '← VOLVER A ARCADANZ', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__grooveContexts[0]?.state)).toBe('closed')
})
test('changing modes starts the selected challenge and keeps each local record separate', async ({ page }) => {
  await openGroove(page); await start(page); await slice(page)
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await page.locator('.gn-mode-picker').getByRole('button', { name: /^SCRATCH SESSION/ }).click()
  await expect(page.locator('.gn-bottom')).toContainText('RÉCORD LOCAL 0')
  await start(page)
  await expect(page.locator('.gn-vinyl')).toHaveCount(0)
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowRight', 'ArrowLeft']) await page.keyboard.press(key)
  await expect(page.getByTestId('groove-score')).toHaveText('00400')
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await expect(page.locator('.gn-bottom')).toContainText('RÉCORD LOCAL 400')
  await page.locator('.gn-mode-picker').getByRole('button', { name: /^VINYL CUT/ }).click()
  await expect(page.locator('.gn-bottom')).toContainText('RÉCORD LOCAL 100')
  await expect(page.getByTestId('groove-score')).toHaveText('00000')
})
