import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('danz-yeppo-welcome-v1', 'done')
    sessionStorage.setItem('danz-yeppo-visit-peek-v1', 'done')
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unavailable', 'NotSupportedError'))
  })
})

test('manager heist opens from the library, moves, pauses and returns', async ({ page }) => {
  await page.goto('/?seccion=arcade')
  await page.locator('.arcade-choice').filter({ hasText: 'MANAGER HEIST' }).click()
  await expect(page).toHaveURL(/juego=manager-heist/)
  await expect(page.getByRole('dialog', { name: 'Menú de MANAGER HEIST' })).toBeVisible()
  await page.getByRole('button', { name: 'ENTRAR AL AFTER' }).click()
  const game = page.locator('.heist-game')
  await expect(game).toHaveAttribute('data-phase', 'playing')
  const before = Number(await game.getAttribute('data-x'))
  await page.keyboard.down('d')
  await expect.poll(async () => Number(await game.getAttribute('data-x'))).toBeGreaterThan(before + 0.4)
  await page.keyboard.up('d')
  await page.getByRole('button', { name: 'PAUSAR' }).click()
  await expect(game).toHaveAttribute('data-phase', 'paused')
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  expect(await page.locator('body').evaluate(element => element.style.overflow)).not.toBe('hidden')
})

test('the test route can open manager heist without a horizontal overflow', async ({ page }) => {
  await page.goto('/test')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: /MANAGER HEIST/ }).click()
  await expect(page).toHaveURL(/juego=manager-heist/)
  await expect(page.getByRole('button', { name: 'ENTRAR AL AFTER' })).toBeVisible()
})
