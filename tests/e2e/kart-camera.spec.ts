import{test,expect}from'@playwright/test'
import{menuTab,selectReel}from'./consoleMenus'

test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new DOMException('Unavailable','NotSupportedError'));if(!localStorage.getItem('danzporter-preferences-v3'))localStorage.setItem('danzporter-preferences-v3',JSON.stringify({quality:'flat'}))})
})
test('first person shares the live race and returns to track view without resetting time or parts',async({page})=>{
 await page.goto('/test?seccion=arcade&juego=kart')
 await menuTab(page,'AJUSTES');await selectReel(page,'Cámara','PRIMERA PERSONA')
 await expect(page.locator('.kart-board')).toHaveAttribute('data-projection','cockpit')
 await page.getByRole('button',{name:'SALIR A PISTA',exact:true}).click()
 await expect(page.locator('.kart-game')).toHaveAttribute('data-phase','playing',{timeout:8000})
 await expect(page.locator('.kart-cockpit')).toBeVisible()
 await page.keyboard.down('w');await expect.poll(async()=>Number(await page.locator('.kart-game').getAttribute('data-speed'))).toBeGreaterThan(25);await page.keyboard.up('w')
 await page.getByRole('button',{name:'Ajustes del kart',exact:true}).click()
 const before=await page.locator('.kart-game').getAttribute('data-elapsed'),build=await page.locator('.kart-game').getAttribute('data-build')
 await selectReel(page,'Cámara','PISTA COMPLETA')
 await expect(page.locator('.kart-board')).toHaveAttribute('data-projection','track')
 await expect(page.locator('.kart-game')).toHaveAttribute('data-elapsed',before!)
 await expect(page.locator('.kart-game')).toHaveAttribute('data-build',build!)
 await expect(page.locator('.kart-board canvas')).toHaveCount(1)
 await page.getByRole('button',{name:'VOLVER A PISTA',exact:true}).click()
 await expect.poll(async()=>Number(await page.locator('.kart-game').getAttribute('data-elapsed'))).toBeGreaterThan(Number(before))
})
test('cockpit preference persists but a local duel always keeps the shared circuit',async({page})=>{
 await page.goto('/test?seccion=arcade&juego=kart')
 await menuTab(page,'AJUSTES');await selectReel(page,'Cámara','PRIMERA PERSONA');await page.reload()
 await expect(page.locator('.kart-game')).toHaveAttribute('data-camera','cockpit')
 await selectReel(page,'Modo de DANZPORTER','DUELO LOCAL')
 await expect(page.locator('.kart-game')).toHaveAttribute('data-camera','track')
 await menuTab(page,'AJUSTES');await expect(page.getByRole('group',{name:'Cámara',exact:true})).toContainText('PISTA COMPARTIDA')
 await menuTab(page,'CORRER');await selectReel(page,'Modo de DANZPORTER','CONTRARRELOJ')
 await expect(page.locator('.kart-game')).toHaveAttribute('data-camera','cockpit')
})
