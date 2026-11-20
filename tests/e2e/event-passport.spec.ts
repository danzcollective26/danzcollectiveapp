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

test('newly confirmed stamp appears in immersive reader; duplicate redemption stays safe', async ({ page }) => {
  await installMockSession(page)
  let granted = false
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({
    json: granted ? [stamp(EA, 'Nueva noche QA')] : [],
  }))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, route => {
    const status = granted ? 'already_attended' : 'granted'
    granted = true
    return route.fulfill({ json: [{ status, event_id: EA, granted_at: '2026-11-16T18:00:00Z' }] })
  })
  await page.goto('/?seccion=danzers')
  await page.getByLabel('CÓDIGO DEL EVENTO', { exact: true }).fill(CODE)
  await page.getByRole('button', { name: /GUARDAR MI SELLO/ }).click()
  await expect(page.getByText('¡Sello guardado!', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Abrir el pasaporte DANZ a pantalla completa' }).click()
  const reader = page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })
  await expect(reader).toBeVisible()
  const leaf = reader.getByLabel('Desliza horizontalmente o usa las flechas para pasar las páginas')
  await leaf.focus()
  await leaf.press('ArrowRight')
  await leaf.press('ArrowRight')
  await expect(reader.getByRole('heading', { name: 'Nueva noche QA' })).toBeVisible()
  await reader.getByRole('button', { name: 'Cerrar pasaporte y volver a la pantalla anterior' }).click()
  await expect(page).toHaveURL(/seccion=danzers/)
  await page.getByLabel('CÓDIGO DEL EVENTO', { exact: true }).fill(CODE)
  await page.getByRole('button', { name: /GUARDAR MI SELLO/ }).click()
  await expect(page.getByText('Ya tienes este sello.', { exact: false })).toBeVisible()
})

test('a stalled immersive passport load allows retry and ignores an old response', async ({ page }) => {
  await page.clock.install({ time: new Date() })
  await installMockSession(page)
  let release!: () => void
  const stalled = new Promise<void>(resolve => { release = resolve })
  let requests = 0
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, async route => {
    requests++
    if (requests === 1) {
      await stalled
      await route.fulfill({ json: [] }).catch(() => {})
    } else await route.fulfill({ json: [stamp(EA, 'Sello conservado')] })
  })
  await page.goto('/?seccion=pasaporte')
  const reader = page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })
  await expect(reader).toBeVisible()
  const leaf = reader.getByLabel('Desliza horizontalmente o usa las flechas para pasar las páginas')
  await leaf.focus()
  await leaf.press('ArrowRight')
  await leaf.press('ArrowRight')
  await expect.poll(() => requests).toBe(1)
  await expect(reader.getByText('Comprobando las fiestas de tu pasaporte…')).toBeVisible()
  await page.clock.fastForward(12_001)
  await expect(reader.getByText('No hemos podido cargar tus sellos.')).toBeVisible()
  await reader.getByRole('button', { name: 'REINTENTAR' }).click()
  await expect.poll(() => requests).toBe(2)
  await expect(reader.getByRole('heading', { name: 'Sello conservado' })).toBeVisible()
  release()
  await expect(reader.getByRole('heading', { name: 'Sello conservado' })).toBeVisible()
})

test('immersive passport keeps server stamps after reload and returns to the wallet', async ({ page }) => {
  await installMockSession(page)
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({
    json: [stamp(EA, 'Fiesta de prueba'), stamp(EB, 'Recuerdo archivado', 'archived')],
  }))
  const initialStamps = page.waitForResponse(response => response.url().includes('/rpc/danz_my_passport'))
  await page.goto('/?seccion=pasaporte')
  const reader = page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })
  await expect(reader).toBeVisible()
  await initialStamps
  await expect(page.locator('header.topbar')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Pasar páginas del pasaporte' })).toHaveCount(0)
  const leaf = reader.getByLabel('Desliza horizontalmente o usa las flechas para pasar las páginas')

  await leaf.focus()
  await leaf.press('ArrowRight')
  await leaf.press('ArrowRight')
  await expect(reader.getByRole('heading', { name: 'Fiesta de prueba' })).toBeVisible()
  await leaf.press('ArrowRight')
  await expect(reader.getByRole('heading', { name: 'Recuerdo archivado' })).toBeVisible()
  const refreshedStamps = page.waitForResponse(response => response.url().includes('/rpc/danz_my_passport'))
  await page.reload()
  await refreshedStamps
  await expect(reader).toBeVisible()
  await leaf.focus()
  await leaf.press('ArrowRight')
  await leaf.press('ArrowRight')
  await leaf.press('ArrowRight')
  await expect(reader.getByRole('heading', { name: 'Recuerdo archivado' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await reader.getByRole('button', { name: 'Cerrar pasaporte y volver a la pantalla anterior' }).click()
  await expect(page).toHaveURL(/seccion=inicio|\/$/)
  await page.getByRole('button', { name: 'Abrir mi Pasaporte DANZ y ver mis sellos' }).click()
  await expect(reader).toBeVisible()
})

test('an empty or signed-out immersive passport never invents attendance and offers sign-in', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/?seccion=pasaporte')
  const reader = page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })
  await expect(reader).toBeVisible()
  await expect(page.locator('.danz-trip-ink')).toHaveCount(0)
  const leaf = reader.getByLabel('Desliza horizontalmente o usa las flechas para pasar las páginas')
  await leaf.focus()
  await leaf.press('ArrowRight')
  await expect(reader.getByText('AL REGISTRARTE').first()).toBeVisible()
  await reader.getByRole('button', { name: 'INICIAR SESIÓN' }).click()
  await expect(page).toHaveURL(/seccion=cuenta/)
  await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeVisible()
})

test('guest QR remains stored when opening and reloading the immersive passport', async ({ page }) => {
  await mockSupabase(page)
  await page.goto(`/#pase=${CODE}`)
  await expect(page.getByRole('heading', { name: /PASE\s*GUARDADO\./ })).toBeVisible()
  await page.getByRole('button', { name: 'SEGUIR CON MI NOCHE', exact: true }).click()
  await page.getByRole('button', { name: 'Abrir mi Pasaporte DANZ y ver mis sellos' }).click()
  const reader = page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })
  await expect(reader).toBeVisible()
  await expect(page.locator('.danz-trip-ink')).toHaveCount(0)
  await page.reload()
  await expect(reader).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBe(CODE)
  await reader.getByRole('button', { name: 'Cerrar pasaporte y volver a la pantalla anterior' }).click()
  await page.goto('/?seccion=danzers')
  await expect(page.getByLabel('CÓDIGO DEL EVENTO', { exact: true })).toHaveValue(CODE)
})

test('a guest QR is saved without a form, survives reload and can be linked later', async ({ page }) => {
  await mockSupabase(page)
  const redemptions: string[] = []
  page.on('request', request => { if (request.url().includes('/rpc/danz_redeem_event_code')) redemptions.push(request.url()) })
  await page.goto('/#pase=danz-access-a123456')
  await expect(page.getByRole('heading', { name: /PASE\s*GUARDADO\./ })).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBe(CODE)
  await expect(page).toHaveURL(/\/$/)
  await page.reload()
  await expect(page.getByRole('heading', { name: /PASE\s*GUARDADO\./ })).toBeVisible()
  await page.getByRole('button', { name: 'SEGUIR CON MI NOCHE', exact: true }).click()
  await expect(page.getByRole('heading', { name: /WE ARE/ })).toBeVisible()
  await page.getByRole('button', { name: 'ABRIR MI PASE ↗', exact: true }).click()
  await page.getByRole('button', { name: 'CANJEAR MI PASE', exact: true }).click()
  await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ABRIR MI PASE ↗', exact: true })).toBeVisible()
  expect(redemptions).toEqual([])
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBe(CODE)
  await page.goto('/#pase=SECONDACCESS1234')
  await page.getByText('VER MI CÓDIGO Y OPCIONES', { exact: true }).click()
  await expect(page.getByLabel('CÓDIGO DEL EVENTO', { exact: true })).toHaveValue('SECONDACCESS1234')
  await expect(page).toHaveURL(/\/$/)
  await page.getByRole('button', { name: 'DESCARTAR PASE PENDIENTE', exact: true }).click()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBe(CODE)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('danz-pending-event-passes-v2')!))).toEqual([CODE])
})

test('blocked storage keeps the code visible and never claims the pass was saved', async ({ page }) => {
  await mockSupabase(page)
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('danz-pending-event-pass')) throw new DOMException('Storage blocked', 'SecurityError')
      return original.call(this, key, value)
    }
  })
  await page.goto(`/#pase=${CODE}`)
  await expect(page.getByRole('heading', { name: /PASE\s*GUARDADO\./ })).toHaveCount(0)
  await expect(page.getByText('Este navegador no permite guardar el pase.', { exact: false })).toBeVisible()
  await expect(page.getByLabel('CÓDIGO DEL EVENTO', { exact: true })).toHaveValue(CODE)
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBeNull()
})

test('restricted browser history cannot prevent saving or leaving the arrival screen', async ({ page }) => {
  await mockSupabase(page)
  await page.addInitScript(() => {
    window.history.replaceState = () => { throw new DOMException('History blocked', 'SecurityError') }
  })
  await page.goto(`/#pase=${CODE}`)
  await expect(page.getByRole('heading', { name: /PASE\s*GUARDADO\./ })).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBe(CODE)
  await page.getByRole('button', { name: 'SEGUIR CON MI NOCHE', exact: true }).click()
  await expect(page.getByRole('heading', { name: /WE ARE/ })).toBeVisible()
})

test('server redemption adds a real immersive stamp and opens its matching gallery', async ({ page }) => {
  await installMockSession(page)
  let granted = false
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({
    json: granted ? [stamp(EA, 'Noche del sello'), stamp(EB, 'Otra noche')] : [stamp(EB, 'Otra noche')],
  }))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, async route => {
    expect(route.request().postDataJSON()).toEqual({ p_code: CODE })
    granted = true
    await route.fulfill({ json: [{ status: 'granted', event_id: EA, granted_at: '2026-11-09T01:00:00Z' }] })
  })
  await page.route(`${supabaseHost}/rest/v1/danz_events**`, route => route.fulfill({
    json: [{ id: EB, title: 'Otra noche', starts_at: null }, { id: EA, title: 'Noche del sello', starts_at: null }],
  }))
  await page.route(`${supabaseHost}/rest/v1/danz_photos**`, route => route.fulfill({ json: [] }))
  await openPassport(page)
  await page.getByLabel('CÓDIGO DEL EVENTO', { exact: true }).fill('danz-access-a123456')
  await page.getByRole('button', { name: 'GUARDAR MI SELLO', exact: true }).click()
  await expect(page.getByText('¡Sello guardado!', { exact: false })).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBeNull()
  // DANZERS and the reader share the same EventPassport instance; opening it need not refetch.
  await page.getByRole('button', { name: 'Abrir el pasaporte DANZ a pantalla completa' }).click()
  const reader = page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })
  const leaf = reader.getByLabel('Desliza horizontalmente o usa las flechas para pasar las páginas')
  await leaf.focus()
  await leaf.press('ArrowRight')
  await leaf.press('ArrowRight')
  await expect(reader.getByRole('heading', { name: 'Noche del sello' })).toBeVisible()
  await reader.getByRole('button', { name: 'ABRIR GALERÍA DEL VIAJE' }).click()
  await expect(page.getByRole('heading', { name: 'Noche del sello' })).toBeVisible()
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

test('archived immersive stamp keeps gallery access after a failed load and retry', async ({ page }) => {
  await installMockSession(page)
  let fail = true
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => fail
    ? route.fulfill({ status: 503, json: { message: 'Synthetic failure' } })
    : route.fulfill({ json: [stamp(EA, 'Recuerdo permanente', 'archived')] }))
  await page.route(`${supabaseHost}/rest/v1/danz_events**`, route => route.fulfill({
    json: [{ id: EA, title: 'Recuerdo permanente', starts_at: null }],
  }))
  await page.route(`${supabaseHost}/rest/v1/danz_photos**`, route => route.fulfill({ json: [] }))
  await page.goto('/?seccion=pasaporte')
  const reader = page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })
  const leaf = reader.getByLabel('Desliza horizontalmente o usa las flechas para pasar las páginas')
  await leaf.focus()
  await leaf.press('ArrowRight')
  await leaf.press('ArrowRight')
  await expect(reader.getByText('No hemos podido cargar tus sellos.')).toBeVisible()
  fail = false
  await reader.getByRole('button', { name: 'REINTENTAR' }).click()
  await expect(reader.getByRole('heading', { name: 'Recuerdo permanente' })).toBeVisible()
  await reader.getByRole('button', { name: 'ABRIR GALERÍA DEL VIAJE' }).click()
  await expect(page.getByRole('heading', { name: 'Recuerdo permanente' })).toBeVisible()
  await expect(page.getByText('Todavía no hay fotografías publicadas para este evento.')).toBeVisible()
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
    const owner = JSON.parse(Buffer.from(route.request().headers().authorization!.split('.')[1], 'base64url').toString()).sub
    if (owner === USER_B) { await route.fulfill({ json: [{ status: 'unavailable', event_id: null, granted_at: null }] }); return }
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
  await expect(page.getByRole('button', { name: 'CANJEAR MI PASE', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Solo cuenta B', exact: true })).toHaveCount(0)
})

test('two saved nights are linked automatically after sign-in without another code or confirmation', async ({ page }) => {
  await mockSupabase(page)
  const redeemed: string[] = []
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({ json: redeemed.map((_, i) => stamp(i ? EB : EA, i ? 'Segunda fiesta' : 'Primera fiesta')) }))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, async route => {
    const code = route.request().postDataJSON().p_code
    redeemed.push(code)
    await route.fulfill({ json: [{ status: 'granted', event_id: code === CODE ? EA : EB, granted_at: '2026-11-10T04:00:00Z' }] })
  })
  await page.goto(`/#pase=${CODE}`)
  await expect(page.getByRole('heading', { name: /PASE\s*GUARDADO\./ })).toBeVisible()
  await expect(page.getByRole('button', { name: /CÓMO INSTALAR/ })).toHaveCount(0)
  await page.goto('/#pase=SECONDACCESS1234')
  await expect(page.getByText('Tienes 2 pases guardados.', { exact: false })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Tienes 2 pases guardados.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'CANJEAR MI PASE', exact: true }).click()
  await switchMockSession(page, USER_A)
  await expect(page.getByRole('heading', { name: 'Mis sellos (2)', exact: true })).toBeVisible()
  expect(redeemed).toEqual([CODE, 'SECONDACCESS1234'])
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('danz-pending-event-passes-v2')!))).toEqual([])
  await expect(page.getByRole('button', { name: 'ABRIR MI PASE ↗', exact: true })).toHaveCount(0)
})

test('a connection failure retains the QR and reconnecting retries once automatically', async ({ page, context }) => {
  await installMockSession(page)
  let requests = 0
  let granted = false
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({ json: granted ? [stamp(EA, 'Pase recuperado')] : [] }))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, async route => {
    requests++
    if (requests === 1) { await route.abort('failed'); return }
    granted = true
    await route.fulfill({ json: [{ status: 'granted', event_id: EA, granted_at: '2026-11-10T04:00:00Z' }] })
  })
  await page.goto(`/#pase=${CODE}`)
  await expect(page.getByText('No hemos podido confirmar el canje.', { exact: false })).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBe(CODE)
  await context.setOffline(true)
  await expect(page.getByText('Sin conexión.', { exact: false })).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByRole('heading', { name: 'Pase recuperado', exact: true })).toBeVisible()
  expect(requests).toBe(2)
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBeNull()
})

test('a signed-in visitor scans once and receives the stamp without submitting a form', async ({ page }) => {
  await installMockSession(page)
  let redemptions = 0
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, async route => {
    redemptions++
    expect(route.request().postDataJSON()).toEqual({ p_code: CODE })
    await route.fulfill({ json: [{ status: 'granted', event_id: EA, granted_at: '2026-11-10T01:00:00Z' }] })
  })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({ json: redemptions ? [stamp(EA, 'Sello automático')] : [] }))
  await page.goto(`/#pase=${CODE}`)
  await expect(page.getByText('¡Sello guardado!', { exact: false })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sello automático', exact: true })).toBeVisible()
  expect(redemptions).toBe(1)
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBeNull()
  await page.reload()
  await expect(page.getByRole('heading', { name: /WE ARE/ })).toBeVisible()
  expect(redemptions).toBe(1)
})

test('a failed automatic link keeps the pass and waits for an explicit retry', async ({ page }) => {
  await installMockSession(page)
  let redemptions = 0
  let available = false
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({ json: available ? [stamp(EA, 'Recuperado tras reintento')] : [] }))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, async route => {
    redemptions++
    await route.fulfill({ json: [{ status: available ? 'granted' : 'unavailable', event_id: available ? EA : null, granted_at: available ? '2026-11-10T01:00:00Z' : null }] })
  })
  await page.goto(`/#pase=${CODE}`)
  await expect(page.getByText('Este código no está disponible.', { exact: false })).toBeVisible()
  expect(redemptions).toBe(1)
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBe(CODE)
  await page.getByRole('button', { name: 'INICIO', exact: true }).click()
  await page.getByRole('button', { name: 'ABRIR MI PASE ↗', exact: true }).click()
  await expect(page.getByText('Este código no está disponible.', { exact: false })).toBeVisible()
  expect(redemptions).toBe(1)
  available = true
  await page.getByRole('button', { name: 'GUARDAR MI SELLO', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Recuperado tras reintento', exact: true })).toBeVisible()
  expect(redemptions).toBe(2)
})

test('a late link keeps a newer QR and links both events in order', async ({ page }) => {
  await installMockSession(page)
  const next = 'SECONDACCESS1234'
  const redeemed: string[] = []
  const items: ReturnType<typeof stamp>[] = []
  let release!: () => void
  const first = new Promise<void>(resolve => { release = resolve })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({ json: items }))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, async route => {
    const code = route.request().postDataJSON().p_code as string
    redeemed.push(code)
    if (code === CODE) await first
    const id = code === CODE ? EA : EB
    items.push(stamp(id, code === CODE ? 'Primer QR confirmado' : 'Segundo QR confirmado'))
    await route.fulfill({ json: [{ status: 'granted', event_id: id, granted_at: '2026-11-10T01:00:00Z' }] })
  })
  await page.goto(`/#pase=${CODE}`)
  await expect.poll(() => redeemed).toEqual([CODE])
  await page.goto(`/#pase=${next}`)
  await expect(page.getByLabel('CÓDIGO DEL EVENTO', { exact: true })).toHaveValue(next)
  release()
  await expect(page.getByRole('heading', { name: 'Segundo QR confirmado', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Primer QR confirmado', exact: true })).toBeVisible()
  expect(redeemed).toEqual([CODE, next])
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBeNull()
})
