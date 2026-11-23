import { expect, test } from '@playwright/test'
import { installMockSession, mockSupabase, supabaseHost, switchMockSession, USER_A, USER_B } from './helpers/supabase'

const CODE = 'DANZACCESSA123456'
const PENDING = 'danz-pending-event-pass'
const EA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const EB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const stamp = (id: string, title: string, event_status = 'published') => ({ event_id: id, title, starts_at: '2026-11-08T22:00:00Z', event_status, granted_at: '2026-11-09T01:00:00Z' })
const openPassport = async (page: import('@playwright/test').Page) => {
  await page.goto('/?seccion=pasaporte')
}
const book = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'Pasaporte DANZ, un viaje por página' })
const nextPage = (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Página siguiente' }).click()
const openStampIndex = async (page: import('@playwright/test').Page) => {
  await expect(book(page)).toBeVisible()
  await nextPage(page)
  await nextPage(page)
  await expect(page.getByRole('heading', { name: 'MIS VIAJES.' })).toBeVisible()
}
const goToPassport = async (page: import('@playwright/test').Page) => {
  const more = page.getByRole('button', { name: 'Más secciones', exact: true })
  if (await more.isVisible()) {
    await more.click()
    await page.getByRole('region', { name: 'Más secciones de DANZ' }).getByRole('button', { name: /MI PASAPORTE/ }).click()
  } else {
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('button', { name: 'PASAPORTE', exact: true }).click()
  }
}

test('only a newly granted server stamp celebrates; sound is opt-in and duplicates stay quiet', async ({ page }, testInfo) => {
  await installMockSession(page)
  await page.addInitScript(()=>{
    localStorage.setItem('danz-yeppo-enabled-v1','false')
    const original=window.AudioContext
    ;(window as any).__premiumAudio=0
    window.AudioContext=class extends original {constructor(options?:AudioContextOptions){super(options);(window as any).__premiumAudio++}}
  })
  let granted=false
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`,route=>route.fulfill({json:granted?[stamp(EA,'Nueva noche QA')]:[]}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`,route=>{
    const status=granted?'already_attended':'granted';granted=true
    return route.fulfill({json:[{status,event_id:EA,granted_at:'2026-11-16T18:00:00Z'}]})
  })
  await page.goto('/?seccion=pasaporte')
  await expect(book(page)).toBeVisible()
  await page.getByLabel('CÓDIGO DEL EVENTO',{exact:true}).fill(CODE)
  await page.getByRole('button',{name:/GUARDAR MI SELLO/}).click()
  await expect(page.getByText('¡Sello guardado!', { exact: false })).toBeVisible()
  await openStampIndex(page)
  await page.getByRole('button', { name: 'Abrir viaje Nueva noche QA' }).click()
  await expect(page.getByText('¡NUEVO SELLO EN TU PASAPORTE!')).toBeVisible()
  await expect(page.getByRole('button',{name:'SONIDO DE SELLOS OFF',exact:true})).toHaveAttribute('aria-pressed','false')
  expect(await page.evaluate(()=>(window as any).__premiumAudio)).toBe(0)
  await testInfo.attach('sello-confirmado',{body:await page.screenshot({type:'jpeg',quality:75}),contentType:'image/jpeg'})
  await expect(page.locator('.is-new-stamp')).toHaveCount(0,{timeout:6000})
  await page.getByLabel('CÓDIGO DEL EVENTO',{exact:true}).fill(CODE)
  await page.getByRole('button',{name:/GUARDAR MI SELLO/}).click()
  await expect(page.getByText('Ya tienes este sello.',{exact:false})).toBeVisible()
  await expect(page.getByText('¡NUEVO SELLO EN TU PASAPORTE!')).toHaveCount(0)
  await page.getByRole('button',{name:'SONIDO DE SELLOS OFF',exact:true}).click()
  await expect(page.getByRole('button',{name:'SONIDO DE SELLOS ON',exact:true})).toHaveAttribute('aria-pressed','true')
  await page.reload()
  await expect(page.getByRole('button',{name:'SONIDO DE SELLOS ON',exact:true})).toHaveAttribute('aria-pressed','true')
  await expect(page.getByText('¡NUEVO SELLO EN TU PASAPORTE!')).toHaveCount(0)
})

test('a stalled passport load enables retry without accepting the old response', async ({ page }) => {
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
  await openPassport(page)
  await expect.poll(() => requests).toBe(1)
  await openStampIndex(page)
  await expect(page.getByText('Comprobando tus sellos…', { exact: true })).toBeVisible()
  await page.clock.fastForward(12_001)
  await expect(page.getByText('No hemos podido cargar tus viajes.', { exact: false })).toBeVisible()
  const retry = page.getByRole('button', { name: 'REINTENTAR ↗', exact: true })
  await expect(retry).toBeEnabled()
  await retry.click()
  await expect(page.getByRole('button', { name: 'Abrir viaje Sello conservado' })).toBeVisible()
  release()
  await expect(page.getByRole('button', { name: 'Abrir viaje Sello conservado' })).toHaveCount(1)
})

test('the passport has a primary tab, a reloadable link and only the account stamps', async ({ page }) => {
  await installMockSession(page)
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({ json: [stamp(EA, 'Fiesta de prueba'), stamp(EB, 'Recuerdo archivado', 'archived')] }))
  await page.goto('/')
  await goToPassport(page)
  await expect(page).toHaveURL(/seccion=pasaporte/)
  await openStampIndex(page)
  await expect(page.getByRole('button', { name: 'Abrir viaje Fiesta de prueba' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abrir viaje Recuerdo archivado' })).toBeVisible()
  await page.reload()
  await openStampIndex(page)
  await page.getByRole('button', { name: 'Abrir viaje Recuerdo archivado' }).click()
  await expect(page.getByRole('heading', { name: 'Recuerdo archivado', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir mi Pasaporte DANZ y ver mis sellos' }).click()
  await openStampIndex(page)
  await expect(page.getByRole('button', { name: 'Abrir viaje Fiesta de prueba' })).toBeVisible()
})

test('an empty or signed-out booklet never invents attendance and keeps sign-in accessible', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/?seccion=pasaporte')
  await openStampIndex(page)
  await expect(page.locator('.danz-book-stamp')).toHaveCount(0)
  await expect(page.getByText('Regístrate para guardar tus primeros sellos.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'INICIAR SESIÓN ↗' }).click()
  await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeVisible()
})

test('opening the booklet keeps an unlinked guest QR and survives reload', async ({ page }) => {
  await mockSupabase(page)
  await page.goto(`/#pase=${CODE}`)
  await expect(page.getByRole('heading', { name: /PASE\s*GUARDADO\./ })).toBeVisible()
  await page.getByRole('button', { name: 'SEGUIR CON MI NOCHE', exact: true }).click()
  await goToPassport(page)
  await expect(book(page)).toBeVisible()
  await expect(page.getByLabel('CÓDIGO DEL EVENTO', { exact: true })).toHaveValue(CODE)
  await page.reload()
  await expect(book(page)).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBe(CODE)
  await expect(page.locator('.passport-stamp')).toHaveCount(0)
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
  await openStampIndex(page)
  await expect(page.getByRole('button', { name: 'Abrir viaje Otra noche' })).toBeVisible()
  await page.getByLabel('CÓDIGO DEL EVENTO', { exact: true }).fill('danz-access-a123456')
  await page.getByRole('button', { name: 'GUARDAR MI SELLO', exact: true }).click()
  await expect(page.getByText('¡Sello guardado!', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abrir viaje Noche del sello' })).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBeNull()
  await page.getByRole('button', { name: 'Abrir viaje Noche del sello' }).click()
  await page.getByRole('button', { name: 'ABRIR GALERÍA DEL VIAJE ↗', exact: true }).click()
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

test('archived stamps retain their gallery access; retry recovers fetch errors', async ({ page }) => {
  await installMockSession(page)
  let fail = true
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => fail ? route.fulfill({ status: 503, json: { message: 'Synthetic failure' } }) : route.fulfill({ json: [stamp(EA, 'Recuerdo permanente', 'archived')] }))
  await openPassport(page)
  await openStampIndex(page)
  await expect(page.getByText('No hemos podido cargar tus viajes.', { exact: false })).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'REINTENTAR ↗', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Abrir viaje Recuerdo permanente' })).toBeVisible()
  await page.route(`${supabaseHost}/rest/v1/danz_events**`, route => route.fulfill({ json: [{ id: EA, title: 'Recuerdo permanente', starts_at: null }] }))
  await page.route(`${supabaseHost}/rest/v1/danz_photos**`, route => route.fulfill({ json: [] }))
  await page.getByRole('button', { name: 'Abrir viaje Recuerdo permanente' }).click()
  await page.getByRole('button', { name: 'ABRIR GALERÍA DEL VIAJE ↗', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Recuerdo permanente', exact: true })).toBeVisible()
  await expect(page.getByText('Todavía no hay fotografías publicadas para este evento.', { exact: true })).toBeVisible()
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
  await openStampIndex(page)
  await expect(page.getByRole('button', { name: 'Abrir viaje Solo cuenta A' })).toBeVisible()
  await page.getByLabel('CÓDIGO DEL EVENTO', { exact: true }).fill(CODE)
  await page.getByRole('button', { name: 'GUARDAR MI SELLO', exact: true }).click()
  await expect.poll(() => requested).toBe(true)
  await switchMockSession(page, USER_B)
  await openStampIndex(page)
  await expect(page.getByRole('button', { name: 'Abrir viaje Solo cuenta B' })).toBeVisible()
  release()
  await expect(page.getByRole('button', { name: 'Abrir viaje Solo cuenta A' })).toHaveCount(0)
  await expect(page.getByText('¡Sello guardado!', { exact: false })).toHaveCount(0)
  await switchMockSession(page, null)
  await expect(page.getByRole('button', { name: 'Abrir viaje Solo cuenta B' })).toHaveCount(0)
  await expect(page.locator('.danz-book-stamp')).toHaveCount(0)
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
  await expect.poll(() => redeemed).toEqual([CODE, 'SECONDACCESS1234'])
  await openStampIndex(page)
  await expect(page.locator('.danz-book-stamp')).toHaveCount(2)
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
  await expect.poll(() => requests).toBe(2)
  await openStampIndex(page)
  await expect(page.getByRole('button', { name: 'Abrir viaje Pase recuperado' })).toBeVisible()
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
  await openStampIndex(page)
  await expect(page.getByRole('button', { name: 'Abrir viaje Sello automático' })).toBeVisible()
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
  await openStampIndex(page)
  await expect(page.getByRole('button', { name: 'Abrir viaje Recuperado tras reintento' })).toBeVisible()
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
  await expect.poll(() => redeemed).toEqual([CODE, next])
  await openStampIndex(page)
  await expect(page.getByRole('button', { name: 'Abrir viaje Segundo QR confirmado' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abrir viaje Primer QR confirmado' })).toBeVisible()
  expect(await page.evaluate(key => localStorage.getItem(key), PENDING)).toBeNull()
})
