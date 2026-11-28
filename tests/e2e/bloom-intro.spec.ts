import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('danz-arcade-intro-force', '1')
      localStorage.setItem('danz-yeppo-welcome-v1', 'done')
      sessionStorage.setItem('danz-yeppo-visit-peek-v1', 'done')
    } catch { /* storage optional */ }
  })
})

test('Jack opens with the flower intro once per session and Saltar enters the game', async ({ page }) => {
  await page.goto('/?seccion=arcade&juego=jack')
  const intro = page.getByRole('dialog', { name: 'Intro de LA QUE HAS LIAO, JACK' })
  await expect(intro).toBeVisible()
  await expect(intro.locator('.arcade-bloom-cover')).toHaveCSS('background-image', /jack-approved-mobile\.webp/)
  await intro.getByRole('button', { name: 'Saltar' }).click()
  await expect(intro).toHaveCount(0)
  await expect(page.getByRole('button', { name: /JUGAR AHORA/ }).first()).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: /JUGAR AHORA/ }).first()).toBeVisible()
  await expect(page.getByRole('dialog', { name: /^Intro de/ })).toHaveCount(0)
})

test('Collecta and DANZPORTER intros finish on their own in about three seconds', async ({ page }) => {
  for (const [route, title] of [['collecta', 'DANZ COLLECTA'], ['kart', 'DANZPORTER']] as const) {
    await page.goto(`/?seccion=arcade&juego=${route}`)
    const intro = page.getByRole('dialog', { name: `Intro de ${title}` })
    await expect(intro).toBeVisible()
    await expect(intro).toHaveCount(0, { timeout: 6000 })
  }
})

test('reduced motion skips the coded intro', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/?seccion=arcade&juego=collecta')
  await expect(page.getByRole('button', { name: /JUGAR ARENA/ }).first()).toBeVisible()
  await expect(page.getByRole('dialog', { name: /^Intro de/ })).toHaveCount(0)
})
