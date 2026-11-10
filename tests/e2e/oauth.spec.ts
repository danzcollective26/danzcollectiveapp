import { expect, test } from '@playwright/test'
import { mockSupabase, makeSession, supabaseHost } from './helpers/supabase'

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
    await page.getByRole('button', { name: 'VINCULAR MI PASE', exact: true }).click()
    await page.getByRole('button', { name: `Continuar con ${provider === 'google' ? 'Google' : 'Apple'}`, exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Mi primera noche', exact: true })).toBeVisible()
    expect(exchanges).toBe(1)
    expect(emailRequests).toBe(0)
    expect(await page.evaluate(() => localStorage.getItem('danz-pending-event-pass'))).toBeNull()
    expect(page.url()).not.toMatch(/code=|synthetic-oauth/)
    await expect(page.getByRole('button', { name: 'Administrar', exact: true })).toHaveCount(0)
  })
}

test('embedded login opens the full app before creating an OAuth verifier and preserves the pass', async ({ page, baseURL }) => {
  await mockSupabase(page)
  await page.route(`${supabaseHost}/auth/v1/settings`, route => route.fulfill({ json: { external: { google: true, apple: true } } }))
  const embedded = new URL('/?seccion=cuenta#pase=ABCD1234EFGH5678IJKL9012', baseURL)
  embedded.hostname = 'localhost'
  let authorizations = 0
  await page.route(`${supabaseHost}/auth/v1/authorize**`, async route => { authorizations++; await route.fulfill({ status: 400, json: {} }) })
  await page.goto('/')
  await page.setContent(`<iframe title="DANZ" style="width:100%;height:90vh" sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation" src="${embedded.href}"></iframe>`)
  const frame = page.frameLocator('iframe')
  await expect(frame.getByRole('button', { name: /Continuar con Google/ })).toHaveCount(0)
  await frame.getByRole('link', { name: 'ABRIR DANZ PARA ENTRAR', exact: true }).click()
  await expect(page).toHaveURL(/localhost.*seccion=cuenta/)
  await expect(page.getByRole('button', { name: 'Continuar con Google', exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('danz-pending-event-pass'))).toBe('ABCD1234EFGH5678IJKL9012')
  expect(authorizations).toBe(0)
})
