import { expect, test } from '@playwright/test'

test('a prepared /test Arena link opens and plays a local duel without a connection', async ({ page, context }) => {
  await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError')) })
  await page.goto('/')
  await expect(page.getByText('Snake disponible sin conexión', { exact: true })).toBeVisible({ timeout: 20000 })
  await context.setOffline(true)
  await page.goto('/test?seccion=arcade&juego=arena')
  await expect(page.locator('.arena-board')).toHaveAttribute('data-ready', 'true', { timeout: 15000 })
  await page.getByRole('button', { name: 'EMPEZAR DUELO', exact: true }).click()
  await expect(page.locator('.arena-game')).toHaveAttribute('data-phase', 'playing')
  await page.getByRole('button', { name: 'P1 Soltar disco', exact: true }).click()
  await expect(page.locator('.arena-game')).toHaveAttribute('data-bombs', '1')
})
