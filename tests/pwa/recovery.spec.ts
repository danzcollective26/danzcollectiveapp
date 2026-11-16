import { test, expect } from '@playwright/test'

for (const recovery of ['button', 'reconnect'] as const) {
  test(`offline preparation recovers after a rejected first attempt using ${recovery}`, async ({ page, context }) => {
    await page.addInitScript(() => {
      const worker = navigator.serviceWorker
      const register = worker.register.bind(worker)
      let first = true
      worker.register = (...args: Parameters<ServiceWorkerContainer['register']>) => {
        if (first) { first = false; return Promise.reject(new Error('Synthetic first-attempt rejection')) }
        return register(...args)
      }
    })
    await page.goto('/')
    await expect(page.getByText('El modo sin conexión aún no está listo. Puedes seguir usando DANZ con Internet.', { exact: true })).toBeVisible()
    await expect(page.getByText('Snake disponible sin conexión', { exact: true })).toHaveCount(0)
    const retry = page.getByRole('button', { name: 'REINTENTAR GUARDADO', exact: true })
    if (recovery === 'button') await retry.click()
    else {
      await context.setOffline(true)
      await expect(retry).toBeDisabled()
      await context.setOffline(false)
    }
    await expect(page.getByText('Snake disponible sin conexión', { exact: true })).toBeVisible()
    await expect(retry).toHaveCount(0)
    await context.setOffline(true)
    await page.reload()
    await page.getByRole('navigation').getByRole('button', { name: 'ARCADANZ', exact: true }).click()
  await page.locator('.arcade-choice').filter({hasText:'LA QUE HAS LIAO, JACK'}).click()
    await page.getByRole('button', { name: 'JUGAR AHORA', exact:true }).click()
    await expect(page.getByRole('button', { name: /^PAUSAR/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

test('a preparation that never settles stops waiting and leaves navigation and Snake usable', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-11T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-11-11T00:00:01Z'))
  await page.addInitScript(() => {
    navigator.serviceWorker.register = () => new Promise<ServiceWorkerRegistration>(() => {})
  })
  await page.goto('/')
  await expect(page.getByText('Preparando Snake sin conexión…', { exact: true })).toBeVisible()
  await page.clock.runFor(20_001)
  await expect(page.getByRole('button', { name: 'REINTENTAR GUARDADO', exact: true })).toBeVisible()
  await expect(page.getByText('Preparando Snake sin conexión…', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Snake disponible sin conexión', { exact: true })).toHaveCount(0)
  await page.getByRole('navigation').getByRole('button', { name: 'ARCADANZ', exact: true }).click()
  await page.locator('.arcade-choice').filter({hasText:'LA QUE HAS LIAO, JACK'}).click()
  await expect(page.getByRole('dialog',{name:'Menú de LIAO, JACK',exact:true})).toBeVisible()
  await page.clock.runFor(100)
  await page.getByRole('button', { name: 'JUGAR AHORA', exact:true }).click()
  await expect(page.getByRole('button', { name: /^PAUSAR/ })).toBeVisible()
})
