import { expect, test, type Page } from '@playwright/test'
import { installMockSession, makeSession, mockSupabase, supabaseHost, sessionStorageKey, switchMockSession, USER_A, USER_B } from './helpers/supabase'

async function account(page: Page) {
  await page.goto('/')
  await page.getByRole('navigation').getByRole('button', { name: 'CUENTA', exact: true }).click()
}

async function profileMock(page: Page) {
  await page.route(`${supabaseHost}/rest/v1/danz_profiles**`, async route => {
    const request = route.request()
    if (request.method() === 'GET') await route.fulfill({ json: [] })
    else await route.fulfill({ status: request.method() === 'POST' ? 201 : 200, json: { user_id: USER_A, ...request.postDataJSON() } })
  })
}

test('correo explícito, código, perfil por columnas y cierre de sesión', async ({ page }) => {
  await mockSupabase(page)
  await profileMock(page)
  const sends: Record<string, unknown>[] = []
  await page.route(`${supabaseHost}/auth/v1/otp**`, async route => {
    sends.push(route.request().postDataJSON())
    const redirect = new URL(route.request().url()).searchParams.get('redirect_to')
    expect(redirect).toBe('http://127.0.0.1:4173/')
    await route.fulfill({ json: {} })
  })
  await page.route(`${supabaseHost}/auth/v1/verify`, async route => {
    const body = route.request().postDataJSON()
    expect(body).toMatchObject({ email: 'first@example.invalid', token: '123456', type: 'email' })
    await route.fulfill({ json: makeSession() })
  })
  await account(page)
  await expect(page.getByRole('heading', { name: 'Entra con tu correo' })).toBeVisible()
  expect(sends).toHaveLength(0)
  await page.getByLabel('Correo electrónico', { exact: true }).fill('first@example.invalid')
  await page.getByRole('button', { name: 'ENVIAR ENLACE', exact: true }).click()
  await expect(page.getByText(/^Solicitud enviada\./)).toBeVisible()
  expect(sends).toHaveLength(1)
  expect(sends[0]).toMatchObject({ email: 'first@example.invalid', create_user: true })
  expect(sends[0]).not.toHaveProperty('password')
  await expect(page.getByRole('button', { name: /^ESPERA / })).toBeDisabled()
  await page.getByRole('button', { name: 'MI CORREO INCLUYE UN CÓDIGO', exact: true }).click()
  await page.getByLabel('Código de acceso', { exact: true }).fill('123456')
  await page.getByRole('button', { name: 'COMPROBAR CÓDIGO', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Tu perfil' })).toBeVisible()
  await page.getByRole('button', { name: 'ADMINISTRAR MI PERFIL' }).click()
  await page.getByLabel('Instagram (opcional)', { exact: true }).fill('invalid handle')
  await page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true }).click()
  await expect(page.getByText('El usuario de Instagram solo admite letras, números, puntos o guiones bajos.')).toBeVisible()
  await page.getByLabel('Nombre público o alias (puede ser distinto al del correo)', { exact: true }).fill('Miembro QA')
  await page.getByLabel('Instagram (opcional)', { exact: true }).fill('@miembro_qa')
  await expect(page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true })).toBeEnabled()
  const create = page.waitForRequest(request => request.url().includes('/rest/v1/danz_profiles') && request.method() === 'POST')
  await page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true }).click()
  expect((await create).postDataJSON()).toEqual({ user_id: USER_A, display_name: 'Miembro QA', instagram_handle: 'miembro_qa', instagram_public: false })
  await expect(page.getByText('Perfil guardado.', { exact: true })).toBeVisible()
  await page.getByLabel('Nombre público o alias (puede ser distinto al del correo)', { exact: true }).fill('Miembro editado')
  const update = page.waitForRequest(request => request.url().includes('/rest/v1/danz_profiles') && request.method() === 'PATCH')
  await page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true }).click()
  const updated = await update
  expect(updated.postDataJSON()).toEqual({ display_name: 'Miembro editado', instagram_handle: 'miembro_qa', instagram_public: false })
  expect(new URL(updated.url()).searchParams.get('user_id')).toBe(`eq.${USER_A}`)
  await expect(page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'CERRAR SESIÓN', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Entra con tu correo' })).toBeVisible()
  await expect(page.getByText('first@example.invalid', { exact: true })).toHaveCount(0)
})

test('rechaza sesión guardada que getUser no valida en servidor', async ({ page }) => {
  await installMockSession(page)
  await page.route(`${supabaseHost}/auth/v1/user`, route => route.fulfill({ status: 401, json: { code: 'session_not_found', message: 'Do not display raw token response' } }))
  let profiles = 0
  await page.route(`${supabaseHost}/rest/v1/danz_profiles**`, async route => { profiles += 1; await route.fulfill({ json: [] }) })
  await account(page)
  await expect(page.getByRole('heading', { name: 'Entra con tu correo' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tu perfil' })).toHaveCount(0)
  expect(profiles).toBe(0)
  await expect(page.getByText(/Do not display raw token/)).toHaveCount(0)
})

test('rate-limit y errores callback son legibles sin reflejar texto externo', async ({ page }) => {
  await mockSupabase(page)
  await page.route(`${supabaseHost}/auth/v1/otp**`, route => route.fulfill({ status: 429, json: { code: 'over_email_send_rate_limit', message: 'untrusted server message' } }))
  await account(page)
  await page.getByLabel('Correo electrónico', { exact: true }).fill('first@example.invalid')
  await page.getByRole('button', { name: 'ENVIAR ENLACE', exact: true }).click()
  await expect(page.getByText(/Has hecho varios intentos seguidos/)).toBeVisible()
  await expect(page.getByText(/untrusted server message/)).toHaveCount(0)
  await page.goto('/?error=access_denied&error_code=otp_expired&error_description=UNTRUSTED_CALLBACK&code=secret')
  await page.getByRole('navigation').getByRole('button', { name: 'CUENTA', exact: true }).click()
  await expect(page.getByText(/El enlace o código ha caducado/)).toBeVisible()
  expect(page.url()).not.toMatch(/secret|error_description|otp_expired/)
  await expect(page.getByText(/UNTRUSTED_CALLBACK/)).toHaveCount(0)
})

test('carga de perfil fallida ofrece reintento y cierre fallido no anuncia éxito', async ({ page }) => {
  await installMockSession(page)
  let failed = true
  await page.route(`${supabaseHost}/rest/v1/danz_profiles**`, route => route.fulfill(failed ? { status: 500, json: { message: 'Synthetic failure' } } : { json: [] }))
  await page.route(`${supabaseHost}/auth/v1/logout**`, route => route.fulfill({ status: 400, json: { code: 'synthetic_failure', message: 'Synthetic error' } }))
  await account(page)
  await expect(page.getByText('No se pudo cargar tu perfil. Inténtalo de nuevo.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ADMINISTRAR MI PERFIL' })).toBeVisible()
  await page.getByRole('button', { name: 'ADMINISTRAR MI PERFIL' }).click()
  await expect(page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true })).toBeDisabled()
  failed = false
  await page.getByRole('button', { name: 'VOLVER A CARGAR PERFIL', exact: true }).click()
  await expect(page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'CERRAR SESIÓN', exact: true }).click()
  await expect(page.getByText(/Has salido de este navegador/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Entra con tu correo' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tu perfil' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'CERRAR SESIÓN', exact: true })).toHaveCount(0)
})


test('el resultado de un logout antiguo no cierra una nueva cuenta de otra pestaña', async ({ page }) => {
  await installMockSession(page)
  await profileMock(page)
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route(`${supabaseHost}/auth/v1/logout**`, async route => {
    await pending
    await route.fulfill({ status: 400, json: { code: 'synthetic_failure', message: 'Synthetic error' } })
  })
  await account(page)
  await expect(page.getByRole('button', { name: 'CERRAR SESIÓN', exact: true })).toBeVisible()
  const logout = page.waitForRequest(request => request.url().includes('/auth/v1/logout'))
  await page.getByRole('button', { name: 'CERRAR SESIÓN', exact: true }).click()
  await logout
  await switchMockSession(page, USER_B)
  const completed = page.waitForResponse(response => response.url().includes('/auth/v1/logout'))
  release()
  await completed
  await expect(page.getByRole('button', { name: 'CERRAR SESIÓN', exact: true })).toBeVisible()
  await expect(page.getByText('second@example.invalid', { exact: true })).toBeVisible()
  await expect(page.getByText(/Has salido de este navegador/)).toHaveCount(0)
})


test('enlace PKCE canjea el código, valida usuario y limpia la URL', async ({ page }) => {
  await mockSupabase(page)
  await profileMock(page)
  await page.addInitScript(key => localStorage.setItem(`${key}-code-verifier`, JSON.stringify('synthetic-verifier')), sessionStorageKey)
  let exchanges = 0
  await page.route(`${supabaseHost}/auth/v1/token?grant_type=pkce`, async route => {
    exchanges += 1
    expect(route.request().postDataJSON()).toEqual({ auth_code: 'synthetic-code', code_verifier: 'synthetic-verifier' })
    await route.fulfill({ json: makeSession() })
  })
  await page.goto('/?code=synthetic-code')
  await page.getByRole('navigation').getByRole('button', { name: 'CUENTA', exact: true }).click()
  await expect(page.getByText('first@example.invalid', { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tu perfil' })).toBeVisible()
  expect(exchanges).toBe(1)
  expect(new URL(page.url()).searchParams.has('code')).toBe(false)
})


test('enlace abierto sin verificador no inicia sesión y elimina el código residual', async ({ page }) => {
  await mockSupabase(page)
  let exchanges = 0
  await page.route(`${supabaseHost}/auth/v1/token**`, async route => { exchanges += 1; await route.fulfill({ status: 400, json: { code: 'bad_code_verifier' } }) })
  await page.goto('/?code=missing-verifier-code&sb_flow_id=missing-flow')
  await page.getByRole('navigation').getByRole('button', { name: 'CUENTA', exact: true }).click()
  await expect(page.getByText(/Este enlace necesita el navegador donde solicitaste/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Entra con tu correo' })).toBeVisible()
  expect(exchanges).toBe(0)
  const current = new URL(page.url())
  expect(current.searchParams.has('code')).toBe(false)
  expect(current.searchParams.has('sb_flow_id')).toBe(false)
  await expect(page.getByRole('region', { name: 'Tu perfil' })).toHaveCount(0)
})

test('email token link works in a fresh browser without the requesting browser verifier', async ({ browser, page, baseURL }) => {
  await mockSupabase(page)
  await page.route(`${supabaseHost}/auth/v1/otp**`, route => route.fulfill({ json: {} }))
  await account(page)
  await page.getByLabel('Correo electrónico', { exact: true }).fill('first@example.invalid')
  await page.getByRole('button', { name: 'ENVIAR ENLACE', exact: true }).click()
  await expect(page.getByText(/^Solicitud enviada\./)).toBeVisible()
  const second = await browser.newContext({ baseURL, viewport: page.viewportSize()! })
  const other = await second.newPage()
  try {
    await mockSupabase(other)
    await profileMock(other)
    let verifies = 0, pkce = 0
    await other.route(`${supabaseHost}/auth/v1/token**`, route => { pkce++; return route.fulfill({ status: 400, json: {} }) })
    await other.route(`${supabaseHost}/auth/v1/verify`, async route => {
      verifies++
      expect(route.request().postDataJSON()).toMatchObject({ token_hash: 'synthetic-email-token-hash', type: 'email' })
      await route.fulfill({ json: makeSession() })
    })
    await other.goto('/?token_hash=synthetic-email-token-hash&type=email')
    await expect(other.getByRole('region', { name: 'Tu perfil' })).toBeVisible()
    expect(verifies).toBe(1)
    expect(pkce).toBe(0)
    expect(other.url()).not.toMatch(/token_hash|synthetic-email|type=email/)
    await other.reload()
    await other.getByRole('navigation').getByRole('button', { name: 'CUENTA', exact: true }).click()
    await expect(other.getByRole('region', { name: 'Tu perfil' })).toBeVisible()
    expect(verifies).toBe(1)
  } finally { await second.close() }
})

test('a failed email token grants no session and a fresh browser can enter an emailed numeric code', async ({ page }) => {
  await mockSupabase(page)
  await profileMock(page)
  let valid = false
  await page.route(`${supabaseHost}/auth/v1/verify`, async route => {
    if (!valid) { await route.fulfill({ status: 403, headers: { 'x-supabase-api-version': '2024-01-01', 'access-control-expose-headers': 'x-supabase-api-version' }, json: { code: 'otp_expired', message: 'Synthetic expired credential' } }); return }
    expect(route.request().postDataJSON()).toMatchObject({ email: 'first@example.invalid', token: '123456', type: 'email' })
    await route.fulfill({ json: makeSession() })
  })
  await page.goto('/?token_hash=synthetic-expired-email-token&type=email')
  await expect(page.getByText(/El enlace o código ha caducado/)).toBeVisible()
  await expect(page.getByRole('region', { name: 'Tu perfil' })).toHaveCount(0)
  expect(page.url()).not.toContain('token_hash')
  await page.getByRole('button', { name: 'MI CORREO INCLUYE UN CÓDIGO', exact: true }).click()
  await page.getByLabel('Correo asociado al código', { exact: true }).fill('first@example.invalid')
  await page.getByLabel('Código de acceso', { exact: true }).fill('123456')
  valid = true
  await page.getByRole('button', { name: 'COMPROBAR CÓDIGO', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Tu perfil' })).toBeVisible()
  await expect(page.getByText(/El enlace o código ha caducado/)).toHaveCount(0)
})
