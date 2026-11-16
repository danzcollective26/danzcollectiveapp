import {test,expect} from '@playwright/test'
import {selectReel} from './consoleMenus'
async function open(page:import('@playwright/test').Page){
 await page.goto('/?seccion=arcade&juego=groove-ninja')
 await selectReel(page,'Modo de Groove Ninja','DESTRUCCIÓN')
 await page.getByRole('button',{name:'JUGAR AHORA',exact:true}).click()
 await expect(page.getByRole('dialog',{name:'Menú de DESTRUCCIÓN',exact:true})).toBeVisible()
}
test('destruction selects eight weapons and resumes the same session from its fullscreen arsenal',async({page})=>{
 await open(page)
 await selectReel(page,'Arma de destrucción','Guante de Yeppo')
 await page.getByRole('button',{name:'EMPEZAR DESTRUCCIÓN',exact:true}).click()
 await expect(page.locator('.dn-board')).toBeVisible()
 await expect(page.getByTestId('destruction-score')).toHaveText('0')
 await page.getByRole('button',{name:'ARSENAL / PAUSA',exact:true}).click()
 const before=await page.getByTestId('destruction-score').textContent()
 await expect(page.locator('.dn-page')).toHaveAttribute('data-status','paused')
 await selectReel(page,'Arma de destrucción','Lanzaflores')
 await page.getByRole('button',{name:'VOLVER A LA CABINA',exact:true}).click()
 await expect(page.getByTestId('destruction-score')).toHaveText(before!)
 await expect(page.locator('.dn-stage')).toHaveAttribute('data-current-weapon','flower')
 await page.getByRole('button',{name:'← GROOVE',exact:true}).click()
 await expect(page.getByRole('dialog',{name:'Menú de GROOVE NINJA',exact:true})).toBeVisible()
})
test('all eight weapons keep distinct equipment and shot animations after selection',async({page})=>{
 await open(page)
 const weapons=[['blaster','Bláster'],['scatter','Escopeta disco'],['laser','Rayo continuo'],['paint','Pistola de pintura'],['cannon','Cañón de graves'],['boomerang','Vinilo bumerán'],['flower','Lanzaflores'],['yeppo','Guante de Yeppo']] as const
 for(const [id,name] of weapons){
  await selectReel(page,'Arma de destrucción',name)
  await page.getByRole('button',{name:/^(EMPEZAR DESTRUCCIÓN|VOLVER A LA CABINA)$/}).click()
  await expect(page.locator('.dn-stage')).toHaveAttribute('data-current-weapon',id)
  await expect(page.locator('.dn-equipped')).toHaveAttribute('data-equipped-weapon',id)
  const box=await page.locator('.dn-board').boundingBox()
  await page.mouse.click(box!.x+box!.width/2,box!.y+box!.height/2)
  await expect(page.locator('[data-weapon-fx]')).toHaveAttribute('data-weapon-fx',id)
  await page.waitForTimeout(1000)
  await page.getByRole('button',{name:'ARSENAL / PAUSA',exact:true}).click()
 }
})
