import { test, expect } from '@playwright/test'
import { mockSupabase } from './helpers/supabase'

test('installation instructions are accessible and a dismissed native prompt does not claim installation', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/')
  const guide = page.getByRole('button', { name: 'CÓMO INSTALAR DANZ', exact: true })
  await guide.click()
  const dialog = page.getByRole('dialog', { name: 'DANZ en tu pantalla de inicio.', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Android:', { exact: false })).toBeVisible()
  await expect(dialog.getByText('iPhone:', { exact: false })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible(); await expect(guide).toBeFocused()
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true })
    Object.assign(event, { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) })
    window.dispatchEvent(event)
  })
  await page.getByRole('button', { name: 'INSTALAR DANZ', exact: true }).click()
  await expect(guide).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')))
  await expect(guide).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
