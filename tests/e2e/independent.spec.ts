import { expect, test } from '@playwright/test'

test('the app opens its own sections without connecting to the collective website or music platforms', async ({ page }) => {
  // Catalog refresh may be unavailable; the bundled shop must remain usable.
  await page.route('https://danzcolective.myshopify.com/api/2026-10/graphql.json', route => route.abort())
  const externalRequests: string[] = []
  page.on('request', request => {
    if (/danzcollective\.com|spotify\.com|soundcloud\.com|youtube\.com|instagram\.com|mavelpoint\.com/.test(new URL(request.url()).hostname)) externalRequests.push(request.url())
  })
  await page.goto('/')
  const nav = page.getByRole('navigation')
  await nav.getByRole('button', { name: 'DANZFLOR', exact: true }).click()
  await expect(page.getByText('La ropa del colectivo.', { exact: false })).toBeVisible()
  await expect(page.getByRole('link', { name: 'VISITAR LA WEB OFICIAL' })).toHaveCount(0)
  await nav.getByRole('button', { name: 'DANZ IN', exact: true }).click()
  for (const name of ['Chicharro (ES)', 'TonyDawgs', 'Wizme', 'LEÖN']) await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(4)
  await expect(page.locator('.artist-links a')).toHaveCount(15)
  await expect(page.locator('.artist-portrait img')).toHaveCount(4)
  await expect.poll(() => page.locator('.artist-portrait img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
  await expect(page.getByRole('link', { name: 'LEÖN en SoundCloud', exact: true })).toHaveAttribute('href', 'https://soundcloud.com/leoen-358114940')
  await expect(page.getByRole('article', { name: 'Chicharro (ES)', exact: true }).getByRole('link', { name: /YouTube/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'TonyDawgs en YouTube · DANZ IN Records', exact: true })).toHaveAttribute('href', 'https://www.youtube.com/@DanzInRecords')
  const links = await page.locator('.artist-card a').evaluateAll(anchors => anchors.map(anchor => ({ href: (anchor as HTMLAnchorElement).href, target: (anchor as HTMLAnchorElement).target, rel: (anchor as HTMLAnchorElement).rel })))
  expect(links.every(link => !new URL(link.href).search && link.target === '_blank' && link.rel.includes('noreferrer') && link.rel.includes('noopener'))).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await nav.getByRole('button', { name: 'ARCADANZ', exact: true }).click()
  await expect(page.locator('.game-board > .cell')).toHaveCount(169)
  const head = page.locator('.game-board .head img')
  await expect(head).toHaveAttribute('src', '/arcade/brand/danz-flower.png')
  await expect.poll(() => head.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
  await expect(page.locator('.game-board .cell:not(.head) img')).toHaveCount(0)
  await page.locator('.idle-cover').scrollIntoViewIfNeeded()
  const studio = page.locator('.idle-cover img')
  await expect(studio).toHaveAttribute('src', '/arcade/idle-studio-industrial.webp')
  await expect.poll(() => studio.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(1200)
  await expect(page.getByText('Nombre y carátula provisionales.', { exact: true })).toBeVisible()
  expect(externalRequests).toEqual([])
})

test('artist profiles open externally when the embedded host forbids top navigation', async ({ page, context }) => {
  const destination = 'https://soundcloud.com/chicharro-es'
  await context.route(destination, route => route.fulfill({ contentType: 'text/html', headers: { 'Content-Security-Policy': "frame-ancestors 'none'", 'X-Frame-Options': 'DENY' }, body: '<!doctype html><title>Artista</title><h1>Perfil del artista</h1>' }))
  await page.goto('/tests/ui/artist-links.html')
  const frame = page.frameLocator('iframe')
  const opened = context.waitForEvent('page')
  await frame.getByRole('link', { name: 'Escuchar a Chicharro (ES)', exact: true }).click()
  const external = await opened
  await expect(external).toHaveURL(destination)
  await expect(external.getByRole('heading', { name: 'Perfil del artista' })).toBeVisible()
  await expect(page).toHaveURL(/tests\/ui\/artist-links\.html/)
  await expect(frame.getByRole('heading', { name: 'DANZ IN.', exact: true })).toBeVisible()
  expect(await external.evaluate(() => window.opener === null)).toBe(true)
  await external.close()
})

test('every artist link opens its platform while music and an unclaimed event pass remain available', async ({ page, context }) => {
  test.setTimeout(90000)
  // Simulated destinations verify actual browser navigation without depending on
  // third-party login, bot screening or sending visitors' data to those services.
  await context.route(/^https:\/\/(soundcloud\.com|open\.spotify\.com|www\.instagram\.com|www\.youtube\.com|www\.mavelpoint\.com)\//, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Perfil de prueba</title><h1>Destino de prueba</h1>' }))
  await page.addInitScript(() => localStorage.setItem('danz-pending-event-pass', 'DANZLINKS12345678'))
  await page.goto('/?seccion=musica')
  const links = await page.locator('.artist-card a').evaluateAll(anchors => anchors.map(anchor => ({ label: anchor.getAttribute('aria-label')!, href: (anchor as HTMLAnchorElement).href })))
  expect(links).toHaveLength(19)
  for (const link of links) {
    const opened = context.waitForEvent('page')
    await page.getByRole('link', { name: link.label, exact: true }).click()
    const external = await opened
    await expect(external).toHaveURL(link.href)
    await expect(external.getByRole('heading', { name: 'Destino de prueba' })).toBeVisible()
    expect(await external.evaluate(() => window.opener === null)).toBe(true)
    await external.close()
    await expect(page).toHaveURL(/seccion=musica/)
    await expect(page.getByRole('heading', { name: 'Chicharro (ES)', exact: true })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('danz-pending-event-pass'))).toBe('DANZLINKS12345678')
  }
  await page.getByRole('navigation').getByRole('button', { name: 'Inicio', exact: true }).click()
  expect(new URL(page.url()).searchParams.has('seccion')).toBe(false)
  await expect(page.getByRole('heading', { name: 'WE ARE DANZ.' })).toBeVisible()
})
