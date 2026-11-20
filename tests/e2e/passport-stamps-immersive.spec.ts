import { expect, test, type Page } from '@playwright/test'
import { installMockSession, mockSupabase, supabaseHost } from './helpers/supabase'

// These cases intentionally use the immersive reader: the event-code form lives in DANZERS,
// while confirmed server stamps live on individual reader pages.
const EA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const EB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const stamp = (id: string, title: string, event_status: string) => ({
  event_id: id, title, event_status,
  starts_at: '2026-11-08T22:00:00Z', granted_at: '2026-11-09T01:00:00Z',
})
const reader = (page: Page) => page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })
async function next(page: Page) {
  const window = reader(page).getByLabel('Desliza horizontalmente o usa las flechas para pasar las páginas')
  await window.focus()
  await window.press('ArrowRight')
}

test('immersive passport shows only server-confirmed event stamps, including archived gallery', async ({ page }) => {
  await installMockSession(page)
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({
    json: [stamp(EA, 'Noche confirmada', 'published'), stamp(EB, 'Recuerdo archivado', 'archived')],
  }))
  await page.goto('/?seccion=pasaporte')
  await expect(reader(page)).toBeVisible()
  await expect(reader(page).getByRole('heading', { name: 'PASAPORTE', exact: true })).toBeVisible()
  await expect(page.locator('header.topbar')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Pasar páginas del pasaporte' })).toHaveCount(0)
  await next(page)
  await expect(reader(page).getByText('VIAJES')).toBeVisible()
  await next(page)
  await expect(reader(page).getByRole('heading', { name: 'Noche confirmada' })).toBeVisible()
  await expect(reader(page).getByRole('button', { name: 'ABRIR GALERÍA DEL VIAJE' })).toBeVisible()
  await next(page)
  await expect(reader(page).getByRole('heading', { name: 'Recuerdo archivado' })).toBeVisible()
  await expect(reader(page).getByRole('button', { name: 'ABRIR GALERÍA DEL VIAJE' })).toBeVisible()
  await next(page)
  await expect(reader(page).getByRole('heading', { name: /LA PRÓXIMA/ })).toBeVisible()
  await expect(reader(page).getByText('ASISTENCIA CONFIRMADA')).toHaveCount(0)
})

test('guest passport never invents attendance and offers account access', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/?seccion=pasaporte')
  await expect(reader(page)).toBeVisible()
  await next(page)
  await expect(reader(page).getByText('AL REGISTRARTE').first()).toBeVisible()
  await expect(reader(page).getByRole('button', { name: 'INICIAR SESIÓN' })).toBeVisible()
  await next(page)
  await expect(reader(page).getByRole('heading', { name: /LA PRÓXIMA/ })).toBeVisible()
  await expect(reader(page).getByText('ASISTENCIA CONFIRMADA')).toHaveCount(0)
  await reader(page).getByRole('button', { name: 'INICIAR SESIÓN' }).count().then(count => expect(count).toBe(0))
  await page.getByRole('button', { name: 'Cerrar pasaporte y volver a la pantalla anterior' }).click()
  await expect(reader(page)).toHaveCount(0)
})
