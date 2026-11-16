import { launchCollecta, collectaControl } from './consoleMenus'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError'))
    localStorage.setItem('danz-yeppo-welcome-v1', 'done'); sessionStorage.setItem('danz-yeppo-visit-peek-v1', 'done')
  })
})

test('Collecta opens a real automatic opponent, freezes it in pause and returns to the unchanged duel', async ({ page }) => {
  await page.goto('/test?seccion=arcade&juego=collecta')
  await launchCollecta(page,'solo')
  await expect(page.locator('.arena-board')).toHaveAttribute('data-ready', 'true', { timeout: 15000 })
  await expect(page.locator('.arena-game')).toHaveAttribute('data-opponent', 'cpu')
  await expect(page.getByRole('button', { name: 'P2 Soltar disco', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'EMPEZAR TURNO', exact: true }).click()
  await expect.poll(() => page.locator('.arena-game').getAttribute('data-p2')).not.toBe('9,7')
  await expect.poll(async () => Number(await page.locator('.arena-game').getAttribute('data-bombs'))).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'PAUSAR', exact: true }).click()
  const before = await page.locator('.arena-game').getAttribute('data-p2')
  const elapsed = await page.locator('.arena-game').getAttribute('data-elapsed')
  await page.waitForTimeout(300)
  await expect(page.locator('.arena-game')).toHaveAttribute('data-p2', before!)
  await expect(page.locator('.arena-game')).toHaveAttribute('data-elapsed', elapsed!)
  await page.getByRole('button', { name: 'SEGUIR EL TURNO', exact: true }).click()
  await expect(page.locator('.arena-game')).toHaveAttribute('data-phase', 'playing')
  await page.keyboard.press('Escape')
  await launchCollecta(page,'arena')
  await expect(page.locator('.arena-game')).toHaveAttribute('data-opponent', 'human')
  await page.getByRole('button',{name:'EMPEZAR DUELO',exact:true}).click()
  await expect(page.getByRole('button', { name: 'P2 Soltar disco', exact: true })).toBeVisible()
})

for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
test(`solo joystick stays upright and responds at ${size.width}x${size.height}`, async ({ page }, testInfo) => {
  await page.setViewportSize(size)
  await page.goto('/test?seccion=arcade&juego=collecta')
  await collectaControl(page,1,'JOYSTICK')
    await page.goto('/test?seccion=arcade&juego=arena-solo')
    await expect(page.locator('.arena-board')).toHaveAttribute('data-ready', 'true', { timeout: 15000 })
    // Measure the layout before starting: the real CPU can win in four seconds.
    const stick = page.locator('.versus-p1 .versus-stick'), rect = (await stick.boundingBox())!
    expect(rect.width).toBe(size.width>size.height?108:96); expect(rect.height).toBe(size.width>size.height?108:96)
    expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y + rect.height).toBeLessThanOrEqual(size.height)
    const matrix = await page.locator('.versus-face').evaluate(el => getComputedStyle(el).transform)
    expect(matrix).toMatch(/^matrix\(1, 0, 0, 1,/)
    if (size.width > size.height) {
      const canvas = (await page.locator('.arena-board canvas').boundingBox())!
      expect(canvas.height).toBeGreaterThan(280)
      expect(rect.x + rect.width).toBeLessThan(canvas.x)
    }
    await page.getByRole('button',{name:'EMPEZAR TURNO',exact:true}).click()
    await expect(page.locator('.arena-game')).toHaveAttribute('data-phase','playing')
    await stick.focus(); await page.keyboard.down('ArrowRight')
    await expect.poll(() => page.locator('.arena-game').getAttribute('data-p1')).not.toBe('1,1')
    await page.keyboard.up('ArrowRight')
    await expect(stick).toHaveAttribute('data-engaged', 'false')
    await page.getByRole('button', { name: 'PAUSAR', exact: true }).click()
    await testInfo.attach(`Collecta solo ${size.width}x${size.height}`, { body: await page.screenshot(), contentType: 'image/png' })
})
}

test('arrow keys control the human in solo while L cannot force an automatic disc', async ({ page }) => {
  await page.goto('/test?seccion=arcade&juego=arena-solo')
  await page.getByRole('button', { name: 'EMPEZAR TURNO', exact: true }).click()
  await page.keyboard.down('ArrowRight')
  await expect.poll(() => page.locator('.arena-game').getAttribute('data-p1')).not.toBe('1,1')
  await page.keyboard.up('ArrowRight')
  await page.getByRole('button', { name: 'PAUSAR', exact: true }).click()
  const bombs = await page.locator('.arena-game').getAttribute('data-bombs')
  await page.keyboard.press('l')
  await expect(page.locator('.arena-game')).toHaveAttribute('data-phase', 'paused')
  await expect(page.locator('.arena-game')).toHaveAttribute('data-bombs', bombs!)
})
