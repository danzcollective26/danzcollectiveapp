import { expect, test, type Page } from '@playwright/test'
test.use({ hasTouch: true })

async function openGroove(page: Page) {
  await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError')) })
  await page.clock.install({ time: new Date('2026-11-12T15:00:00Z') })
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  await expect(page.getByRole('heading', { name: 'GROOVE NINJA.', exact: true })).toBeVisible()
  // React's lazy boundary must finish before freezing timers for input checks.
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000))
  await page.clock.runFor(3000)
  const sound=page.locator('.arcade-launch').getByRole('button',{name:'SONIDO ON',exact:true})
  if(await sound.isVisible()) await sound.click()
}
async function start(page: Page) {
  const launch=page.locator('.arcade-launch')
  if(await launch.isVisible()) await launch.getByRole('button',{name:'JUGAR AHORA',exact:true}).click()
  else await page.locator('.gn-actions').getByRole('button',{name:/^(JUGAR GROOVE NINJA|REANUDAR)/}).click()
  await page.clock.runFor(700)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'playing')
}
async function target(page: Page) {
  const rect = await page.locator('.gn-board').boundingBox()
  const disc = await page.locator('.gn-vinyl').first().evaluate(el => ({ x: Number(el.getAttribute('data-x')), y: Number(el.getAttribute('data-y')) }))
  return { x: rect!.x + disc.x * rect!.width / 640, y: rect!.y + disc.y * rect!.height / 760, dx: 95 * rect!.width / 640 }
}
async function slice(page: Page) {
  const p = await target(page)
  await page.mouse.move(p.x - p.dx, p.y); await page.mouse.down(); await page.mouse.move(p.x + p.dx, p.y, { steps: 1 }); await page.mouse.up()
}

test('game selection opens Groove directly in full viewport, ready to play', async ({ page }) => {
  await page.addInitScript(() => { Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError')) })
  await page.goto('/?seccion=arcade')
  await page.locator('.arcade-chooser').getByRole('button', { name: /GROOVE NINJA/ }).click()
  await expect(page.locator('.gn-panel')).toHaveClass(/gn-immersive/)
  await expect(page.locator('.arcade-launch')).toBeAttached()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'ready')
  await expect(page.locator('.arcade-launch-loading')).toBeVisible()
  await page.waitForTimeout(3200)
  await page.locator('.arcade-launch-mode-picker').getByRole('button', { name: 'SCRATCH SESSION' }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-mode', 'scratch')
  await expect(page.locator('.gn-panel')).toHaveClass(/gn-immersive/)
  await page.getByRole('button', { name: 'Volver a la biblioteca ARCADANZ', exact: true }).click()
  await expect(page.locator('.gn-panel')).toHaveCount(0)
})

test('a fast swipe cuts immediately, splits a vinyl and advances its streak exactly once', async ({ page }) => {
  await openGroove(page); await start(page); await slice(page)
  await expect(page.getByTestId('groove-score')).toHaveText('00100')
  await expect(page.locator('.gn-cut-pieces')).toHaveCount(1)
  await expect(page.locator('.gn-cut-pieces [clip-path]')).toHaveCount(2)
  await expect(page.locator('.gn-music-note')).toHaveCount(3)
  await expect(page.getByRole('meter', { name: 'Racha de la sesión' })).toHaveAttribute('aria-valuenow', '1')
  await page.clock.runFor(900)
  await expect(page.locator('.gn-cut-pieces')).toHaveCount(0)
  await expect(page.getByTestId('groove-score')).toHaveText('00100')
})
test('Split Disc produces two cuttable minis and Combo Disc visibly arms the next stroke', async ({page}) => {
  await openGroove(page); await start(page); await slice(page)
  await page.clock.runFor(1400)
  const split = page.locator('.gn-vinyl[data-special="split"]')
  await expect(split).toHaveCount(1)
  const layer = Number(await split.getAttribute('data-layer'))
  await page.keyboard.press(`Digit${layer+1}`)
  await expect(page.locator('.gn-vinyl[data-fragment="true"]')).toHaveCount(2)
  const before = Number(await page.getByTestId('groove-score').textContent())
  await page.keyboard.press(`Digit${layer+1}`)
  expect(Number(await page.getByTestId('groove-score').textContent())).toBeGreaterThan(before)
  let found = false
  for(let i=0;i<24&&!found;i++) {
    await page.clock.runFor(300)
    const discs = await page.locator('.gn-vinyl').evaluateAll(nodes=>nodes.map(el=>({layer:Number(el.getAttribute('data-layer')),y:Number(el.getAttribute('data-y')),axis:el.getAttribute('data-axis'),special:el.getAttribute('data-special')})))
    for(const disc of discs) {
      if(disc.y<=80||disc.y>=650)continue
      await page.keyboard.press(`${disc.special==='arrow'&&disc.axis==='y'?'Shift+':''}Digit${disc.layer+1}`)
      if(disc.special==='combo'){found=true;break}
    }
  }
  expect(found).toBe(true)
  await expect(page.locator('.gn-combo small')).toContainText('×2 LISTO')
})
test('the gold HUD pauses its rotation and the sound dojo respects reduced motion', async ({ page }) => {
  await openGroove(page)
  const icon = page.locator('.gn-hud-vinyl')
  expect(await icon.evaluate(el => getComputedStyle(el).animationPlayState)).toBe('paused')
  await start(page)
  expect(await icon.evaluate(el => getComputedStyle(el).animationPlayState)).toBe('running')
  await expect(page.locator('#gn-grain')).toHaveCount(1)
  await page.getByRole('button', { name: 'PAUSAR ↗', exact: true }).click()
  expect(await icon.evaluate(el => getComputedStyle(el).animationPlayState)).toBe('paused')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await icon.evaluate(el => getComputedStyle(el).animationName)).toBe('none')
})
test('touchmove scores before touchend and cannot scroll the play surface', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium')
  await openGroove(page); await start(page)
  const p = await target(page), before = await page.evaluate(() => window.scrollY)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x - p.dx, y: p.y }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p.x + p.dx, y: p.y }] })
  await expect(page.getByTestId('groove-score')).toHaveText('00100')
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  expect(await page.evaluate(() => window.scrollY)).toBe(before)
  await cdp.detach()
})
test('pause, tab hiding and exit freeze play; local record and sound choice survive reload', async ({ page }) => {
  await openGroove(page); await start(page); await slice(page)
  await page.getByRole('button', { name: 'PAUSAR ↗', exact: true }).click()
  const board = await page.locator('.gn-board').getAttribute('aria-label')
  await page.clock.runFor(6000)
  await expect(page.locator('.gn-board')).toHaveAttribute('aria-label', board!)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'paused')
  await page.getByRole('button', { name: 'REANUDAR ↗', exact: true }).click()
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'paused')
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await expect(page.locator('.gn-panel')).toHaveCount(0)
  expect(await page.locator('body').evaluate(el => el.style.overflow)).not.toBe('hidden')
  await page.clock.resume()
  await page.reload()
  await page.locator('.arcade-choice').filter({hasText:'GROOVE NINJA'}).click()
  await expect(page.locator('.arcade-launch').getByRole('button', { name: 'SONIDO OFF', exact: true })).toBeVisible()
  await expect(page.locator('.gn-bottom')).toContainText('RÉCORD LOCAL 100')
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'ready')
})
async function nextScratchPulse(page: Page) {
  const target = Number(await page.locator('.gn-scratch').getAttribute('data-target'))
  const elapsed = Number(await page.locator('.gn-panel').getAttribute('data-elapsed'))
  await page.clock.runFor(Math.max(0, target - elapsed))
}
async function keyboardPhrase(page: Page) {
  const count = Number(await page.locator('.gn-scratch').getAttribute('data-pattern')) === 1 ? 3 : 4
  for (let i = 0; i < count; i++) {
    const direction = Number(await page.locator('.gn-scratch').getAttribute('data-direction'))
    await nextScratchPulse(page)
    await page.keyboard.press(direction > 0 ? 'ArrowRight' : 'ArrowLeft')
  }
}
test('scratch rejects early reversals and rewards a complete rhythmic pointer phrase', async ({ page }) => {
  await openGroove(page)
  await page.locator('.arcade-launch-mode-picker').getByRole('button', { name: 'SCRATCH SESSION',exact:true }).click()
  await start(page)
  const rect = await page.locator('.gn-board').boundingBox()
  const x = (n: number) => rect!.x + n * rect!.width / 640, y = rect!.y + 355 * rect!.height / 760
  await page.mouse.move(x(260), y); await page.mouse.down()
  for (const n of [330, 260, 330, 260]) await page.mouse.move(x(n), y, { steps: 1 })
  await expect(page.locator('.gn-scratch')).toHaveAttribute('data-turns', '0')
  await expect(page.getByTestId('groove-score')).toHaveText('00000')
  await page.mouse.up(); await page.mouse.move(x(260), y); await page.mouse.down()
  let position = 260
  for (let i = 0; i < 4; i++) {
    const direction = Number(await page.locator('.gn-scratch').getAttribute('data-direction'))
    await nextScratchPulse(page)
    position += direction * 70
    await page.mouse.move(x(position), y, { steps: 1 })
    if (i < 3) await expect(page.locator('.gn-scratch')).toHaveAttribute('data-turns', String(i + 1))
  }
  await page.mouse.up()
  await expect(page.locator('.gn-scratch')).toHaveCount(0)
  await expect(page.getByTestId('groove-score')).toHaveText('00500')
  await expect(page.getByRole('status').filter({ hasText: 'FRASE COMPLETA' })).toBeVisible()
})
test('a long pull needs its full distance and releasing only repositions the hand', async ({ page }) => {
  await openGroove(page)
  await page.locator('.arcade-launch-mode-picker').getByRole('button', { name: 'SCRATCH SESSION',exact:true }).click()
  await start(page); await keyboardPhrase(page); await page.clock.runFor(700)
  await expect(page.locator('.gn-scratch')).toHaveAttribute('data-pattern', '1')
  const rect = await page.locator('.gn-board').boundingBox()
  const x = (n: number) => rect!.x + n * rect!.width / 640, y = rect!.y + 355 * rect!.height / 760
  await page.mouse.move(x(350), y); await page.mouse.down(); await nextScratchPulse(page)
  await page.mouse.move(x(294), y)
  await expect(page.locator('.gn-scratch')).toHaveAttribute('data-turns', '0')
  await page.mouse.move(x(240), y)
  await expect(page.locator('.gn-scratch')).toHaveAttribute('data-turns', '1')
  await page.mouse.up(); await page.mouse.move(x(350), y); await page.mouse.down(); await page.mouse.up()
  await expect(page.locator('.gn-scratch')).toHaveAttribute('data-turns', '1')
  await page.clock.runFor(1300)
  await expect(page.getByTestId('groove-score')).toHaveText('00500')
  await expect(page.getByRole('status').filter({ hasText: 'SE ESCAPÓ EL PULSO' })).toBeVisible()
})
test('weapons change during play without resetting score or time', async ({ page }) => {
  await openGroove(page); await start(page); await slice(page)
  const elapsed = await page.locator('.gn-panel').getAttribute('data-elapsed')
  await page.getByRole('button', { name: /^DOBLE FILO/ }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-weapon', 'twin')
  await page.keyboard.press('e')
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-weapon', 'needle')
  await expect(page.getByTestId('groove-score')).toHaveText('00100')
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-elapsed', elapsed!)
  await page.clock.runFor(1500)
  const target = page.locator('.gn-vinyl').filter({ has: page.locator('text') }).last()
  const layer = Number(await target.getAttribute('data-layer'))
  await page.keyboard.press(`Digit${layer + 1}`)
  expect(Number(await page.getByTestId('groove-score').textContent())).toBeGreaterThan(100)
})
test('playfield, mixer and primary controls fit 320px portrait and short landscape', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await openGroove(page); await start(page)
  for (const size of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size)
    for (const selector of ['.gn-top', '.gn-hud', '.gn-challenge-bar', '.gn-play-area', '.gn-flow', '.gn-actions']) {
      const r = await page.locator(selector).boundingBox()
      expect(r!.x).toBeGreaterThanOrEqual(0); expect(r!.y).toBeGreaterThanOrEqual(0)
      expect(r!.x + r!.width).toBeLessThanOrEqual(size.width + 1); expect(r!.y + r!.height).toBeLessThanOrEqual(size.height + 1)
    }
    const r = await page.locator('.gn-board').boundingBox()
    expect(Math.abs(r!.width / r!.height - 640 / 760)).toBeLessThan(.01)
    await page.getByRole('button', { name: 'AJUSTES', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'TU CABINA.', exact: true })
    const d = (await dialog.boundingBox())!
    expect(d.x).toBeGreaterThanOrEqual(0); expect(d.y).toBeGreaterThanOrEqual(0)
    expect(d.x+d.width).toBeLessThanOrEqual(size.width); expect(d.y+d.height).toBeLessThanOrEqual(size.height)
    const close = dialog.getByRole('button', { name: 'Cerrar ajustes de Groove', exact: true })
    expect(await close.evaluate(el => { const r=el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+8)) })).toBe(true)
    await close.click()
  }
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
})
test('browser history restores the library and reopens an immersive selected game', async ({ page }) => {
  await openGroove(page)
  await page.getByRole('button',{name:'Volver a la biblioteca ARCADANZ',exact:true}).click()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  await page.locator('.arcade-choice').filter({hasText:'GROOVE NINJA'}).click()
  await page.goBack()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  await page.goForward()
  await expect(page.locator('.gn-panel')).toHaveClass(/gn-immersive/)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status','ready')
  await page.getByRole('button',{name:'Volver a la biblioteca ARCADANZ',exact:true}).click()
  await page.getByRole('navigation').getByRole('button',{name:'INICIO',exact:true}).click()
  await expect(page).not.toHaveURL(/juego=/)
})
test('an unattended session ends with PARTY OVER and offers a clean new session', async ({ page }) => {
  await openGroove(page); await start(page)
  await page.clock.runFor(12_000)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'over')
  await expect(page.getByText('PARTY OVER', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'OTRA SESIÓN ↗', exact: true }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'playing')
  await expect(page.getByTestId('groove-score')).toHaveText('00000')
  await expect(page.locator('.gn-board')).toHaveAttribute('aria-label', 'Cabina de Groove Ninja, 0 cortes, 0 scratches, 5 vidas')
})
test('audio starts only from play, suspends on pause and closes when leaving the game', async ({ page }) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Unsupported', 'NotSupportedError'))
    const original = window.AudioContext
    ;(window as any).__grooveContexts = []
    window.AudioContext = class extends original {
      constructor(options?: AudioContextOptions) { super(options); (window as any).__grooveContexts.push(this) }
    }
  })
  await page.goto('/?seccion=arcade&juego=groove-ninja')
  await expect(page.getByRole('button', { name: 'JUGAR AHORA', exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as any).__grooveContexts.length)).toBe(0)
  await page.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__grooveContexts[0]?.state)).toBe('running')
  await page.getByRole('button', { name: 'PAUSAR ↗', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__grooveContexts[0]?.state)).toBe('suspended')
  await page.getByRole('button', { name: 'REANUDAR ↗', exact: true }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__grooveContexts[0]?.state)).toBe('running')
  expect(await page.evaluate(() => (window as any).__grooveContexts.length)).toBe(1)
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as any).__grooveContexts[0]?.state)).toBe('closed')
})
test('changing modes starts the selected challenge and keeps each local record separate', async ({ page }) => {
  await openGroove(page); await start(page); await slice(page)
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await page.locator('.arcade-choice').filter({hasText:'GROOVE NINJA'}).click()
  await expect(page.locator('.arcade-launch-loading')).toBeVisible()
  await page.clock.runFor(3000)
  await page.locator('.arcade-launch-mode-picker').getByRole('button', { name: 'SCRATCH SESSION',exact:true }).click()
  await expect(page.locator('.gn-bottom')).toContainText('RÉCORD LOCAL 0')
  await start(page)
  await expect(page.locator('.gn-vinyl')).toHaveCount(0)
  await keyboardPhrase(page)
  await expect(page.getByTestId('groove-score')).toHaveText('00500')
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await page.locator('.arcade-choice').filter({hasText:'GROOVE NINJA'}).click()
  await expect(page.locator('.arcade-launch-loading')).toBeVisible()
  await page.clock.runFor(3000)
  await page.locator('.arcade-launch-mode-picker').getByRole('button', { name: 'VINYL CUT',exact:true }).click()
  await expect(page.locator('.gn-bottom')).toContainText('RÉCORD LOCAL 100')
  await expect(page.getByTestId('groove-score')).toHaveText('00000')
})

test('visual options pause the session, keep keyboard focus and persist softer effects', async ({ page }) => {
  await openGroove(page); await start(page); await slice(page)
  await page.getByRole('button', { name: 'AJUSTES', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'TU CABINA.', exact: true })
  await expect(dialog).toBeVisible()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'paused')
  const elapsed = await page.locator('.gn-panel').getAttribute('data-elapsed')
  await page.clock.runFor(3000)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-elapsed', elapsed!)
  await expect(dialog.getByRole('button', { name: /TRAZO CLUB/ })).toBeDisabled()
  await dialog.getByRole('button', { name: /^SUAVES/ }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-effects', 'lite')
  await expect(page.locator('.gn-hud-vinyl')).toHaveCSS('animation-name', 'none')
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Cerrar ajustes de Groove', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'AJUSTES', exact: true })).toBeFocused()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'paused')
  await expect(page.getByTestId('groove-score')).toHaveText('00100')
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await page.locator('.arcade-choice').filter({ hasText: 'GROOVE NINJA' }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-effects', 'lite')
  await page.clock.runFor(3000)
  await page.getByRole('button', { name: 'JUGAR AHORA', exact: true }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-status', 'playing')
})

test('twenty successful vinyl cuts unlock Trazo Club without changing score or time on selection', async ({ page }) => {
  await openGroove(page); await start(page)
  for (let i=0; i<90; i++) {
    const hits = Number((await page.locator('.gn-board').getAttribute('aria-label'))?.match(/(\d+) cortes/)?.[1] ?? 0)
    if (hits >= 20) break
    const discs = await page.locator('.gn-vinyl').evaluateAll(nodes => nodes.map(el => ({ layer: Number(el.getAttribute('data-layer')), y: Number(el.getAttribute('data-y')), axis: el.getAttribute('data-axis'), special: el.getAttribute('data-special') })))
    for (const disc of discs) {
      if (disc.y<=80 || disc.y>=650) continue
      await page.keyboard.press(`${disc.special==='arrow' && disc.axis==='y' ? 'Shift+' : ''}Digit${disc.layer+1}`)
    }
    await page.clock.runFor(250)
  }
  await page.getByRole('button', { name: 'AJUSTES', exact: true }).click()
  const club = page.getByRole('dialog').getByRole('button', { name: /TRAZO CLUB/ })
  await expect(club).toBeEnabled()
  const score = await page.getByTestId('groove-score').textContent(), elapsed = await page.locator('.gn-panel').getAttribute('data-elapsed')
  await club.click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-style', 'club')
  await expect(page.getByTestId('groove-score')).toHaveText(score!)
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-elapsed', elapsed!)
  await page.getByRole('button', { name: 'Cerrar ajustes de Groove', exact: true }).click()
  await page.getByRole('button', { name: 'SALIR DEL JUEGO ↗', exact: true }).click()
  await page.locator('.arcade-choice').filter({ hasText: 'GROOVE NINJA' }).click()
  await expect(page.locator('.gn-panel')).toHaveAttribute('data-style', 'club')
})
