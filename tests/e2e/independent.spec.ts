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
  await expect(page.locator('.artist-card a')).toHaveCount(15)
  await expect(page.getByRole('link', { name: 'LEÖN en SoundCloud', exact: true })).toHaveAttribute('href', 'https://soundcloud.com/leoen-358114940')
  await expect(page.getByRole('article', { name: 'Chicharro (ES)', exact: true }).getByRole('link', { name: /YouTube/ })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'TonyDawgs en YouTube · DANZ IN Records', exact: true })).toHaveAttribute('href', 'https://www.youtube.com/@DanzInRecords')
  const links = await page.locator('.artist-card a').evaluateAll(anchors => anchors.map(anchor => ({ href: (anchor as HTMLAnchorElement).href, target: (anchor as HTMLAnchorElement).target, rel: (anchor as HTMLAnchorElement).rel })))
  expect(links.every(link => !new URL(link.href).search && link.target === '_blank' && link.rel.includes('noreferrer') && link.rel.includes('noopener'))).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await nav.getByRole('button', { name: 'Arcade', exact: true }).click()
  await expect(page.locator('.game-board > .cell')).toHaveCount(169)
  await expect(page.locator('.game-board img')).toHaveCount(0)
  expect(externalRequests).toEqual([])
})
