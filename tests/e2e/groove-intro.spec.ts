import { expect, test, type Page } from '@playwright/test'

async function openFresh(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('danz-arcade-intro-force', '1')
    localStorage.setItem('danz-yeppo-welcome-v1', 'done')
    sessionStorage.setItem('danz-yeppo-visit-peek-v1', 'done')
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unavailable', 'NotSupportedError'))
  })
}

test('Groove plays a skippable intro once per session, then opens the cabinet', async ({ page }) => {
  const videos: string[] = []
  page.on('request', request => { if (request.url().includes('/arcade/intros/intro-grooveninja.mp4')) videos.push(request.url()) })
  await openFresh(page)
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  const intro = page.getByRole('dialog', { name: 'Intro de GROOVE NINJA', exact: true })
  await expect(intro).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Menú de GROOVE NINJA', exact: true })).toHaveCount(0)
  const video = intro.locator('video')
  await expect(video).toHaveAttribute('playsinline', '')
  await expect(video).toHaveAttribute('poster', '/arcade/intros/intro-grooveninja-poster.webp')
  await expect(video).toHaveAttribute('src', '/arcade/intros/intro-grooveninja.mp4')
  await expect.poll(() => videos.length).toBeGreaterThan(0)
  expect(videos.every(url => new URL(url).pathname === '/arcade/intros/intro-grooveninja.mp4')).toBe(true)
  const skip = intro.getByRole('button', { name: 'Saltar', exact: true })
  const box = await skip.boundingBox()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
  await expect.poll(async () => {
    const muted = await video.evaluate((element: HTMLVideoElement) => element.muted || element.paused)
    if (!muted) return true
    return intro.getByRole('button', { name: 'Activar sonido', exact: true }).isVisible()
  }).toBe(true)
  await skip.click()
  await expect(intro).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'Menú de GROOVE NINJA', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Volver a la biblioteca ARCADANZ', exact: true }).click()
  await page.locator('.arcade-choice').filter({ hasText: 'GROOVE NINJA' }).click()
  await expect(page.getByRole('dialog', { name: 'Menú de GROOVE NINJA', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Intro de GROOVE NINJA', exact: true })).toHaveCount(0)
})

test('the intro film ends on its own and opens the cabinet', async ({ page }) => {
  await openFresh(page)
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  await expect(page.getByRole('dialog', { name: 'Intro de GROOVE NINJA', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Menú de GROOVE NINJA', exact: true })).toBeVisible({ timeout: 12_000 })
  expect(await page.evaluate(() => sessionStorage.getItem('danz-arcade-intro-seen:groove'))).toBe('1')
})

test('reduced motion skips the Groove intro', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openFresh(page)
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  await expect(page.getByRole('dialog', { name: 'Menú de GROOVE NINJA', exact: true })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Intro de GROOVE NINJA', exact: true })).toHaveCount(0)
})

test('a missing intro file does not block Groove', async ({ page }) => {
  await page.route('**/arcade/intros/intro-grooveninja.mp4', route => route.abort('failed'))
  await openFresh(page)
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  await expect(page.getByRole('dialog', { name: 'Menú de GROOVE NINJA', exact: true })).toBeVisible()
})
