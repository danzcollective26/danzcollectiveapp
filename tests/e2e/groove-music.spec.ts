import { expect, test, type Page } from '@playwright/test'
import { menuTab, selectReel } from './consoleMenus'
import { installMockSession, switchMockSession, supabaseHost } from './helpers/supabase'

test.use({ hasTouch: true })
// Original 127 BPM pulse fixture. No owner master is uploaded to public CI.
function pulseFixture() {
  const sampleRate = 22050, count = sampleRate * 16, wav = Buffer.alloc(44 + count * 2)
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8)
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28)
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(count * 2, 40)
  for (let i = 0; i < count; i++) {
    const t = i / sampleRate, beat = t % (60 / 127)
    wav.writeInt16LE(Math.round(Math.sin(t * 2 * Math.PI * 110) * Math.exp(-beat * 24) * 9000), 44 + i * 2)
  }
  return wav
}
async function useMediaFixture(page: Page, available = true) {
  const wav = pulseFixture()
  await page.route('**/storage/v1/object/sign/danz-music-private/**', route => available ? route.fulfill({ status: 200, contentType: 'audio/wav', body: wav }) : route.abort('failed'))
  let token = 0
  await page.route('**/functions/v1/danz-music-playback', async route => {
    expect(route.request().headers().authorization).toMatch(/^Bearer /)
    const track = route.request().postDataJSON().track
    await route.fulfill({ json: { signedUrl: `${supabaseHost}/storage/v1/object/sign/danz-music-private/${track === 'wthimh' ? 'wthimh' : 'funky-fiesta'}-v1.mp3?token=synthetic-${++token}`, expiresAt: Date.now() + 120000 } })
  })
}
async function open(page: Page, fixture = true) {
  await installMockSession(page)
  await useMediaFixture(page, fixture)
  await page.addInitScript(() => {
    localStorage.setItem('danz-yeppo-welcome-v1', 'done')
    sessionStorage.setItem('danz-yeppo-visit-peek-v1', 'done')
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unavailable', 'NotSupportedError'))
  })
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  await expect(page.getByRole('dialog', { name: 'Menú de GROOVE NINJA', exact: true })).toBeVisible()
  await menuTab(page, 'AJUSTES'); await selectReel(page, 'Música de Groove', 'FUNKY FIESTA'); await menuTab(page, 'JUGAR')
}
const elapsed = (page: Page) => page.locator('.gn-panel').getAttribute('data-elapsed').then(Number)
async function realPlayback(page: Page) {
  await page.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  await expect.poll(() => page.locator('.gn-music-audio').evaluate((audio: HTMLAudioElement) => audio.currentTime), { timeout: 12_000 }).toBeGreaterThan(.65)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'playing')
  const drift = await page.locator('.gn-music-audio').evaluate((audio: HTMLAudioElement) => Math.abs((audio.currentTime - Number(document.querySelector('.gn-panel')!.getAttribute('data-elapsed')) / 1000)))
  expect(drift).toBeLessThan(.2)
}
test('song media starts after play, clocks real cuts, mutes without resetting, pauses and resumes the same session', async ({ page }, testInfo) => {
  const requests: string[] = []
  page.on('request', request => { if (/\/object\/sign\/danz-music-private\/.*\.mp3/.test(request.url())) requests.push(request.url()) })
  await open(page)
  expect(requests).toHaveLength(0)
  await realPlayback(page)
  expect(requests.some(url => url.includes('/object/sign/danz-music-private/funky-fiesta-v1.mp3?token='))).toBe(true)
  const layer = Number(await page.locator('.gn-vinyl').first().getAttribute('data-layer'))
  await page.keyboard.press(`Digit${layer + 1}`)
  await expect.poll(() => page.getByTestId('groove-score').textContent().then(Number)).toBeGreaterThan(0)
  const beforeMute = await elapsed(page)
  await page.locator('.gn-actions').getByRole('button', { name: 'SONIDO ON', exact: true }).click()
  expect(await page.locator('.gn-music-audio').evaluate((audio: HTMLAudioElement) => audio.muted)).toBe(true)
  await expect.poll(() => elapsed(page)).toBeGreaterThan(beforeMute + 100)
  await page.getByRole('button', { name: 'PAUSAR ↗', exact: true }).click()
  const paused = await elapsed(page), score = await page.getByTestId('groove-score').textContent()
  const position = await page.locator('.gn-music-audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)
  await page.waitForTimeout(250)
  expect(await elapsed(page)).toBe(paused)
  expect(await page.locator('.gn-music-audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBe(position)
  await page.locator('.gn-actions').getByRole('button', { name: 'REANUDAR ↗', exact: true }).click()
  await expect.poll(() => elapsed(page)).toBeGreaterThan(paused + 100)
  await expect(page.getByTestId('groove-score')).toHaveText(score!)
  await page.getByRole('button', { name: 'PAUSAR ↗', exact: true }).click()
  await testInfo.attach('groove-cancion-y-pausa', { body: await page.screenshot(), contentType: 'image/png' })
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await expect(page.locator('.gn-music-audio')).toHaveCount(0)
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
})
test('WTHIMH selection persists and decoded media clocks the first Scratch gesture at 127 BPM', async ({ page }, testInfo) => {
  await open(page)
  await menuTab(page, 'AJUSTES'); await selectReel(page, 'Música de Groove', 'WTHIMH')
  await page.reload()
  await expect(page.locator('.gn-track-name')).toHaveAttribute('data-track', 'wthimh')
  await selectReel(page, 'Modo de Groove Ninja', 'SCRATCH SESSION')
  await realPlayback(page)
  await expect(page.locator('.gn-scratch')).toHaveAttribute('data-turns', '0')
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const end = performance.now() + 2000
    const tick = () => {
      const scratch = document.querySelector('.gn-scratch')!, panel = document.querySelector('.gn-panel')!
      const time = Number(panel.getAttribute('data-elapsed')), target = Number(scratch.getAttribute('data-target'))
      if (time >= target - 20 && time <= target + 90) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: scratch.getAttribute('data-direction') === '1' ? 'ArrowRight' : 'ArrowLeft', bubbles: true }))
        resolve(); return
      }
      if (performance.now() >= end) { reject(new Error('The first music pulse did not arrive')); return }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }))
  await expect(page.locator('.gn-scratch')).toHaveAttribute('data-turns', '1')
  await page.getByRole('button', { name: 'PAUSAR ↗', exact: true }).click()
  await page.locator('.gn-actions').getByRole('button', { name: 'AJUSTES', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'TU CABINA.' })).toBeVisible()
  await testInfo.attach('groove-selector-musica', { body: await page.screenshot(), contentType: 'image/png' })
  await selectReel(page, 'Música de Groove', 'ENSAYO')
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'ready')
  expect(await elapsed(page)).toBe(0)
  await expect(page.locator('.gn-music-audio')).not.toHaveAttribute('src', /mp3/)
})
test('an unavailable song pauses without losing lives and offers a playable offline practice session', async ({ page }) => {
  await open(page, false)
  await page.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'paused')
  await expect(page.getByRole('alert')).toContainText('No se pudo reproducir')
  expect(await elapsed(page)).toBe(0)
  await page.getByRole('button', { name: 'USAR ENSAYO', exact: true }).click()
  await page.locator('.gn-actions').getByRole('button', { name: 'JUGAR GROOVE NINJA ↗', exact: true }).click()
  await expect.poll(() => elapsed(page)).toBeGreaterThan(250)
  await expect(page.locator('.gn-track-name')).toHaveAttribute('data-track', 'practice')
})
test('Funky can play in the radio when a different radio file is unavailable', async ({ page }) => {
  await installMockSession(page)
  await useMediaFixture(page)
  await page.route('**/storage/v1/object/public/danz-radio/**', route => route.fulfill({ status: 404, body: '' }))
  await page.goto('/')
  const radio = page.getByRole('complementary', { name: 'Hilo musical DANZ' })
  await radio.getByRole('button', { name: 'Abrir hilo musical' }).click()
  await radio.getByRole('button', { name: 'Mostrar lista de canciones' }).click()
  await radio.locator('.danz-radio-queue').getByRole('button', { name: /Funky Fiesta/ }).click()
  const play = radio.getByRole('button', { name: 'Reproducir hilo musical', exact: true })
  await expect(play).toBeEnabled(); await play.click()
  await expect.poll(() => radio.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(.15)
  expect(await radio.locator('audio').evaluate((audio: HTMLAudioElement) => audio.error)).toBeNull()
})


test('private songs require a session while guest practice stays immediately playable', async ({ page }) => {
  const requests: string[] = []
  page.on('request', req => { if (req.url().includes('danz-music-playback')) requests.push(req.url()) })
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  await menuTab(page, 'AJUSTES'); await selectReel(page, 'Música de Groove', 'FUNKY FIESTA')
  const menu = page.getByRole('dialog', { name: 'Menú de GROOVE NINJA', exact: true })
  await expect(menu.getByRole('status')).toContainText('Inicia sesión')
  await expect(menu.getByRole('button', { name: 'JUGAR AHORA', exact: true })).toBeDisabled()
  expect(requests).toHaveLength(0)
  await menu.getByRole('button', { name: 'USAR ENSAYO', exact: true }).click()
  await menu.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  await expect.poll(() => elapsed(page)).toBeGreaterThan(250)
  await expect(page.locator('.gn-music-audio')).not.toHaveAttribute('src', /mp3/)
})
test('signing out stops protected playback and removes the temporary media source', async ({ page }) => {
  await open(page); await realPlayback(page)
  await switchMockSession(page, null)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'paused')
  await expect(page.locator('.gn-music-audio')).not.toHaveAttribute('src', /mp3/)
  const paused = await elapsed(page)
  await page.waitForTimeout(200); expect(await elapsed(page)).toBe(paused)
  await expect(page.locator('.gn-play-area').getByRole('status')).toContainText('Inicia sesión')
})
