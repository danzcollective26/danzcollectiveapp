import { expect, test } from '@playwright/test'
import { mockSupabase, makeSession, supabaseHost } from './helpers/supabase'

async function openRedeemedStamp(page: import('@playwright/test').Page, title: string) {
  await page.goto('/?seccion=pasaporte')
  await expect(page.getByRole('region', { name: 'Pasaporte DANZ, un viaje por página' })).toBeVisible()
  const next = page.getByRole('button', { name: 'Página siguiente' })
  await next.click()
  await next.click()
  await expect(page.getByRole('button', { name: `Abrir viaje ${title}`, exact: true })).toBeVisible()
}


test('disabled or invalid providers are hidden and do not prevent email access', async ({ page }) => {
  await mockSupabase(page)
  await page.route(`${supabaseHost}/auth/v1/settings`, route => route.fulfill({ json: { external: { google: 'true', apple: false, github: true } } }))
  await page.goto('/?seccion=cuenta')
  await expect(page.getByRole('heading', { name: 'Entra con tu correo' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Continuar con/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'ENVIAR ENLACE', exact: true })).toBeEnabled()
})

for (const provider of ['google', 'apple'] as const) {
  test(`${provider}: PKCE callback is verified and a pending event pass survives`, async ({ page, baseURL }) => {
    await mockSupabase(page)
    await page.route(`${supabaseHost}/auth/v1/settings`, route => route.fulfill({ json: { external: { google: true, apple: true } } }))
    await page.route(`${supabaseHost}/rest/v1/danz_profiles**`, route => route.fulfill({ json: [] }))
    let redeemed = false
    await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, async route => {
      expect(route.request().postDataJSON()).toEqual({ p_code: 'ABCD1234EFGH5678IJKL9012' })
      redeemed = true
      await route.fulfill({ json: [{ status: 'granted', event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', granted_at: '2026-11-10T04:00:00Z' }] })
    })
    await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({ json: redeemed ? [{ event_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', title: 'Mi primera noche', starts_at: null, event_status: 'published', granted_at: '2026-11-10T04:00:00Z' }] : [] }))
    let emailRequests = 0
    let exchanges = 0
    await page.route(`${supabaseHost}/auth/v1/otp**`, async route => { emailRequests++; await route.fulfill({ json: {} }) })
    await page.route(`${supabaseHost}/auth/v1/authorize**`, async route => {
      const url = new URL(route.request().url())
      expect(url.searchParams.get('provider')).toBe(provider)
      expect(url.searchParams.get('redirect_to')).toBe(`${baseURL}/`)
      expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(url.searchParams.get('code_challenge_method')?.toLowerCase()).toBe('s256')
      await route.fulfill({ status: 302, headers: { location: `${baseURL}/?code=synthetic-oauth-code` } })
    })
    await page.route(`${supabaseHost}/auth/v1/token**`, async route => {
      exchanges++
      const body = route.request().postDataJSON()
      expect(body.auth_code).toBe('synthetic-oauth-code')
      expect(body.code_verifier).toEqual(expect.any(String))
      expect(body.code_verifier.length).toBeGreaterThanOrEqual(43)
      const session = makeSession()
      session.user.app_metadata = { provider, providers: [provider] }
      await route.fulfill({ json: session })
    })
    const pass = 'ABCD1234EFGH5678IJKL9012'
    await page.goto(`/#pase=${pass}`)
    await expect(page.getByRole('heading', { name: /PASE\s*GUARDADO\./ })).toBeVisible()
    await page.getByRole('button', { name: 'CANJEAR MI PASE', exact: true }).click()
    await page.getByRole('button', { name: `Continuar con ${provider === 'google' ? 'Google' : 'Apple'}`, exact: true }).click()
    await openRedeemedStamp(page, 'Mi primera noche')
    expect(exchanges).toBe(1)
    expect(emailRequests).toBe(0)
    expect(await page.evaluate(() => localStorage.getItem('danz-pending-event-pass'))).toBeNull()
    expect(page.url()).not.toMatch(/code=|synthetic-oauth/)
    await expect(page.getByRole('button', { name: 'ADMINISTRAR', exact: true })).toHaveCount(0)
  })
}

for (const entry of ['ABRIR DANZ PARA ENTRAR', 'ABRIR CUENTA EN EL NAVEGADOR']) {
test(`${entry}: embedded login escapes a sandbox that forbids top navigation before starting Google`, async ({ page, context, baseURL }) => {
  await mockSupabase(page)
  await page.route(`${supabaseHost}/auth/v1/settings`, route => route.fulfill({ json: { external: { google: true, apple: true } } }))
  const embedded = new URL('/?seccion=cuenta#pase=ABCD1234EFGH5678IJKL9012', baseURL)
  embedded.hostname = 'localhost'
  let authorizations = 0
  await context.route(`${supabaseHost}/**`, route => route.fulfill({ status: 404, json: { message: 'Unconfigured synthetic test endpoint' } }))
  await context.route(`${supabaseHost}/auth/v1/settings`, route => route.fulfill({ json: { external: { google: true, apple: true } } }))
  await context.route(`${supabaseHost}/auth/v1/authorize**`, async route => {
    authorizations++
    const url = new URL(route.request().url())
    expect(url.searchParams.get('provider')).toBe('google')
    expect(url.searchParams.get('redirect_to')).toBe(`${embedded.origin}/`)
    expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/)
    // Fulfil the external Auth destination directly. Playwright does not route
    // each subsequent hop of a fulfilled redirect chain to another fake host.
    await route.fulfill({ contentType: 'text/html', headers: { 'Content-Security-Policy': "frame-ancestors 'none'", 'X-Frame-Options': 'DENY' }, body: '<!doctype html><title>Google de prueba</title><h1>Acceso externo de prueba</h1>' })
  })
  await page.goto('/')
  await page.setContent(`<iframe title="DANZ" style="width:100%;height:90vh" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" src="${embedded.href}"></iframe>`)
  const frame = page.frameLocator('iframe')
  await expect(frame.getByRole('button', { name: /Continuar con Google/ })).toHaveCount(0)
  const link = frame.getByRole('link', { name: entry, exact: true })
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  const opened = context.waitForEvent('page')
  await link.click()
  const browser = await opened
  await expect(browser).toHaveURL(/localhost.*seccion=cuenta/)
  await expect(browser.getByRole('button', { name: 'Continuar con Google', exact: true })).toBeVisible()
  expect(await browser.evaluate(() => window.opener === null)).toBe(true)
  expect(await browser.evaluate(() => localStorage.getItem('danz-pending-event-pass'))).toBe('ABCD1234EFGH5678IJKL9012')
  expect(await browser.evaluate(() => localStorage.getItem('sb-danz-test-auth-token-code-verifier'))).toBeNull()
  expect(authorizations).toBe(0)
  await browser.getByRole('button', { name: 'Continuar con Google', exact: true }).click()
  await expect(browser.getByRole('heading', { name: 'Acceso externo de prueba', exact: true })).toBeVisible()
  await expect(browser).toHaveURL(new RegExp(`${supabaseHost}/auth/v1/authorize`))
  expect(authorizations).toBe(1)
  await expect(page).toHaveURL(new URL('/', baseURL).href)
  await expect(frame.getByRole('heading', { name: 'TU CUENTA.', exact: true })).toBeVisible()
  expect(await frame.locator('body').evaluate(() => localStorage.getItem('danz-pending-event-pass'))).toBe('ABCD1234EFGH5678IJKL9012')
  await browser.close()
})
}

test('failed provider discovery shows a retry instead of silently removing Google', async ({ page }) => {
  await mockSupabase(page)
  let failing = true
  let requests = 0
  await page.route(`${supabaseHost}/auth/v1/settings`, route => {
    requests++
    return failing ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ json: { external: { google: true, apple: false } } })
  })
  await page.goto('/?seccion=cuenta')
  await expect(page.getByRole('alert').filter({ hasText: 'No hemos podido cargar las opciones de acceso.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ENVIAR ENLACE', exact: true })).toBeEnabled()
  failing = false
  await page.getByRole('button', { name: 'RECARGAR ACCESOS', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Continuar con Google', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'RECARGAR ACCESOS', exact: true })).toHaveCount(0)
  expect(requests).toBeGreaterThanOrEqual(2)
})

test('an iCloud email can use the email flow and link its pass without Google or Apple', async ({ page }) => {
  await mockSupabase(page)
  const email = 'danz-attendee-test@icloud.com'
  const pass = 'ICLOUDPASS1234567'
  const eventId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const session = makeSession()
  session.user.email = email
  let sends = 0
  let redemptions = 0
  await page.route(`${supabaseHost}/auth/v1/user`, route => route.fulfill({ json: session.user }))
  await page.route(`${supabaseHost}/rest/v1/danz_profiles**`, route => route.fulfill({ json: [] }))
  await page.route(`${supabaseHost}/auth/v1/otp**`, async route => {
    sends++
    expect(route.request().postDataJSON()).toMatchObject({ email, create_user: true })
    await route.fulfill({ json: {} })
  })
  await page.route(`${supabaseHost}/auth/v1/verify`, async route => {
    expect(route.request().postDataJSON()).toMatchObject({ email, type: 'email', token: '123456' })
    await route.fulfill({ json: session })
  })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_redeem_event_code`, async route => {
    redemptions++
    expect(route.request().postDataJSON()).toEqual({ p_code: pass })
    await route.fulfill({ json: [{ status: 'granted', event_id: eventId, granted_at: '2026-11-10T01:00:00Z' }] })
  })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, route => route.fulfill({ json: redemptions ? [{ event_id: eventId, title: 'Noche desde iCloud', starts_at: null, event_status: 'published', granted_at: '2026-11-10T01:00:00Z' }] : [] }))
  await page.goto(`/#pase=${pass}`)
  await page.getByRole('button', { name: 'CANJEAR MI PASE', exact: true }).click()
  await expect(page.getByRole('button', { name: /Continuar con/ })).toHaveCount(0)
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'ENVIAR ENLACE', exact: true }).click()
  await expect(page.getByText(/^Solicitud enviada\./)).toBeVisible()
  await page.getByRole('button', { name: 'MI CORREO INCLUYE UN CÓDIGO', exact: true }).click()
  await page.getByLabel('Código de acceso', { exact: true }).fill('123456')
  await page.getByRole('button', { name: 'COMPROBAR CÓDIGO', exact: true }).click()
  await openRedeemedStamp(page, 'Noche desde iCloud')
  expect(sends).toBe(1)
  expect(redemptions).toBe(1)
  expect(await page.evaluate(() => localStorage.getItem('danz-pending-event-pass'))).toBeNull()
})

test('iPhone guest sees Safari handoff guidance before starting Google login',async({page})=>{
 await mockSupabase(page)
 await page.route(`${supabaseHost}/auth/v1/settings`,route=>route.fulfill({json:{external:{google:true,apple:false}}}))
 await page.goto('/?seccion=cuenta')
 await expect(page.getByRole('button',{name:'Continuar con Google',exact:true})).toBeVisible()
 await expect(page.getByText(/Cámara de un iPhone/)).toBeVisible()
 const direct=page.getByRole('link',{name:'ABRIR DANZ EN EL NAVEGADOR'})
 await expect(direct).toHaveAttribute('target','_blank')
 await expect(direct).toHaveAttribute('href',/seccion=cuenta/)
})
