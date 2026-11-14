import {test,expect} from '@playwright/test'
import {installMockSession,supabaseHost,USER_A} from './helpers/supabase'

test('Yeppo saves an authenticated suggestion and confirms its arrival',async({page})=>{
 await installMockSession(page)
 await page.addInitScript(()=>{
  localStorage.setItem('danz-yeppo-welcome-v1','done')
  localStorage.setItem('danz-yeppo-enabled-v1','true')
  sessionStorage.setItem('danz-yeppo-visit-peek-v1','done')
 })
 let submitted:unknown=null
 await page.route(`${supabaseHost}/rest/v1/danz_yeppo_feedback**`,async route=>{
  submitted=route.request().postDataJSON()
  await route.fulfill({status:201,json:{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}})
 })
 await page.goto('/')
 await page.getByRole('button',{name:'Hablar con Yeppo'}).click()
 await page.getByRole('button',{name:/UN PROBLEMA O UNA IDEA/}).click()
 const feedback=page.getByRole('region',{name:'Enviar problema o sugerencia a DANZ'})
 await expect(feedback).toBeVisible()
 await feedback.getByLabel('¿Qué me cuentas?').selectOption('sugerencia')
 await feedback.getByLabel('Explícame qué ha pasado o qué mejorarías').fill('Quiero una opción para cambiar el color del juego.')
 await feedback.getByRole('button',{name:/ENVIAR A DANZ/}).click()
 await expect(feedback.getByRole('status')).toContainText('Recibido')
 expect(submitted).toMatchObject({user_id:USER_A,category:'sugerencia',section:'inicio',message:'Quiero una opción para cambiar el color del juego.'})
})
