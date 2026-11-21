import { MAZE_STAGES } from '../../src/snake'
import { selectReel } from './consoleMenus'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('danz-yeppo-welcome-v1', 'done')
    sessionStorage.setItem('danz-yeppo-visit-peek-v1', 'done')
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unavailable', 'NotSupportedError'))
  })
})

test('library displays both complete approved covers without horizontal overflow', async ({ page }) => {
  await page.goto('/?seccion=arcade')
  const covers = page.locator('.arcade-library .arcade-choice img[src$="approved-mobile.webp"]')
  await expect(covers).toHaveCount(2)
  await expect(covers.nth(0)).toHaveAttribute('src', '/arcade/jack-approved-mobile.webp')
  await expect(covers.nth(1)).toHaveAttribute('src', '/arcade/groove-ninja-approved-mobile.webp')
  for (const cover of await covers.all()) {
    await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(720)
    await expect(cover).toHaveCSS('object-fit', 'contain')
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(page.locator('.game-panel,.gn-panel')).toHaveCount(0)
})

test('Jack opens immersive, allows maze selection, plays and returns to the library', async ({ page }) => {
  await page.goto('/?seccion=arcade')
  await page.locator('.arcade-choice').filter({ hasText: 'LA QUE HAS LIAO, JACK' }).click()
  await expect(page.locator('.game-panel')).toHaveClass(/is-immersive/)
  const launch = page.locator('.arcade-console-menu')
  await selectReel(page,'Modo de Snake','LABERINTO')
  await selectReel(page,'Recorrido del laberinto',MAZE_STAGES[11])
  await launch.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  await expect(launch).toHaveCount(0)
  await expect(page.locator('.game-heading')).toContainText('NIVEL 12')
  await expect(page.locator('.yeppo')).toHaveCount(0)
  await page.getByRole('button', { name: /SALIR DEL JUEGO/ }).click()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  await expect(page.locator('.game-panel')).toHaveCount(0)
  expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden')
})

test('Groove opens immersive, starts Scratch Session and Escape returns to the library', async ({ page }) => {
  await page.goto('/?seccion=arcade')
  await page.locator('.arcade-choice').filter({ hasText: 'GROOVE NINJA' }).click()
  await expect(page.locator('.gn-panel')).toHaveClass(/gn-immersive/)
  const launch = page.locator('.arcade-console-menu')
  await selectReel(page,'Modo de Groove Ninja','SCRATCH SESSION')
  await launch.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-mode', 'scratch')
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'playing')
  await page.keyboard.press('Escape')
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden')
})

test('browser history restores the library and selected game', async ({ page }) => {
  await page.goto('/?seccion=arcade')
  await page.locator('.arcade-choice').filter({ hasText: 'GROOVE NINJA' }).click()
  await expect(page).toHaveURL(/juego=groove-ninja/)
  await page.goBack()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  await page.goForward()
  await expect(page.locator('.gn-panel')).toHaveClass(/gn-immersive/)
  await page.getByRole('button', { name: 'Volver a la biblioteca ARCADANZ', exact: true }).click()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
})

test('Yeppo hand reaches a real card, reacts in sync and cancels when the page scrolls', async ({ page }) => {
  await page.goto('/test')
  // The approved Home intro is taller than one mobile viewport. Bring an
  // interactive card into view before asking Yeppo to visit it.
  await page.locator('.test-lab').first().scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Hablar con Yeppo', exact: true }).click()
  await page.getByRole('button', { name: /VER A YEPPO PASEARSE/ }).click()
  const stage = page.locator('.yeppo-visiting-card')
  await expect(stage).toBeAttached()
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('.yeppo-roam-stage,.yeppo-playful-tap,.yeppo-roam-stage *')) {
      for (const animation of el.getAnimations()) {
        animation.pause()
        animation.currentTime = 4100
      }
    }
  })
  const contact = await page.evaluate(() => {
    const hand = document.querySelector('.yeppo-contact-point')!.getBoundingClientRect()
    const card = document.querySelector('.yeppo-playful-tap')!.getBoundingClientRect()
    const arm = document.querySelector('.yeppo-contact-arm')!
    return { x: hand.x + hand.width / 2, y: hand.y + hand.height / 2, left: card.left, right: card.right, top: card.top, bottom: card.bottom, opacity: getComputedStyle(arm).opacity }
  })
  expect(contact.x).toBeGreaterThan(contact.left)
  expect(contact.x).toBeLessThan(contact.right)
  expect(contact.y).toBeGreaterThan(contact.top)
  expect(contact.y).toBeLessThan(contact.bottom)
  expect(Math.abs(contact.x - (contact.right - 18))).toBeLessThan(2)
  expect(contact.opacity).toBe('1')
  await expect(page).toHaveURL(/\/$/)
  await page.evaluate(() => window.scrollBy(0, 80))
  await expect(page.getByTestId('yeppo-walkabout')).toHaveCount(0)
  await expect(page.locator('.yeppo-playful-tap')).toHaveCount(0)
})

test('reduced motion keeps Yeppo stationary without highlighting cards', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/test')
  await page.getByRole('button', { name: 'Hablar con Yeppo', exact: true }).click()
  await page.getByRole('button', { name: /VER A YEPPO PASEARSE/ }).click()
  await expect(page.locator('.yeppo-roam-stage')).toHaveCSS('animation-name', 'none')
  await expect(page.locator('.yeppo-playful-tap')).toHaveCount(0)
})
