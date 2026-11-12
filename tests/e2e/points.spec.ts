import { expect, test } from '@playwright/test'
import { installMockSession, mockSupabase, supabaseHost, switchMockSession } from './helpers/supabase'

test('DANZPOINTS es una pestaña en mayúsculas con recompensas pendientes y acceso al buzón',async({page})=>{
  await page.setViewportSize({width:320,height:568})
  await mockSupabase(page)
  await page.goto('/?seccion=danzpoints')
  await expect(page.getByRole('heading',{name:'LA BASE DEL DÍA 13',exact:true})).toBeVisible()
  expect(await page.locator('.points-page .page-title').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true)
  const labels=await page.getByRole('navigation').getByRole('button').allTextContents()
  expect(labels.every(label=>label===label.toUpperCase())).toBe(true)
  await expect(page.getByText('POR DESVELAR',{exact:true})).toHaveCount(4)
  await expect(page.getByRole('button',{name:/ACCEDER PARA PROPONER/})).toBeVisible()
  await page.getByRole('button',{name:/ACCEDER A MI CUENTA/}).click()
  await expect(page.getByRole('heading',{name:'Entra con tu correo',exact:true})).toBeVisible()
})

test('saldo privado, reintento sin duplicar sugerencias y limpieza al salir de la cuenta',async({page})=>{
  await installMockSession(page)
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_points_summary`,route=>route.fulfill({json:{code:'DNZ-ABCDEF123456',available:0,pending:1100,events:[{title:'DANZERS WORLD',attendance:1000,clothing:100,active:false}]}}))
  const sends:Record<string,unknown>[]=[]
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_points_suggest`,async route=>{
    sends.push(route.request().postDataJSON())
    await route.fulfill(sends.length===1?{status:503,json:{message:'untrusted internal error'}}:{json:sends[0].p_id})
  })
  await page.goto('/?seccion=danzpoints')
  await expect(page.getByLabel('MI CÓDIGO DANZ',{exact:true})).toHaveValue('DNZ-ABCDEF123456')
  await expect(page.getByText('1100 puntos reservados. Se activarán cuando empiece el evento.',{exact:true})).toBeVisible()
  await page.getByLabel('QUÉ PROPONES',{exact:true}).selectOption('product')
  await page.getByLabel('TU IDEA',{exact:true}).fill('Una tote del colectivo para próximos eventos')
  await page.getByRole('button',{name:/ENVIAR PROPUESTA/}).click()
  await expect(page.getByRole('status')).toHaveText('No se ha podido enviar. Reinténtalo.')
  await expect(page.getByText('untrusted internal error')).toHaveCount(0)
  await page.getByRole('button',{name:/ENVIAR PROPUESTA/}).click()
  await expect(page.getByRole('status')).toHaveText('Sugerencia recibida. La revisará el equipo.')
  expect(sends).toHaveLength(2)
  expect(sends[0]).toEqual(sends[1])
  expect(sends[0]).toMatchObject({p_kind:'product',p_body:'Una tote del colectivo para próximos eventos'})
  expect(sends[0].p_id).toMatch(/^[a-f0-9-]{36}$/)
  await switchMockSession(page,null)
  await expect(page.getByRole('button',{name:/ACCEDER PARA PROPONER/})).toBeVisible()
  await expect(page.getByLabel('MI CÓDIGO DANZ',{exact:true})).toHaveCount(0)
  await expect(page.getByText(/1100 puntos reservados/)).toHaveCount(0)
})
