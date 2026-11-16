import { expect, test } from '@playwright/test'

test('the mobile test route exposes three Yeppo walks and the four available games', async ({ page }) => {
  await page.goto('/test')
  const lab = page.getByRole('region', { name: 'Zona de pruebas DANZ' })
  await expect(lab).toBeVisible()
  for (const [name, move] of [['PASEO TRANQUILO','stroll'],['DE PUNTILLAS','sneak'],['A LA CARRERA','dash']]) {
    await lab.getByRole('button', { name, exact: true }).click()
    await expect(page.locator('.yeppo-roam-stage')).toHaveClass(new RegExp(`yeppo-roam-${move}`))
    const dismiss = page.getByRole('button', { name: 'Cerrar aparición de Yeppo', exact: true })
    const dismissBox = await dismiss.boundingBox()
    expect(dismissBox!.width).toBeGreaterThanOrEqual(44)
    expect(dismissBox!.height).toBeGreaterThanOrEqual(44)
    await dismiss.click()
    await expect(page.getByTestId('yeppo-walkabout')).toHaveCount(0)
  }
  const mascot = await page.getByRole('button', { name: 'Hablar con Yeppo', exact: true }).boundingBox()
  const radio = await page.getByRole('button', { name: 'Abrir hilo musical', exact: true }).boundingBox()
  expect(mascot!.y + mascot!.height).toBeLessThanOrEqual(radio!.y)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(lab.getByRole('button',{name:/04 \/ NUEVO · RACING LOCAL DANZPORTER/})).toBeVisible()
  await lab.getByRole('button', { name: /GROOVE NINJA PROBAR JUEGO/ }).click()
  await expect(page.locator('.gn-panel')).toHaveClass(/gn-immersive/)
  await page.getByRole('button', { name: 'Volver a la biblioteca ARCADANZ', exact: true }).click()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  expect(new URL(page.url()).pathname).toBe('/test')
})
