import type { Page } from '@playwright/test'

export const supabaseHost = 'https://danz-test.supabase.co'
export const sessionStorageKey = 'sb-danz-test-auth-token'
export const USER_A = '11111111-1111-4111-8111-111111111111'
export const USER_B = '22222222-2222-4222-8222-222222222222'

export function makeSession(userId = USER_A) {
  const expires = Math.floor(Date.now() / 1000) + 3600
  const user = {
    id: userId, aud: 'authenticated', role: 'authenticated',
    email: `${userId === USER_A ? 'first' : 'second'}@example.invalid`,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {}, created_at: '2026-11-09T00:00:00Z',
  }
  const payload = Buffer.from(JSON.stringify({ sub: userId, aud: 'authenticated', role: 'authenticated', exp: expires })).toString('base64url')
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  return { access_token: `${header}.${payload}.test-signature`, refresh_token: 'synthetic-refresh-token', expires_in: 3600, expires_at: expires, token_type: 'bearer', user }
}

/** Every unmatched request is mocked, so tests cannot send mail or reach a project. */
export async function mockSupabase(page: Page) {
  await page.route(`${supabaseHost}/**`, async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (path === '/auth/v1/settings') {
      await route.fulfill({ json: { external: { email: true, google: false, apple: false } } })
      return
    }
    if (path === '/auth/v1/user' && request.method() === 'GET') {
      const token = request.headers().authorization?.replace(/^Bearer /i, '')
      try {
        const payload = JSON.parse(Buffer.from(token?.split('.')[1] ?? '', 'base64url').toString()) as { sub: string }
        await route.fulfill({ json: makeSession(payload.sub).user })
      } catch {
        await route.fulfill({ status: 401, json: { code: 'session_not_found', message: 'Synthetic session missing' } })
      }
      return
    }
    if(path==='/rest/v1/rpc/danz_identity_status'){await route.fulfill({json:{verified:true,emailVerified:true,status:'verified',handle:'danz_test',profileHandle:'danz_test',code:null,expiresAt:null}});return}
    if (path === '/auth/v1/logout' && request.method() === 'POST') {
      await route.fulfill({ status: 204, body: '' })
      return
    }
    await route.fulfill({ status: 404, json: { message: 'Unconfigured synthetic test endpoint' } })
  })
}

export async function installMockSession(page: Page, userId = USER_A) {
  await mockSupabase(page)
  await page.addInitScript(({ key, session }) => {
    if (!sessionStorage.getItem('danz-test-session-seeded')) {
      localStorage.setItem(key, JSON.stringify(session))
      sessionStorage.setItem('danz-test-session-seeded', 'true')
    }
  }, { key: sessionStorageKey, session: makeSession(userId) })
}

/** Emulates an authenticated session change announced by another browser tab. */
export async function switchMockSession(page: Page, userId: string | null) {
  const session = userId ? makeSession(userId) : null
  await page.evaluate(({ key, session }) => {
    if (session) localStorage.setItem(key, JSON.stringify(session))
    else localStorage.removeItem(key)
    const channel = new BroadcastChannel(key)
    channel.postMessage({ event: session ? 'SIGNED_IN' : 'SIGNED_OUT', session })
    channel.close()
  }, { key: sessionStorageKey, session })
}
