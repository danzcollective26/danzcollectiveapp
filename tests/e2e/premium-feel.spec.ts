import { expect, test } from '@playwright/test'
import { installMockSession, mockSupabase, supabaseHost } from './helpers/supabase'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('danz-yeppo-welcome-v1','done')
    sessionStorage.setItem('danz-yeppo-visit-peek-v1','done')
  })
})

test('native section transitions keep URL, history and rapid navigation in sync', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror',error=>errors.push(error.message))
  await mockSupabase(page); await page.goto('/')
  await page.getByRole('navigation').getByRole('button',{name:'PASAPORTE',exact:true}).click()
  await expect(page.getByRole('heading',{name:/CADA NOCHE/})).toBeVisible()
  await expect(page).toHaveURL(/seccion=pasaporte/)
  await page.evaluate(()=>{const nav=document.querySelector('nav')!;for(const label of ['FOTOS','PASAPORTE']) [...nav.querySelectorAll('button')].find(button=>button.textContent===label)?.click()})
  await expect(page).toHaveURL(/seccion=pasaporte/)
  await expect(page.getByRole('navigation').getByRole('button',{name:'PASAPORTE',exact:true})).toHaveAttribute('aria-current','page')
  await page.evaluate(()=>{
    const nav=document.querySelector('nav')!
    for(const label of ['FOTOS','DANZ IN','DANZFLOR']) [...nav.querySelectorAll('button')].find(button=>button.textContent===label)?.click()
  })
  await expect(page.getByRole('navigation').getByRole('button',{name:'DANZFLOR',exact:true})).toHaveAttribute('aria-current','page')
  await expect(page).toHaveURL(/seccion=danzflor/)
  await page.goBack(); await expect(page).toHaveURL(/seccion=musica/)
  await expect(page.getByRole('navigation').getByRole('button',{name:'DANZ IN',exact:true})).toHaveAttribute('aria-current','page')
  expect(errors).toEqual([])
})

test('unsupported transitions and haptics remain fully navigable with reduced motion', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.addInitScript(()=>{
    Object.defineProperty(document,'startViewTransition',{configurable:true,value:undefined})
    Object.defineProperty(navigator,'vibrate',{configurable:true,value:undefined})
  })
  await mockSupabase(page); await page.goto('/')
  for(const section of ['FOTOS','PASAPORTE','CUENTA','INICIO']) {
    await page.getByRole('navigation').getByRole('button',{name:section,exact:true}).click()
    await expect(page.getByRole('navigation').getByRole('button',{name:section,exact:true})).toHaveAttribute('aria-current','page')
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})

test('gallery and passport show bounded skeletons while their authorized reads are pending', async ({ page }, testInfo) => {
  await installMockSession(page)
  let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve})
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_my_passport`,async route=>{await pending;await route.fulfill({json:[]}).catch(()=>{})})
  await page.goto('/?seccion=pasaporte')
  await expect(page.locator('.skeleton-passport')).toBeVisible()
  await expect(page.locator('.skeleton-passport')).toHaveAttribute('aria-busy','true')
  expect(await page.locator('.skeleton-passport .skeleton-card').count()).toBe(2)
  await testInfo.attach('pasaporte-skeleton',{body:await page.screenshot({type:'jpeg',quality:75}),contentType:'image/jpeg'})
  release();await expect(page.locator('.skeleton-passport')).toHaveCount(0)
  let releaseEvents!:()=>void;const events=new Promise<void>(resolve=>{releaseEvents=resolve})
  await page.route(`${supabaseHost}/rest/v1/danz_events**`,async route=>{await events;await route.fulfill({json:[]}).catch(()=>{})})
  await page.getByRole('navigation').getByRole('button',{name:'FOTOS',exact:true}).click()
  await expect(page.getByText('Cargando tus galerías…',{exact:true})).toBeVisible()
  await expect(page.locator('.skeleton-gallery')).toBeVisible()
  releaseEvents();await expect(page.getByText('Todavía no hay galerías disponibles para tu cuenta',{exact:true})).toBeVisible()
})

test('Yeppo yields to typing and hidden tabs, while intentional reactions respect reduced motion', async ({ page }, testInfo) => {
  await mockSupabase(page); await page.goto('/?seccion=pasaporte')
  const launcher=page.getByRole('button',{name:'Hablar con Yeppo',exact:true})
  await expect(launcher).toBeVisible()
  await page.getByLabel('CÓDIGO DEL EVENTO',{exact:true}).fill('DANZTEST123456')
  await expect(launcher).toHaveCount(0)
  await page.getByRole('heading',{name:/CADA NOCHE/}).click()
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
