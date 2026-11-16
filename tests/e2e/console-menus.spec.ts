import {test,expect} from '@playwright/test'
import {menuTab,selectReel} from './consoleMenus'

test('each library launch opens a viewport menu and requests native fullscreen from the click',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.addInitScript(()=>{
  ;(window as any).__arcadeFullscreen=[]
  Element.prototype.requestFullscreen=function(){(window as any).__arcadeFullscreen.push({tag:this.tagName,active:navigator.userActivation.isActive});return Promise.reject(new DOMException('Unavailable','NotSupportedError'))}
 })
 await page.goto('/?seccion=arcade')
 for(const [title,menu] of [['LA QUE HAS LIAO, JACK','LIAO, JACK'],['GROOVE NINJA','GROOVE NINJA'],['DANZ COLLECTA','DANZ COLLECTA'],['DANZPORTER','DANZPORTER']]){
  await page.locator('.arcade-choice').filter({hasText:title}).click()
  const dialog=page.getByRole('dialog',{name:`Menú de ${menu}`,exact:true})
  await expect(dialog).toBeVisible()
  const rect=await dialog.boundingBox();expect(rect?.width).toBe(390);expect(rect?.height).toBe(844)
  await expect(dialog.locator('.arcade-menu-start')).toBeVisible()
  expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true)
  await dialog.locator('.arcade-menu-back').click()
  await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
 }
 const requests=await page.evaluate(()=>(window as any).__arcadeFullscreen)
 expect(requests.filter((r:any)=>r.tag==='HTML'&&r.active).length).toBeGreaterThanOrEqual(4)
})

test('classic selectors wrap with keys, swipe and retain garage changes across menu pages',async({page})=>{
 await page.setViewportSize({width:320,height:568})
 await page.goto('/test?seccion=arcade&juego=kart')
 const mode=page.getByRole('group',{name:'Modo de DANZPORTER',exact:true}).locator('.reel-card')
 await mode.press('ArrowLeft')
 await expect(page.locator('.kart-game')).toHaveAttribute('data-mode','duel')
 const box=(await mode.boundingBox())!
 await page.mouse.move(box.x+box.width*.8,box.y+box.height*.6);await page.mouse.down();await page.mouse.move(box.x+box.width*.2,box.y+box.height*.6);await page.mouse.up()
 await expect(page.locator('.kart-game')).toHaveAttribute('data-mode','race')
 await menuTab(page,'GARAJE');await selectReel(page,'CHASIS','SPRINT')
 await menuTab(page,'CÓMO JUGAR');await expect(page.locator('.menu-help')).toContainText('BOXES')
 await menuTab(page,'GARAJE');await expect(page.getByRole('group',{name:'CHASIS',exact:true})).toContainText('SPRINT')
 await expect(page.locator('.kart-game')).toHaveAttribute('data-build','sprint:street')
 await page.getByRole('button',{name:'Salir de DANZPORTER',exact:true}).click()
 await expect(page.getByLabel('Biblioteca ARCADANZ')).toBeVisible()
})
