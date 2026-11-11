import { expect, test } from '@playwright/test'
import { mockSupabase } from './helpers/supabase'

const CODE = 'DANZGUIDE12345678'

test('visual guide keeps a guest pass saved without registration and only offers an opt-in reminder', async ({ page }) => {
  await mockSupabase(page)
  await page.goto(`/#pase=${CODE}`)
  await expect(page.getByRole('heading', { name: /PASE\s*GUARDADO\./ })).toBeVisible()
  const guide = page.getByRole('region', { name: 'Hoy baila. Mañana, así de fácil.' })
  await expect(guide.getByRole('listitem')).toHaveCount(3)
  await expect(page.getByRole('region', { name: 'Guardar recordatorio' })).toHaveCount(0)
  await page.getByRole('button', { name: 'RECUÉRDAMELO MAÑANA', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Guardar recordatorio' })).toBeVisible()
  const google = new URL(await page.getByRole('link', { name: 'GOOGLE CALENDAR ↗', exact: true }).getAttribute('href') ?? '')
  expect(google.searchParams.get('details')).toContain(`#pase=${CODE}`)
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('link', { name: 'IPHONE U OTRO CALENDARIO ↓', exact: true }).click()
  expect((await downloadEvent).suggestedFilename()).toBe('DANZ-recordatorio.ics')
  expect(await page.evaluate(() => localStorage.getItem('danz-pending-event-pass'))).toBe(CODE)
  expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.reload()
  await expect(guide).toBeVisible()
  await page.getByRole('button', { name: 'CANJEAR MI PASE', exact: true }).click()
  await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('danz-pending-event-pass'))).toBe(CODE)
})
