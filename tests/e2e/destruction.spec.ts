import {test,expect} from '@playwright/test'

test('Groove Ninja destruction offers eight weapons and independent play controls',async({page})=>{
 await page.goto('/?seccion=arcade&juego=groove-ninja')
 await page.locator('.arcade-launch-mode-picker').getByRole('button',{name:'DESTRUCCIÓN ✹',exact:true}).click()
 await expect(page.getByRole('heading',{name:/DESTRUCCIÓN/})).toBeVisible()
 const arsenal=page.getByRole('region',{name:'Elegir arma de destrucción'})
 await expect(arsenal.getByRole('button')).toHaveCount(8)
 await arsenal.getByRole('button',{name:/Guante de Yeppo/}).click()
 await expect(arsenal.getByRole('button',{name:/Guante de Yeppo/})).toHaveAttribute('aria-pressed','true')
 await page.getByRole('button',{name:'¡EMPEZAR DESTRUCCIÓN!'}).click()
 await expect(page.locator('.dn-board')).toBeVisible()
 await expect(page.getByTestId('destruction-score')).toHaveText('0')
 await expect(page.getByRole('button',{name:'PAUSAR',exact:true})).toBeEnabled()
 await page.getByRole('button',{name:'PAUSAR',exact:true}).click()
 await expect(page.getByRole('button',{name:'REANUDAR',exact:true})).toBeVisible()
 await page.getByRole('button',{name:'REANUDAR PARTIDA',exact:true}).click()
 await expect(page.getByRole('button',{name:'PAUSAR',exact:true})).toBeEnabled()
 await page.getByRole('button',{name:'← VOLVER A GROOVE NINJA'}).click()
 await expect(page.getByRole('heading',{name:'GROOVE NINJA.',exact:true})).toBeVisible()
 await expect(page.locator('.gn-panel')).toHaveAttribute('data-status','ready')
})

test('all eight weapons have visibly distinct equipment and shot animations',async({page})=>{
 await page.goto('/?seccion=arcade&juego=groove-ninja')
 await page.locator('.arcade-launch-mode-picker').getByRole('button',{name:'DESTRUCCIÓN ✹',exact:true}).click()
 await page.getByRole('button',{name:'¡EMPEZAR DESTRUCCIÓN!'}).click()
 const weapons=['blaster','scatter','laser','paint','cannon','boomerang','flower','yeppo'] as const
 const board=page.locator('.dn-board')
 for(const weapon of weapons){
  const button=page.locator('.dn-weapon-grid').getByRole('button',{name:new RegExp(weapon==='blaster'?'Bláster':weapon==='scatter'?'Escopeta':weapon==='laser'?'Rayo':weapon==='paint'?'Pistola':weapon==='cannon'?'Cañón':weapon==='boomerang'?'bumerán':weapon==='flower'?'Lanzaflores':'Guante')})
  await button.click()
  await expect(page.locator('.dn-stage')).toHaveAttribute('data-current-weapon',weapon)
  await expect(page.locator('.dn-equipped')).toHaveAttribute('data-equipped-weapon',weapon)
  await board.scrollIntoViewIfNeeded()
  const box=await board.boundingBox()
  await page.mouse.click(box!.x+box!.width/2,box!.y+box!.height/2)
  await expect(page.locator('[data-weapon-fx]')).toHaveAttribute('data-weapon-fx',weapon)
  await page.waitForTimeout(1000)
 }
})
