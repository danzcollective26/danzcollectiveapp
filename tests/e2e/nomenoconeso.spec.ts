import { expect, test } from '@playwright/test'
import { menuTab, selectReel } from './consoleMenus'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('danz-yeppo-welcome-v1', 'done'); sessionStorage.setItem('danz-yeppo-visit-peek-v1', 'done') } catch { /* optional */ }
  })
})

async function openDoor(page: import('@playwright/test').Page) {
  await page.goto('/?seccion=arcade&juego=collecta')
  await menuTab(page, 'JUGAR')
  await selectReel(page, 'Modo de DANZ Collecta', 'NOMENOCONESO')
  await page.getByRole('button', { name: 'JUGAR NOME NO CON ESO', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'NOMENOCONESO', exact: true })).toBeVisible()
}

test('NomeNoConEso opens from Collecta, plays decisions, pauses and returns to the modes', async ({ page }) => {
  await openDoor(page)
  await expect(page).toHaveURL(/juego=nomenoconeso/)
  await page.getByRole('button', { name: 'ABRIR LA PUERTA →' }).click()
  const hud = page.getByRole('group', { name: 'Estado de la puerta' })
  await expect(hud).toContainText('AFORO')
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: i % 2 ? 'FUERA' : 'PASA', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: /^[✓✗]/ })).toBeVisible()
  await page.getByRole('button', { name: 'PAUSA', exact: true }).click()
  const pause = page.getByRole('dialog', { name: 'PAUSA DE PUERTA' })
  await expect(pause).toBeVisible()
  const frozen = await hud.textContent()
  await page.waitForTimeout(1300)
  expect(await hud.textContent()).toBe(frozen)
  await pause.getByRole('button', { name: 'VOLVER A LA PUERTA' }).click()
  await expect(pause).toHaveCount(0)
  await page.getByRole('button', { name: 'Volver a los modos de DANZ Collecta' }).click()
  await expect(page.getByRole('group', { name: 'Modo de DANZ Collecta', exact: true })).toBeVisible()
})

test('a full night 1 ends with a result and keeps a local record', async ({ page }) => {
  await page.clock.install()
  await openDoor(page)
  await page.getByRole('button', { name: 'ABRIR LA PUERTA →' }).click()
  for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'FUERA', exact: true }).click()
  await page.clock.runFor(115_000)
  const end = page.getByRole('dialog', { name: 'Fin de la noche' })
  await expect(end).toBeVisible()
  await expect(end).toContainText(/NOCHE SUPERADA|PARTY OVER/)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('danz-collecta-nomenoconeso-v1') ?? 'null'))
  expect(saved?.schemaVersion).toBe(1)
  expect(typeof saved?.bestScoreByNight?.['noche-01-ensayo']).toBe('number')
  expect(saved?.pointsIntent?.claim).toBe(false)
})

test('the library keeps a single Collecta entry', async ({ page }) => {
  await page.goto('/?seccion=arcade')
  await expect(page.getByText('NOMENOCONESO', { exact: false })).toHaveCount(0)
})
