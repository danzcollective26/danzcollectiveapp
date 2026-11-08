import { test, expect, type Page } from '@playwright/test'
import { installMockSession, mockSupabase, supabaseHost, switchMockSession, USER_B } from './helpers/supabase'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')
const EVENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const EVENT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const events = [
  { id: EVENT_A, title: 'Fiesta privada de prueba', starts_at: '2026-11-09T20:00:00Z' },
  { id: EVENT_B, title: 'Segunda fiesta privada', starts_at: '2026-11-10T20:00:00Z' },
]
const firstPath = `${EVENT_A}/first-private.png`
const secondPath = `${EVENT_B}/second-private.png`

async function openPrivateGallery(page: Page) {
  await page.goto('/')
  await page.getByRole('navigation').getByRole('button', { name: 'Fotos', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Galerías privadas', exact: true })).toHaveAttribute('aria-pressed', 'true')
}

async function installGallery(page: Page) {
  await installMockSession(page)
  await page.route(`${supabaseHost}/rest/v1/danz_events**`, async (route) => {
    expect(new URL(route.request().url()).searchParams.get('status')).toBe('eq.published')
    await route.fulfill({ json: events })
  })
  await page.route(`${supabaseHost}/rest/v1/danz_photos**`, async (route) => {
    const query = new URL(route.request().url()).searchParams
    expect(query.get('status')).toBe('eq.published')
    const event = query.get('event_id')
    expect([`eq.${EVENT_A}`, `eq.${EVENT_B}`]).toContain(event)
    await route.fulfill({ json: [{ id: event === `eq.${EVENT_A}` ? 'first-photo' : 'second-photo', storage_path: event === `eq.${EVENT_A}` ? firstPath : secondPath }] })
  })
  await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos`, async (route) => {
    const body = route.request().postDataJSON() as { paths: string[]; expiresIn: number }
    expect(body.expiresIn).toBe(60)
    await route.fulfill({ json: body.paths.map((path) => ({ path, error: null, signedURL: `/object/sign/danz-event-photos/${path}?token=synthetic-private-token` })) })
  })
  await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos/**`, (route) => route.fulfill({ contentType: 'image/png', headers: { 'cache-control': 'no-store' }, body: png }))
}

test('private galleries require signing in and do not query event data for guests', async ({ page }) => {
  await mockSupabase(page)
  let requestedEvents = false
  page.on('request', (request) => { if (request.url().includes('/rest/v1/danz_events')) requestedEvents = true })
  await openPrivateGallery(page)
  await expect(page.getByText('Inicia sesión para consultar las galerías a las que tienes acceso.', { exact: true })).toBeVisible()
  expect(requestedEvents).toBe(false)
  await page.getByRole('button', { name: 'INICIAR SESIÓN', exact: true }).click()
  await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeVisible()
})

test('authorized events use short-lived private URLs; viewer and blob download work', async ({ page }) => {
  await installGallery(page)
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await openPrivateGallery(page)
  await expect(page.getByRole('heading', { name: events[0].title, exact: true })).toBeVisible()
  const thumbnail = page.getByRole('button', { name: 'Abrir foto privada 1', exact: true })
  await expect(thumbnail).toBeVisible()
  await expect(thumbnail.locator('img')).toHaveAttribute('src', new RegExp('/object/sign/danz-event-photos/'))
  await thumbnail.click()
  const viewer = page.getByRole('dialog', { name: `Foto privada de ${events[0].title}` })
  await expect(viewer).toBeVisible()
  const close = viewer.getByRole('button', { name: 'Cerrar foto privada', exact: true })
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(viewer.getByRole('button', { name: 'DESCARGAR FOTO', exact: true })).toBeFocused()
  const downloaded = page.waitForEvent('download')
  await viewer.getByRole('button', { name: 'DESCARGAR FOTO', exact: true }).click()
  expect((await downloaded).suggestedFilename()).toBe('first-private.png')
  await page.keyboard.press('Escape')
  await expect(viewer).not.toBeVisible()
  await expect(thumbnail).toBeFocused()
  await page.getByRole('button', { name: new RegExp(events[1].title) }).click()
  await expect(page.getByRole('heading', { name: events[1].title, exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abrir foto privada 1', exact: true }).locator('img')).toHaveAttribute('src', new RegExp('second-private.png'))
  expect(pageErrors).toEqual([])
})

test('an account with no events sees an empty state instead of demo photos', async ({ page }) => {
  await installMockSession(page)
  await page.route(`${supabaseHost}/rest/v1/danz_events**`, (route) => route.fulfill({ json: [] }))
  await openPrivateGallery(page)
  await expect(page.getByRole('heading', { name: 'Todavía no hay galerías disponibles para tu cuenta', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Abrir foto privada/ })).toHaveCount(0)
  await expect(page.getByText('SIMULADOR DE VISTAS', { exact: true })).not.toBeVisible()
})

test('a late response from the previous event cannot replace the selected album', async ({ page }) => {
  await installGallery(page)
  let releaseFirst!: () => void
  const firstResponse = new Promise<void>((resolve) => { releaseFirst = resolve })
  let firstStarted = false
  await page.route(`${supabaseHost}/rest/v1/danz_photos**`, async (route) => {
    const isFirst = new URL(route.request().url()).searchParams.get('event_id') === `eq.${EVENT_A}`
    if (isFirst) { firstStarted = true; await firstResponse }
    await route.fulfill({ json: [{ id: isFirst ? 'late-first-photo' : 'second-photo', storage_path: isFirst ? firstPath : secondPath }] }).catch(() => {})
  })
  await openPrivateGallery(page)
  await expect.poll(() => firstStarted).toBe(true)
  await page.getByRole('button', { name: new RegExp(events[1].title) }).click()
  await expect(page.getByRole('button', { name: 'Abrir foto privada 1', exact: true }).locator('img')).toHaveAttribute('src', new RegExp('second-private.png'))
  releaseFirst()
  await expect(page.getByRole('heading', { name: events[1].title, exact: true })).toBeVisible()
  await expect(page.locator('.private-gallery img[src*="first-private"]')).toHaveCount(0)
})

test('switching accounts and signing out clears private photos and stale errors', async ({ page }) => {
  await installGallery(page)
  await openPrivateGallery(page)
  await expect(page.getByRole('button', { name: 'Abrir foto privada 1', exact: true })).toBeVisible()
  await page.route(`${supabaseHost}/rest/v1/danz_events**`, (route) => route.fulfill({ json: [] }))
  await switchMockSession(page, USER_B)
  await expect(page.getByRole('heading', { name: 'Todavía no hay galerías disponibles para tu cuenta', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Abrir foto privada/ })).toHaveCount(0)
  await expect(page.getByText(events[0].title, { exact: true })).toHaveCount(0)
  await switchMockSession(page, null)
  await expect(page.getByRole('button', { name: 'INICIAR SESIÓN', exact: true })).toBeVisible()
  await expect(page.locator('.private-gallery img')).toHaveCount(0)
})

test('storage signing failures and public paths never reveal photographs', async ({ page }) => {
  await installGallery(page)
  await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos`, async (route) => {
    const body = route.request().postDataJSON() as { paths: string[] }
    await route.fulfill({ json: body.paths.map((path) => ({ path, error: null, signedURL: `/object/public/danz-event-photos/${path}?token=not-private` })) })
  })
  await openPrivateGallery(page)
  await expect(page.getByText('No hemos podido abrir las fotografías de este evento.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Abrir foto privada/ })).toHaveCount(0)
  await expect(page.locator('.private-gallery img')).toHaveCount(0)
})

test('renews expiring photo URLs and removes images when renewed access is refused', async ({ page }) => {
  // Install before the app schedules timers, without pausing Auth initialization.
  await page.clock.install({ time: new Date() })
  await installGallery(page)
  let signatures = 0
  await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos`, async (route) => {
    signatures += 1
    const body = route.request().postDataJSON() as { paths: string[]; expiresIn: number }
    expect(body.expiresIn).toBe(60)
    if (signatures > 1) {
      await route.fulfill({ status: 403, json: { statusCode: '403', error: 'Access denied', message: 'Synthetic access was withdrawn' } })
      return
    }
    await route.fulfill({ json: body.paths.map((path) => ({ path, error: null, signedURL: `/object/sign/danz-event-photos/${path}?token=initial-synthetic-token` })) })
  })
  await openPrivateGallery(page)
  await expect(page.getByRole('button', { name: 'Abrir foto privada 1', exact: true })).toBeVisible()
  expect(signatures).toBe(1)

  // Move time only after the first image is available; the next signing attempt
  // must occur before its sixty-second URL expires, without user interaction.
  await page.clock.fastForward(45_001)
  await expect.poll(() => signatures).toBe(2)
  await expect(page.getByText('No hemos podido abrir las fotografías de este evento.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Abrir foto privada/ })).toHaveCount(0)
  await expect(page.locator('.private-gallery img')).toHaveCount(0)
})
