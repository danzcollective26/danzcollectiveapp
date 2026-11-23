import { expect, test } from '@playwright/test'
import { mockSupabase } from './helpers/supabase'

test('opening Cuenta from Inicio dismisses any Yeppo welcome before the login form', async ({ page }) => {
  await mockSupabase(page)
  await page.addInitScript(() => {
    localStorage.setItem('danz-yeppo-enabled-v1', 'true')
    localStorage.removeItem('danz-yeppo-welcome-v1')
  })
  await page.goto('/')
  const more = page.getByRole('button', { name: 'Más secciones', exact: true })
  if (await more.isVisible()) {
    await more.click()
    await expect(page.getByRole('region', { name: 'Más secciones de DANZ' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Yeppo te presenta DANZ' })).toHaveCount(0)
    await page.getByRole('region', { name: 'Más secciones de DANZ' })
      .getByRole('button', { name: /MI CUENTA/ }).click()
  } else {
    await page.getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('button', { name: 'CUENTA', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'TU CUENTA.' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Yeppo te presenta DANZ' })).toHaveCount(0)
  await expect(page.locator('.yeppo')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'ENVIAR ENLACE', exact: true })).toBeEnabled()
})
