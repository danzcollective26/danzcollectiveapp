import { expect, test } from '@playwright/test'
import { installMockSession, mockSupabase, supabaseHost, switchMockSession, USER_A, USER_B } from './helpers/supabase'

const CODE = 'DANZACCESSA123456'
const PENDING = 'danz-pending-event-pass'
const EA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const EB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const stamp = (id: string, title: string, event_status = 'published') => ({ event_id: id, title, starts_at: '2026-11-08T22:00:00Z', event_status, granted_at: '2026-11-09T01:00:00Z' })
const openPassport = async (page: import('@playwright/test').Page) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'DANZERS', exact: true }).click()
}

test('a guest QR pass is removed from the URL, survives reload and is kept before sign-in', async ({ page }) => {
  await mockSupabase(page)
  const redemptions: string[] = []
  page.on('request', request => { if (request.url().includes('/rpc/danz_redeem_event_code')) redemptions.push(request.url()) })
  await page.goto('/#pase=danz-access-a123456')
  await expect(page.getByLabel('CÓDIGO DEL EVENTO', { exact: true })).toHaveValue(CODE)
  await expect(page).toHaveURL(/\/$/)
  await page.reload()
  await expect(page.getByLabel('CÓDIGO DEL EVENTO', { exact: true })).toHaveValue(CODE)
  await page.getByRole('button', { name: 'GUARDAR PASE EN ESTE MÓVIL', exact: true }).click()
  await expect(page.getByText('Pase guardado en este móvil.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'INICIAR SESIÓN', exact: true }).click()
  await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ABRIR MI PASE ↗', exact: true })).toBeVisible()
  expect(redemptions).toEqual([])
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBe(CODE)
  await page.goto('/#pase=SECONDACCESS1234')
  await expect(page.getByLabel('CÓDIGO DEL EVENTO', { exact: true })).toHaveValue('SECONDACCESS1234')
  await expect(page).toHaveURL(/\/$/)
  await page.getByRole('button', { name: 'DESCARTAR PASE PENDIENTE', exact: true }).click()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBeNull()
})

test('server redemption refreshes the passport and opens the matching gallery', async ({ page }) => {
  await installMockSession(page)
  let granted = false
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({ json: granted ? [stamp(EA, 'Noche del sello'), stamp(EB, 'Otra noche')] : [stamp(EB, 'Otra noche')] }))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, async route => {
    expect(route.request().postDataJSON()).toEqual({ p_code: CODE })
    granted = true
    await route.fulfill({ json: [{ status: 'granted', event_id: EA, granted_at: '2026-11-09T01:00:00Z' }] })
  })
  await page.route(`${supabaseHost}/rest/v1/danz_events**`, route => route.fulfill({ json: [{ id: EB, title: 'Otra noche', starts_at: null }, { id: EA, title: 'Noche del sello', starts_at: null }] }))
  await page.route(`${supabaseHost}/rest/v1/danz_photos**`, route => route.fulfill({ json: [] }))
  await openPassport(page)
  await expect(page.getByRole('heading', { name: 'Mis sellos (1)', exact: true })).toBeVisible()
  await page.getByLabel('CÓDIGO DEL EVENTO', { exact: true }).fill('danz-access-a123456')
  await page.getByRole('button', { name: 'GUARDAR MI SELLO', exact: true }).click()
  await expect(page.getByText('¡Sello guardado!', { exact: false })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Mis sellos (2)', exact: true })).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBeNull()
  await page.getByRole('listitem').filter({ hasText: 'Noche del sello' }).getByRole('button', { name: 'ABRIR GALERÍA ↗', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Noche del sello', exact: true })).toBeVisible()
})

test('unavailable, throttled and failed canjes retain the pass for a safe retry', async ({ page }) => {
  await installMockSession(page)
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({ json: [] }))
  let result = 'unavailable'
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, route => result === 'network' ? route.abort('failed') : route.fulfill({ json: [{ status: result, event_id: null, granted_at: null }] }))
  await openPassport(page)
  await page.getByLabel('CÓDIGO DEL EVENTO', { exact: true }).fill(CODE)
  for (const [status, message] of [['unavailable', 'Este código no está disponible.'], ['rate_limited', 'Espera diez minutos'], ['network', 'No hemos podido confirmar el canje.']]) {
    result = status
    await page.getByRole('button', { name: 'GUARDAR MI SELLO', exact: true }).click()
    await expect(page.getByText(message, { exact: false })).toBeVisible()
    expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBe(CODE)
  }
})

test('archived stamps remain visible while the gallery button is withheld; retry recovers fetch errors', async ({ page }) => {
  await installMockSession(page)
  let fail = true
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => fail ? route.fulfill({ status: 503, json: { message: 'Synthetic failure' } }) : route.fulfill({ json: [stamp(EA, 'Recuerdo permanente', 'archived')] }))
  await openPassport(page)
  await expect(page.getByText('No hemos podido cargar tus sellos.', { exact: false })).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'ACTUALIZAR SELLOS', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Recuerdo permanente', exact: true })).toBeVisible()
  await expect(page.getByText('El sello se conserva.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ABRIR GALERÍA ↗', exact: true })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('switching accounts and signing out clears stamps; a late redemption cannot restore them', async ({ page }) => {
  await installMockSession(page)
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, async route => {
    // Resolve the synthetic JWT rather than infer authorization from UI state.
    const payload = JSON.parse(Buffer.from(route.request().headers().authorization!.split('.')[1], 'base64url').toString()) as { sub: string }
    await route.fulfill({ json: [payload.sub === USER_A ? stamp(EA, 'Solo cuenta A') : stamp(EB, 'Solo cuenta B')] })
  })
  let release!: () => void
  let requested = false
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, async route => {
    requested = true
    await pending
    await route.fulfill({ json: [{ status: 'granted', event_id: EA, granted_at: '2026-11-09T01:00:00Z' }] }).catch(() => {})
  })
  await openPassport(page)
  await expect(page.getByRole('heading', { name: 'Solo cuenta A', exact: true })).toBeVisible()
  await page.getByLabel('CÓDIGO DEL EVENTO', { exact: true }).fill(CODE)
  await page.getByRole('button', { name: 'GUARDAR MI SELLO', exact: true }).click()
  await expect.poll(() => requested).toBe(true)
  await switchMockSession(page, USER_B)
  await expect(page.getByRole('heading', { name: 'Solo cuenta B', exact: true })).toBeVisible()
  release()
  await expect(page.getByRole('heading', { name: 'Solo cuenta A', exact: true })).toHaveCount(0)
  await expect(page.getByText('¡Sello guardado!', { exact: false })).toHaveCount(0)
  await switchMockSession(page, null)
  await expect(page.getByRole('button', { name: 'INICIAR SESIÓN', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Solo cuenta B', exact: true })).toHaveCount(0)
})
