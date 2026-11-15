import { test, expect } from '@playwright/test'

test('a production build reopens offline and plays Snake without caching photos or callback credentials', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByText('Snake disponible sin conexión', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  const manifest = await (await page.request.get('/manifest.webmanifest')).json()
  expect(manifest.start_url).toBe('/'); expect(manifest.icons).toHaveLength(3)
  await page.evaluate(async () => { await fetch('/private-photo.jpg?token=synthetic-secret') })
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText('Sin conexión.', { exact: false })).toBeVisible()
  await page.getByRole('navigation').getByRole('button', { name: 'ARCADANZ', exact: true }).click()
  await page.locator('.arcade-choice').filter({hasText:'LA QUE HAS LIAO, JACK'}).click()
  await page.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  await expect(page.getByRole('button', { name: /^PAUSAR/ })).toBeVisible()
  const callbacksBypassed = await page.evaluate(async () => {
    try { await fetch('/?token_hash=synthetic-secret&type=email'); return false } catch { return true }
  })
  expect(callbacksBypassed).toBe(true)
  const cached = await page.evaluate(async () => {
    const urls: string[] = []
    for (const name of await caches.keys()) for (const request of await (await caches.open(name)).keys()) urls.push(request.url)
    return urls
  })
  expect(cached.length).toBeGreaterThan(5)
  expect(cached.some(url => new URL(url).pathname === '/arcade/idle-studio-industrial.webp')).toBe(true)
  expect(cached.every(url => !new URL(url).search && new URL(url).origin === 'http://127.0.0.1:4175')).toBe(true)
  expect(cached.some(url => /supabase|token|private-photo|backup-galerias/.test(url))).toBe(false)
})

test('Groove Ninja and its sound-free practice reopen offline from the cached game link', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByText('Snake disponible sin conexión', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  await context.setOffline(true)
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  await expect(page.getByRole('heading', { name: 'GROOVE NINJA.', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'SONIDO ON', exact: true }).click()
  await page.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  await expect(page.getByRole('button', { name: 'PAUSAR ↗', exact: true })).toBeVisible()
  await expect.poll(() => page.locator('.gn-vinyl').count()).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  await page.locator('.arcade-choice').filter({hasText:'LA QUE HAS LIAO, JACK'}).click()
  await page.getByRole('button',{name:'JUGAR AHORA',exact:true}).click()
  await expect(page.locator('.game-board')).toBeVisible()
})
