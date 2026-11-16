import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('danz-yeppo-welcome-v1', 'done')
    sessionStorage.setItem('danz-yeppo-visit-peek-v1', 'done')
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unavailable', 'NotSupportedError'))
  })
})

test('SEIS opens from the library, deals a hand and returns', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?seccion=arcade&juego=seis')
  const menu = page.getByRole('dialog', { name: 'Menú de SEIS', exact: true })
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('heading', { name: 'SEIS', exact: true })).toBeVisible()
  await menu.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  const table = page.getByRole('region', { name: 'Partida de SEIS', exact: true })
  await expect(table).toBeVisible()
  await expect(table.locator('.seis-play')).toHaveCount(7)
  const playable = table.locator('.seis-play:not([disabled])')
  if (await playable.count()) await playable.first().click()
  else await table.getByRole('button', { name: 'ROBAR', exact: true }).click()
  await expect(table.locator('.seis-yeppo')).not.toHaveText('')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await table.getByRole('button', { name: 'SALIR', exact: true }).click()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  await expect(page).not.toHaveURL(/juego=/)
})

test('the mobile lab opens the real SEIS table', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/test')
  await page.getByRole('button', { name: /PROBAR SEIS/ }).click()
  await expect(page).toHaveURL(/juego=seis/)
  await page.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  await expect(page.locator('.seis-play')).toHaveCount(7)
})
