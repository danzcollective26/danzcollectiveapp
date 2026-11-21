import { expect, test } from '@playwright/test'
import { mockSupabase } from './helpers/supabase'

// Contract for every AI: no inline passport page arrows; all journeys use one immersive reader.
// Public guest routes make this regression test independent of private account data.
test('DANZERS opens the same full-screen passport and returns to the event section', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/?seccion=danzers')
  const open = page.getByRole('button', { name: 'Abrir el pasaporte DANZ a pantalla completa' })
  await expect(open).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pasar páginas del pasaporte' })).toHaveCount(0)
  await open.click()
  await expect(page).toHaveURL(/seccion=pasaporte/)
  const dialog = page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.danz-travel-immersive')).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pasar páginas del pasaporte' })).toHaveCount(0)
  await expect(page.locator('header.topbar')).toHaveCount(0)
  const fits = await dialog.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return Math.abs(rect.top) < 2 && Math.abs(rect.left) < 2 &&
      Math.abs(rect.width - window.innerWidth) < 2 &&
      Math.abs(rect.height - window.innerHeight) < 2
  })
  expect(fits).toBe(true)
  await dialog.getByRole('button', { name: 'Cerrar pasaporte y volver a la pantalla anterior' }).click()
  await expect(page).toHaveURL(/seccion=danzers/)
  await expect(open).toBeVisible()
})

test('home passport teaser opens the immersive reader without legacy page arrows', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir mi Pasaporte DANZ y ver mis sellos' }).click()
  await expect(page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Pasar páginas del pasaporte' })).toHaveCount(0)
})
