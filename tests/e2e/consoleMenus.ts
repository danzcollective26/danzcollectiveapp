import { expect, type Page } from '@playwright/test'

export async function menuTab(page:Page,name:string){
 await page.locator('.arcade-menu-body > .arcade-menu-tabs').getByRole('button',{name,exact:true}).click()
}
export async function selectReel(page:Page,label:string,name:string){
 const card=page.getByRole('group',{name:label,exact:true}).locator('.reel-card')
 await card.focus();await card.press('Home')
 for(let i=0;i<24;i++){
  if((await card.getAttribute('aria-label'))?.endsWith(`: ${name}`))return
  await card.press('ArrowRight')
 }
 await expect(card).toHaveAttribute('aria-label',`${label}: ${name}`)
}
export async function launchCollecta(page:Page,mode:'arena'|'chase'|'solo'){
 await menuTab(page,'JUGAR')
 await selectReel(page,'Modo de DANZ Collecta',mode==='arena'?'ARENA':mode==='chase'?'PERSECUCIÓN':'CONTRA LA MÁQUINA')
 await page.getByRole('button',{name:mode==='arena'?'JUGAR ARENA 1 VS 1':mode==='chase'?'JUGAR PERSECUCIÓN':'JUGAR EN SOLITARIO',exact:true}).click()
}
export async function collectaControl(page:Page,id:1|2,kind:'FLECHAS'|'JOYSTICK'){
 await menuTab(page,'MANDOS');await selectReel(page,`Mando P${id}`,kind);await menuTab(page,'JUGAR')
}
