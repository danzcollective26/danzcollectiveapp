import { expect, test } from '@playwright/test'
import { installMockSession, mockSupabase, supabaseHost } from './helpers/supabase'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('danz-yeppo-welcome-v1','done')
    sessionStorage.setItem('danz-yeppo-visit-peek-v1','done')
  })
})

test('approved home wallet keeps account first and passport second, both reachable', async ({ page }) => {
  await mockSupabase(page)
  await page.goto('/')
  const wallet=page.getByRole('region',{name:'Tu cartera DANZ: cuenta y pasaporte'})
  await expect(wallet).toBeVisible()
  const cards=wallet.locator('button')
  await expect(cards).toHaveCount(2)
  await expect(cards.nth(0)).toHaveAccessibleName('Abrir mi tarjeta de socio DANZ')
  await expect(cards.nth(1)).toHaveAccessibleName('Abrir mi Pasaporte DANZ y ver mis sellos')
  for(const label of ['IG','POINTS','SELLOS']) await expect(wallet.locator('.danz-wallet-icons')).toContainText(label)
  await expect(page.locator('.yeppo')).toHaveCount(0)
  await cards.nth(0).click()
  await expect(page).toHaveURL(/seccion=cuenta/)
  await page.goto('/')
  await wallet.getByRole('button',{name:'Abrir mi Pasaporte DANZ y ver mis sellos'}).click()
  await expect(page.getByRole('dialog',{name:'Mi Pasaporte DANZ'})).toBeVisible()
})

test('native section transitions keep URL, history and rapid navigation in sync', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await mockSupabase(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Abrir mi Pasaporte DANZ y ver mis sellos' }).click()
  await expect(page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })).toBeVisible()
  await expect(page).toHaveURL(/seccion=pasaporte/)
  // The fullscreen passport intentionally hides main navigation.
  await page.getByRole('button', { name: 'Cerrar pasaporte y volver a la pantalla anterior' }).click()
  await expect(page.getByRole('button', { name: 'Abrir mi Pasaporte DANZ y ver mis sellos' })).toBeVisible()
  await page.getByRole('navigation').getByRole('button', { name: 'FOTOS', exact: true }).click()
  if (testInfo.project.name === 'mobile') {
    await page.goto('/?seccion=musica')
    await page.goto('/?seccion=danzflor')
  } else {
    await page.getByRole('navigation').getByRole('button', { name: 'DANZ IN', exact: true }).click()
    await page.getByRole('navigation').getByRole('button', { name: 'DANZFLOR', exact: true }).click()
    await expect(page.getByRole('navigation').getByRole('button', { name: 'DANZFLOR', exact: true })).toHaveAttribute('aria-current', 'page')
  }
  await expect(page).toHaveURL(/seccion=danzflor/)
  await page.goBack()
  await expect(page).toHaveURL(/seccion=musica/)
  if (testInfo.project.name !== 'mobile') await expect(page.getByRole('navigation').getByRole('button', { name: 'DANZ IN', exact: true })).toHaveAttribute('aria-current', 'page')
  expect(errors).toEqual([])
})

test('unsupported transitions and haptics remain fully navigable with reduced motion', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    Object.defineProperty(document, 'startViewTransition', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined })
  })
  await mockSupabase(page)
  await page.goto('/')
  await page.getByRole('navigation').getByRole('button', { name: 'FOTOS', exact: true }).click()
  await expect(page.getByRole('navigation').getByRole('button', { name: 'FOTOS', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('navigation').getByRole('button', { name: 'INICIO', exact: true }).click()
  await page.getByRole('button', { name: 'Abrir mi Pasaporte DANZ y ver mis sellos' }).click()
  await expect(page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar pasaporte y volver a la pantalla anterior' }).click()
  await expect(page.getByRole('navigation').getByRole('button', { name: 'INICIO', exact: true })).toHaveAttribute('aria-current', 'page')
  if (testInfo.project.name === 'mobile') {
    await page.goto('/?seccion=cuenta')
    await expect(page).toHaveURL(/seccion=cuenta/)
  } else {
    await page.getByRole('navigation').getByRole('button', { name: 'CUENTA', exact: true }).click()
    await expect(page.getByRole('navigation').getByRole('button', { name: 'CUENTA', exact: true })).toHaveAttribute('aria-current', 'page')
  }
  await page.getByRole('navigation').getByRole('button', { name: 'INICIO', exact: true }).click()
  await expect(page.getByRole('navigation').getByRole('button', { name: 'INICIO', exact: true })).toHaveAttribute('aria-current', 'page')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('gallery and passport show bounded loading states while authorized reads are pending', async ({ page }, testInfo) => {
  await installMockSession(page)
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`, async route => {
    await pending
    await route.fulfill({ json: [] }).catch(() => {})
  })
  await page.goto('/?seccion=pasaporte')
  const reader = page.getByRole('dialog', { name: 'Mi Pasaporte DANZ' })
  await expect(reader).toBeVisible()
  const leaf = reader.getByLabel('Desliza horizontalmente o usa las flechas para pasar las páginas')
  await leaf.focus()
  await leaf.press('ArrowRight')
  await leaf.press('ArrowRight')
  await expect(reader.getByText('Comprobando las fiestas de tu pasaporte…')).toBeVisible()
  await testInfo.attach('pasaporte-carga', { body: await page.screenshot({ type: 'jpeg', quality: 75 }), contentType: 'image/jpeg' })
  release()
  await expect(reader.getByText('Esta página espera tu próxima fiesta.', { exact: false })).toBeVisible()
  await reader.getByRole('button', { name: 'Cerrar pasaporte y volver a la pantalla anterior' }).click()
  let releaseEvents!: () => void
  const events = new Promise<void>(resolve => { releaseEvents = resolve })
  await page.route(`${supabaseHost}/rest/v1/danz_events**`, async route => {
    await events
    await route.fulfill({ json: [] }).catch(() => {})
  })
  await page.getByRole('navigation').getByRole('button', { name: 'FOTOS', exact: true }).click()
  await expect(page.getByText('Cargando tus galerías…', { exact: true })).toBeVisible()
  await expect(page.locator('.skeleton-gallery')).toBeVisible()
  releaseEvents()
  await expect(page.getByText('Todavía no hay galerías disponibles para tu cuenta', { exact: true })).toBeVisible()
})

test('Yeppo yields to typing and hidden tabs, while intentional reactions respect reduced motion', async ({ page }, testInfo) => {
  await mockSupabase(page); await page.goto('/test?seccion=danzers')
  const launcher=page.getByRole('button',{name:'Hablar con Yeppo',exact:true})
  await expect(launcher).toBeVisible()
  await page.getByLabel('CÓDIGO DEL EVENTO',{exact:true}).fill('DANZTEST123456')
  await expect(launcher).toHaveCount(0)
  await page.getByRole('heading',{name:/TU PASAPORTE/}).click()
  await expect(launcher).toBeVisible()
  await launcher.click()
  const chat=page.getByRole('dialog',{name:'Hablar con Yeppo',exact:true})
  await chat.getByRole('button',{name:'¿Dónde están mis fotos?'}).click()
  await expect(chat.locator('.yeppo-chat-presence')).toBeVisible()
  await testInfo.attach('yeppo-intencion',{body:await page.screenshot({type:'jpeg',quality:75}),contentType:'image/jpeg'})
  await page.emulateMedia({reducedMotion:'reduce'})
  expect(await chat.locator('.yeppo-chat-presence').evaluate(el=>getComputedStyle(el).animationName)).toBe('none')
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))})
  await expect(page.locator('.yeppo')).toHaveCount(0)
})
