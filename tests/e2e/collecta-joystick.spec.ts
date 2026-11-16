import { launchCollecta, collectaControl, menuTab } from './consoleMenus'
import { expect, test, type Page } from '@playwright/test'
test.use({hasTouch:true})
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>{
    Element.prototype.requestFullscreen=()=>Promise.reject(new DOMException('Unsupported','NotSupportedError'))
    localStorage.setItem('danz-yeppo-welcome-v1','done');sessionStorage.setItem('danz-yeppo-visit-peek-v1','done')
  })
})
async function choose(page:Page,both=true){
  await page.goto('/test?seccion=arcade&juego=collecta')
  await collectaControl(page,1,'JOYSTICK')
  if(both)await collectaControl(page,2,'JOYSTICK')
}
async function point(page:Page,id:number,x=0,y=0){
  return page.locator(`.versus-p${id} .versus-stick svg`).evaluate((el,p)=>{
    const m=(el as SVGSVGElement).getScreenCTM()!,v=new DOMPoint(p.x*42,p.y*42).matrixTransform(m)
    return {x:v.x,y:v.y,id:p.id}
  },{id,x,y})
}
const pos=async(page:Page,id:number)=>(await page.locator('.chase-game').getAttribute(`data-p${id}`))!.split(',').map(Number)

test('Collecta explains its two shifts and saves an independent controller for each player',async({page})=>{
  await choose(page,false)
  await menuTab(page,'CÓMO JUGAR')
  await expect(page.locator('.menu-help')).toContainText('cada captura pasa la factura')
  await page.reload()
  await menuTab(page,'MANDOS')
  await expect(page.getByRole('group',{name:'Mando P1',exact:true})).toContainText('JOYSTICK')
  await expect(page.getByRole('group',{name:'Mando P2',exact:true})).toContainText('FLECHAS')
  await launchCollecta(page,'chase')
  await page.getByRole('button',{name:'EMPEZAR PERSECUCIÓN',exact:true}).click()
  await expect(page.getByRole('button',{name:'P1 Joystick',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'P2 Arriba',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Salir de Persecución',exact:true}).click()
  await collectaControl(page,1,'FLECHAS')
  await launchCollecta(page,'arena')
  await page.getByRole('button',{name:'EMPEZAR DUELO',exact:true}).click()
  await expect(page.getByRole('button',{name:'P1 Arriba',exact:true})).toBeVisible()
})

test('two analog joysticks and a third-finger sprint stay independent, release and pause safely',async({page,browserName})=>{
  test.skip(browserName!=='chromium')
  await page.setViewportSize({width:844,height:390});await choose(page)
  await launchCollecta(page,'chase')
  await expect(page.locator('.chase-board')).toHaveAttribute('data-ready','true',{timeout:15000})
  await page.getByRole('button',{name:'EMPEZAR PERSECUCIÓN',exact:true}).click()
  const cdp=await page.context().newCDPSession(page)
  const centers=[await point(page,1),await point(page,2)],ends=[await point(page,1,0,-1.8),await point(page,2,0,-1.8)]
  expect(ends[0].x).toBeGreaterThan(centers[0].x+20);expect(ends[1].x).toBeLessThan(centers[1].x-20)
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:centers})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:ends})
  await expect.poll(async()=>(await pos(page,1))[0]).toBeGreaterThan(120)
  await expect.poll(async()=>(await pos(page,2))[0]).toBeLessThan(760)
  const sprint=(await page.getByRole('button',{name:'P1 Sprint',exact:true}).boundingBox())!
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...ends,{id:3,x:sprint.x+sprint.width/2,y:sprint.y+sprint.height/2}]})
  await expect(page.getByRole('button',{name:'P1 Sprint',exact:true})).toBeDisabled()
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[ends[0],{id:3,x:sprint.x+sprint.width/2,y:sprint.y+sprint.height/2}]})
  await page.waitForTimeout(350)
  const a=(await pos(page,1))[0],b=(await pos(page,2))[0]
  await page.waitForTimeout(200)
  expect(Math.abs((await pos(page,1))[0]-a)).toBeLessThanOrEqual(.25);expect((await pos(page,2))[0]).toBeLessThanOrEqual(b);await expect(page.locator('.versus-p2 .versus-stick')).toHaveAttribute('data-engaged','true')
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})
  await expect(page.getByRole('button',{name:'P2 Joystick',exact:true})).toHaveAttribute('data-engaged','false')
  expect(await page.evaluate(()=>window.scrollY)).toBe(0)
  await page.setViewportSize({width:390,height:844})
  await expect(page.locator('.chase-game')).toHaveAttribute('data-phase','paused')
  await expect(page.locator('.versus-p1 .versus-stick')).toHaveAttribute('data-engaged','false')
  await page.getByRole('button',{name:'SEGUIR CORRIENDO',exact:true}).click()
  await expect(page.locator('.versus-p1 .versus-stick')).toHaveAttribute('data-engaged','false')
  await cdp.detach()
})

for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390}]){
test(`Arena sticks and third-finger disc follow both viewpoints at ${size.width}x${size.height}`,async({page,browserName},testInfo)=>{
  test.skip(browserName!=='chromium')
  await page.setViewportSize(size)
  await choose(page)
    await page.goto('/test?seccion=arcade&juego=arena')
    await expect(page.locator('.arena-board')).toHaveAttribute('data-ready','true',{timeout:15000})
    const centers=[await point(page,1),await point(page,2)],landscape=size.width>size.height
    const ends=landscape?[await point(page,1,0,-1),await point(page,2,0,-1)]:[await point(page,1,1,0),await point(page,2,1,0)]
    expect(ends[0].x).toBeGreaterThan(centers[0].x+20);expect(ends[1].x).toBeLessThan(centers[1].x-20)
    for(const id of [1,2]){
      const r=(await page.locator(`.versus-p${id} .versus-stick`).boundingBox())!
      expect(r.width).toBeGreaterThanOrEqual(90);expect(r.height).toBeGreaterThanOrEqual(90)
      expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(size.width)
      expect(r.y).toBeGreaterThanOrEqual(0);expect(r.y+r.height).toBeLessThanOrEqual(size.height)
    }
    const cdp=await page.context().newCDPSession(page)
    const disc=(await page.locator('.versus-p1 .arena-drop').boundingBox())!
    await page.getByRole('button',{name:'EMPEZAR DUELO',exact:true}).click()
    await expect(page.locator('.arena-game')).toHaveAttribute('data-phase','playing')
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:centers})
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:ends})
    await expect.poll(()=>page.locator('.arena-game').getAttribute('data-p1')).not.toBe('1,1')
    await expect.poll(()=>page.locator('.arena-game').getAttribute('data-p2')).not.toBe('9,7')
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[...ends,{id:3,x:disc.x+disc.width/2,y:disc.y+disc.height/2}]})
    await expect.poll(async()=>Number(await page.locator('.arena-game').getAttribute('data-bombs'))).toBeGreaterThan(0)
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]})
    await expect(page.locator('.versus-p1 .versus-stick')).toHaveAttribute('data-engaged','false')
    await testInfo.attach(`Collecta joystick ${size.width}x${size.height}`,{body:await page.screenshot(),contentType:'image/png'})
    await cdp.detach()
})
}

test('a focused joystick supports keyboard, and recentering cannot leave a stuck direction',async({page})=>{
  await choose(page)
  await launchCollecta(page,'chase')
  await expect(page.locator('.chase-board')).toHaveAttribute('data-ready','true',{timeout:15000})
  await page.getByRole('button',{name:'EMPEZAR PERSECUCIÓN',exact:true}).click()
  const stick=page.getByRole('button',{name:'P1 Joystick',exact:true})
  await stick.focus()
  const initial=await page.locator('.chase-game').getAttribute('data-p1')
  await page.keyboard.down('ArrowLeft')
  await expect.poll(()=>page.locator('.chase-game').getAttribute('data-p1')).not.toBe(initial)
  await expect(stick).toHaveAttribute('data-engaged','true')
  await page.keyboard.up('ArrowLeft')
  await expect(stick).toHaveAttribute('data-engaged','false')
  await page.waitForTimeout(150)
  const stopped=await page.locator('.chase-game').getAttribute('data-p1')
  await page.waitForTimeout(200)
  expect(await page.locator('.chase-game').getAttribute('data-p1')).toBe(stopped)
  await page.keyboard.press('Space')
  await expect(stick).toHaveAttribute('data-engaged','false')
  await page.getByRole('button',{name:'PAUSAR',exact:true}).click()
  await expect(page.locator('.chase-game')).toHaveAttribute('data-phase','paused')
})
