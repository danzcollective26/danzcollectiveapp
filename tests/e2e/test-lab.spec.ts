import { expect, test } from '@playwright/test'

test('the mobile test route exposes three Yeppo walks and the two available games', async ({ page }) => {
  await page.goto('/test')
  const lab = page.getByRole('region', { name: 'Zona de pruebas DANZ' })
  await expect(lab).toBeVisible()
  for (const [name, move] of [['PASEO TRANQUILO','stroll'],['DE PUNTILLAS','sneak'],['A LA CARRERA','dash']]) {
    await lab.getByRole('button', { name, exact: true }).click()
    await expect(page.locator('.yeppo-roam-stage')).toHaveClass(new RegExp(`yeppo-roam-${move}`))
    await page.getByRole('button', { name: 'Cerrar aparición de Yeppo', exact: true }).click()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(lab).toContainText('Todavía no están jugables')
  await lab.getByRole('button', { name: /GROOVE NINJA PROBAR JUEGO/ }).click()
  await expect(page.locator('.gn-panel')).toHaveClass(/gn-immersive/)
  await page.getByRole('button', { name: 'Volver a la biblioteca ARCADANZ', exact: true }).click()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/test')
})
