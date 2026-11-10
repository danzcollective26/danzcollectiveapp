import { expect, test } from '@playwright/test'

test('the app opens its own sections without connecting to the collective website or music platforms', async ({ page }) => {
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
  expect(links.every(link => !new URL(link.href).search && link.target === '_top' && link.rel.includes('noreferrer'))).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await nav.getByRole('button', { name: 'Arcade', exact: true }).click()
  await expect(page.locator('.game-board > .cell')).toHaveCount(169)
  await expect(page.locator('.game-board img')).toHaveCount(0)
  expect(externalRequests).toEqual([])
})

test('artist profiles leave an embedded preview instead of loading a platform inside its iframe', async ({ page, baseURL, context }) => {
  // Load the real local parent before constructing its test-only iframe. A
  // fulfilled synthetic parent has no network address and can trigger Chrome's
  // local-network gate before the application even loads in the frame.
  const embeddedUrl = new URL('/?seccion=musica', baseURL)
  embeddedUrl.hostname = 'localhost'
  const destination = 'https://soundcloud.com/chicharro-es'
  await page.route(destination, route => route.fulfill({ contentType: 'text/html', headers: { 'Content-Security-Policy': "frame-ancestors 'none'", 'X-Frame-Options': 'DENY' }, body: '<!doctype html><title>Artista</title><h1>Perfil del artista</h1>' }))
  await page.goto('/')
  await page.setContent(`<!doctype html><title>Vista previa</title><iframe title="DANZ" sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation" src="${embeddedUrl.href}"></iframe>`)
  const frame = page.frameLocator('iframe')
  await frame.getByRole('link', { name: 'Escuchar a Chicharro (ES)', exact: true }).click()
  await expect(page).toHaveURL(destination)
  await expect(page.getByRole('heading', { name: 'Perfil del artista' })).toBeVisible()
  expect(context.pages()).toHaveLength(1)
})

test('every artist link navigates in the same tab and Back restores the music section', async ({ page, context }) => {
  test.setTimeout(90000)
  // Simulated destinations verify actual browser navigation without depending on
  // third-party login, bot screening or sending visitors' data to those services.
  await page.route(/^https:\/\/(soundcloud\.com|open\.spotify\.com|www\.instagram\.com|www\.youtube\.com|www\.mavelpoint\.com)\//, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Perfil de prueba</title><h1>Destino de prueba</h1>' }))
  await page.goto('/?seccion=musica')
  const links = await page.locator('.artist-card a').evaluateAll(anchors => anchors.map(anchor => ({ label: anchor.getAttribute('aria-label')!, href: (anchor as HTMLAnchorElement).href })))
  expect(links).toHaveLength(19)
  for (const link of links) {
    await page.getByRole('link', { name: link.label, exact: true }).click()
    await expect(page).toHaveURL(link.href)
    await expect(page.getByRole('heading', { name: 'Destino de prueba' })).toBeVisible()
    expect(context.pages()).toHaveLength(1)
    await page.goBack()
    await expect(page).toHaveURL(/seccion=musica/)
    await expect(page.getByRole('heading', { name: 'Chicharro (ES)', exact: true })).toBeVisible()
  }
  await page.getByRole('navigation').getByRole('button', { name: 'Inicio', exact: true }).click()
  expect(new URL(page.url()).searchParams.has('seccion')).toBe(false)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'WE ARE DANZ.' })).toBeVisible()
})
