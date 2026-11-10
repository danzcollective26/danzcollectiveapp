import { expect, test, type Page } from '@playwright/test'
import { makeSession, mockSupabase, sessionStorageKey, supabaseHost, switchMockSession, USER_A, USER_B } from './helpers/supabase'
const E='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const F='cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const scopes=['events.manage','codes.manage']
function session(aal='aal2') {
  const s=makeSession()
  const token=s.access_token.split('.')
  token[1]=Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(token[1],'base64url').toString()),aal})).toString('base64url')
  s.access_token=token.join('.')
  return s
}
async function install(page:Page,{aal='aal2',permissions=scopes,member=true,factor=false}={}) {
  await mockSupabase(page)
  await page.addInitScript(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:sessionStorageKey,s:session(aal)})
  await page.route(`${supabaseHost}/auth/v1/user`,async route=>{
    const jwt=route.request().headers().authorization!.split('.')[1]
    const uid=JSON.parse(Buffer.from(jwt,'base64url').toString()).sub
    await route.fulfill({json:{...makeSession(uid).user,factors:factor&&uid===USER_A?[{id:F,factor_type:'totp',status:'verified',friendly_name:'Mi autenticador'}]:[]}})
  })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_context`,route=>{
    const jwt=route.request().headers().authorization!.split('.')[1]
    const own=JSON.parse(Buffer.from(jwt,'base64url').toString()).sub===USER_A
    return route.fulfill({json:[{is_admin:own&&member,permissions:own&&member?permissions:[]}]})
  })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_events`,route=>route.fulfill({json:[]}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_codes`,route=>route.fulfill({json:[]}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_photos`,route=>route.fulfill({json:[]}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_gallery_usage`,route=>route.fulfill({json:[{used_bytes:0,limit_bytes:900000000,photo_count:0}]}))
}
const open=(page:Page)=>page.goto('/?panel=admin')

test('guests and normal attendees cannot view the administration',async({page})=>{
  await mockSupabase(page)
  await open(page)
  await expect(page.getByText('Inicia sesión con tu cuenta de administración.',{exact:true})).toBeVisible()
  await install(page,{member:false})
  await open(page)
  await expect(page.getByText('Esta cuenta no tiene permisos de administración.',{exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'NUEVO EVENTO',exact:true})).toHaveCount(0)
})

test('an aal1 admin must verify an existing TOTP factor before any admin data is requested',async({page})=>{
  await install(page,{aal:'aal1',factor:true})
  let reads=0,valid=false
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_events`,route=>{reads++;return route.fulfill({json:[]})})
  await page.route(`${supabaseHost}/auth/v1/factors/${F}/challenge`,route=>route.fulfill({json:{id:'synthetic-challenge',expires_at:Math.floor(Date.now()/1000)+60}}))
  await page.route(`${supabaseHost}/auth/v1/factors/${F}/verify`,route=>valid?route.fulfill({json:session()}):route.fulfill({status:400,json:{code:'mfa_verification_failed',message:'Synthetic rejection'}}))
  await open(page)
  await expect(page.getByRole('heading',{name:'Protege la administración.',exact:true})).toBeVisible()
  expect(reads).toBe(0)
  await page.getByLabel('Código de tu aplicación de autenticación',{exact:true}).fill('123456')
  await page.getByRole('button',{name:'VERIFICAR Y ENTRAR',exact:true}).click()
  await expect(page.getByText('No se pudo verificar el código.',{exact:false})).toBeVisible()
  expect(reads).toBe(0)
  valid=true
  await page.getByRole('button',{name:'VERIFICAR Y ENTRAR',exact:true}).click()
  await expect(page.getByRole('button',{name:'NUEVO EVENTO',exact:true})).toBeVisible()
  expect(reads).toBeGreaterThan(0)
})

test('first enrollment displays a valid local QR and can cancel its unverified factor',async({page})=>{
  await install(page,{aal:'aal1'})
  let deleted=false
  await page.route(`${supabaseHost}/auth/v1/factors`,route=>route.fulfill({json:{id:F,type:'totp',totp:{qr_code:'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path fill="black" d="M0 0h40v40H0z"/></svg>',secret:'SYNTHETICSETUPKEY',uri:'otpauth://totp/synthetic'}}}))
  await page.route(`${supabaseHost}/auth/v1/factors/${F}`,route=>{deleted=true;return route.fulfill({json:{id:F}})})
  await open(page)
  await page.getByRole('button',{name:'CONFIGURAR DOS PASOS',exact:true}).click()
  const image=page.getByRole('img',{name:'QR para configurar tu aplicación de autenticación',exact:true})
  await expect(image).toBeVisible()
  await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.naturalWidth>0)).toBe(true)
  await expect(page.getByText('SYNTHETICSETUPKEY',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'CANCELAR CONFIGURACIÓN',exact:true}).click()
  await expect(page.getByRole('button',{name:'CONFIGURAR DOS PASOS',exact:true})).toBeVisible()
  expect(deleted).toBe(true)
  await expect(page.getByText('SYNTHETICSETUPKEY',{exact:true})).toHaveCount(0)
})

test('an admin can create and publish an event, download its QR, and revoke the code',async({page})=>{
  await install(page)
  const events:any[]=[],codes:any[]=[]
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_events`,route=>route.fulfill({json:events}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_save_event`,route=>{
    const p=route.request().postDataJSON()
    const row={id:p.p_id,title:p.p_title,starts_at:p.p_starts_at,ends_at:p.p_ends_at,status:p.p_status}
    const index=events.findIndex(e=>e.id===row.id);if(index<0)events.push(row);else events[index]=row
    return route.fulfill({json:[row]})
  })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_codes`,route=>route.fulfill({json:codes}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_issue_code`,route=>{
    const p=route.request().postDataJSON();expect(p.p_code_hash).toMatch(/^[0-9a-f]{64}$/);expect(p).not.toHaveProperty('code')
    const row={id:p.p_id,event_id:p.p_event_id,expires_at:p.p_expires_at,max_uses:p.p_max_uses,used_count:0,revoked_at:null,created_at:new Date().toISOString()};codes.push(row)
    return route.fulfill({json:[row]})
  })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_revoke_code`,route=>{
    const row=codes.find(c=>c.id===route.request().postDataJSON().p_id);row.revoked_at=new Date().toISOString();return route.fulfill({json:[row]})
  })
  await open(page)
  await page.getByRole('button',{name:'NUEVO EVENTO',exact:true}).click()
  await page.getByLabel('Nombre del evento',{exact:true}).fill('Prueba DANZ')
  await page.getByLabel('Inicio del evento',{exact:true}).fill('2027-01-01T22:00')
  await page.getByLabel('Visibilidad del evento',{exact:true}).selectOption('published')
  await page.getByRole('button',{name:'GUARDAR EVENTO',exact:true}).click()
  await expect(page.getByText('Evento guardado.',{exact:true})).toBeVisible()
  await page.getByLabel('Máximo de asistentes (opcional)',{exact:true}).fill('2')
  await page.getByRole('button',{name:'EMITIR CÓDIGO Y QR',exact:true}).click()
  await expect(page.getByRole('img',{name:'QR de acceso a Prueba DANZ',exact:true})).toBeVisible()
  const pendingDownload=page.waitForEvent('download')
  await page.getByRole('link',{name:'DESCARGAR QR',exact:true}).click()
  expect((await pendingDownload).suggestedFilename()).toMatch(/^danz-pase-.*\.png$/)
  await expect(page.getByLabel('Enlace del pase',{exact:true})).toHaveValue(/#pase=[0-9A-F]{32}$/)
  await page.getByRole('button',{name:'REVOCAR CÓDIGO',exact:true}).click()
  await page.getByRole('button',{name:'CONFIRMAR REVOCACIÓN',exact:true}).click()
  await expect(page.getByText('REVOCADO',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'EDITAR EVENTO',exact:true}).click()
  await page.getByLabel('Visibilidad del evento',{exact:true}).selectOption('archived')
  await page.getByRole('button',{name:'GUARDAR EVENTO',exact:true}).click()
  await expect(page.getByText('Este evento está archivado.',{exact:false})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
})

test('uncertain issuance retries keep the same request and a changed account clears the panel',async({page})=>{
  await install(page)
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_events`,route=>route.fulfill({json:[{id:E,title:'Solo administración',starts_at:null,ends_at:null,status:'draft'}]}))
  let first:any=null,count=0
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_issue_code`,route=>{
    const p=route.request().postDataJSON();count++
    if(count===1){first=p;return route.fulfill({status:503,json:{message:'Synthetic uncertain result'}})}
    expect(p).toEqual(first)
    return route.fulfill({json:[{id:p.p_id,event_id:E,expires_at:p.p_expires_at,max_uses:null,used_count:0,revoked_at:null,created_at:new Date().toISOString()}]})
  })
  await open(page)
  await page.getByRole('button',{name:'EMITIR CÓDIGO Y QR',exact:true}).click()
  await expect(page.getByText('No se pudo confirmar la emisión.',{exact:false})).toBeVisible()
  await page.getByRole('button',{name:'REINTENTAR EMISIÓN',exact:true}).click()
  await expect(page.getByRole('img',{name:'QR de acceso a Solo administración',exact:true})).toBeVisible()
  expect(count).toBe(2)
  await switchMockSession(page,USER_B)
  await expect(page.getByText('Esta cuenta no tiene permisos de administración.',{exact:true})).toBeVisible()
  await expect(page.getByRole('img',{name:'QR de acceso a Solo administración',exact:true})).toHaveCount(0)
  await expect(page.getByRole('heading',{name:'Solo administración',exact:true})).toHaveCount(0)
})

test('codes-only scope hides event editing and server denials remove admin data',async({page})=>{
  await install(page,{permissions:['codes.manage']})
  let denied=false
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_events`,route=>denied?route.fulfill({status:403,json:{code:'42501',message:'Denied'}}):route.fulfill({json:[{id:E,title:'Código permitido',starts_at:null,ends_at:null,status:'draft'}]}))
  await open(page)
  await expect(page.getByRole('heading',{name:'Código permitido',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'NUEVO EVENTO',exact:true})).toHaveCount(0)
  await expect(page.getByRole('button',{name:'EDITAR EVENTO',exact:true})).toHaveCount(0)
  denied=true
  await page.getByRole('button',{name:'ACTUALIZAR EVENTOS',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Hay que comprobar el acceso.',exact:true})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Código permitido',exact:true})).toHaveCount(0)
})

test('same-account session revalidation keeps MFA setup and accepts a spaced authenticator code',async({page})=>{
  await install(page,{aal:'aal1'})
  let enrolled=false,verified=false,enrollments=0,reads=0,userChecks=0
  const secret='SYNTHETIC-PRIVATE-MFA-SETUP'
  await page.route(`${supabaseHost}/auth/v1/user`,route=>{
    userChecks++
    return route.fulfill({json:{...makeSession().user,factors:enrolled?[{id:F,factor_type:'totp',status:verified?'verified':'unverified',created_at:'2026-11-10T07:00:00Z'}]:[]}})
  })
  await page.route(`${supabaseHost}/auth/v1/factors`,route=>{
    enrolled=true;enrollments++
    return route.fulfill({json:{id:F,type:'totp',totp:{secret,qr_code:'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path fill="black" d="M0 0h40v40H0z"/></svg>',uri:'otpauth://totp/synthetic'}}})
  })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_events`,route=>{reads++;return route.fulfill({json:[]})})
  await page.route(`${supabaseHost}/auth/v1/factors/${F}/challenge`,route=>route.fulfill({json:{id:'synthetic-challenge',expires_at:Math.floor(Date.now()/1000)+60}}))
  await page.route(`${supabaseHost}/auth/v1/factors/${F}/verify`,route=>{
    expect(route.request().postDataJSON().code).toBe('123456')
    verified=true
    return route.fulfill({json:session()})
  })
  await open(page)
  await page.getByRole('button',{name:'CONFIGURAR DOS PASOS',exact:true}).click()
  await expect(page.getByText(secret,{exact:true})).toBeVisible()
  const qr=await page.getByRole('img',{name:'QR para configurar tu aplicación de autenticación',exact:true}).getAttribute('src')
  const checksBefore=userChecks
  // Supabase emits SIGNED_IN for the same session when the browser regains
  // focus. Exercise that revalidation rather than bypass the account check.
  await switchMockSession(page,USER_A)
  await expect.poll(()=>userChecks).toBeGreaterThan(checksBefore)
  await expect(page.getByText(secret,{exact:true})).toBeVisible()
  await expect(page.getByRole('img',{name:'QR para configurar tu aplicación de autenticación',exact:true})).toHaveAttribute('src',qr!)
  expect(enrollments).toBe(1)
  expect(reads).toBe(0)
  expect(await page.evaluate(value=>[localStorage,sessionStorage].some(storage=>Object.values(storage).some(item=>String(item).includes(value))),secret)).toBe(false)
  await page.getByLabel('Código de tu aplicación de autenticación',{exact:true}).fill('123 456')
  await expect(page.getByLabel('Código de tu aplicación de autenticación',{exact:true})).toHaveValue('123456')
  await page.getByRole('button',{name:'VERIFICAR Y ENTRAR',exact:true}).click()
  await expect(page.getByRole('button',{name:'NUEVO EVENTO',exact:true})).toBeVisible()
  expect(reads).toBeGreaterThan(0)
  expect(enrollments).toBe(1)
})

test('reloading resumes the newest pending MFA factor and shows rejection beside the code',async({page})=>{
  await install(page,{aal:'aal1'})
  const older='dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  let valid=false,enrollments=0
  await page.route(`${supabaseHost}/auth/v1/user`,route=>route.fulfill({json:{...makeSession().user,factors:[
    {id:older,factor_type:'totp',status:'unverified',created_at:'2026-11-09T07:00:00Z'},
    {id:F,factor_type:'totp',status:valid?'verified':'unverified',created_at:'2026-11-10T07:00:00Z'},
  ]}}))
  await page.route(`${supabaseHost}/auth/v1/factors`,route=>{enrollments++;return route.fulfill({status:500,json:{message:'Unexpected enrollment'}})})
  await page.route(`${supabaseHost}/auth/v1/factors/${F}/challenge`,route=>route.fulfill({json:{id:'synthetic-challenge',expires_at:Math.floor(Date.now()/1000)+60}}))
  await page.route(`${supabaseHost}/auth/v1/factors/${F}/verify`,route=>valid?route.fulfill({json:session()}):route.fulfill({status:400,json:{code:'mfa_verification_failed',message:'Synthetic rejection'}}))
  await open(page)
  await expect(page.getByText('Hay una configuración pendiente.',{exact:false})).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Dispositivo de verificación',{exact:true})).toHaveValue(F)
  await expect(page.getByRole('img',{name:'QR para configurar tu aplicación de autenticación',exact:true})).toHaveCount(0)
  await page.getByLabel('Código de tu aplicación de autenticación',{exact:true}).fill('123456')
  await page.getByRole('button',{name:'VERIFICAR Y ENTRAR',exact:true}).click()
  await expect(page.locator('form').getByRole('alert')).toContainText('No se pudo verificar el código.')
  valid=true
  await page.getByRole('button',{name:'VERIFICAR Y ENTRAR',exact:true}).click()
  await expect(page.getByRole('button',{name:'NUEVO EVENTO',exact:true})).toBeVisible()
  expect(enrollments).toBe(0)
})

test('an explicit MFA restart retires only pending TOTP setups and changing account clears its secret',async({page})=>{
  await install(page,{aal:'aal1'})
  const older='dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  const phone='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  const fresh='ffffffff-ffff-4fff-8fff-ffffffffffff'
  const secret='SYNTHETIC-FRESH-PRIVATE-SETUP'
  let factors=[
    {id:older,factor_type:'totp',status:'unverified',created_at:'2026-11-09T07:00:00Z'},
    {id:F,factor_type:'totp',status:'unverified',created_at:'2026-11-10T07:00:00Z'},
    {id:phone,factor_type:'phone',status:'verified',created_at:'2026-11-08T07:00:00Z'},
  ]
  const removed:string[]=[]
  await page.route(`${supabaseHost}/auth/v1/user`,route=>{
    const uid=JSON.parse(Buffer.from(route.request().headers().authorization!.split('.')[1],'base64url').toString()).sub
    return route.fulfill({json:{...makeSession(uid).user,factors:uid===USER_A?factors:[]}})
  })
  for(const id of [older,F,phone]) await page.route(`${supabaseHost}/auth/v1/factors/${id}`,route=>{
    removed.push(id);factors=factors.filter(factor=>factor.id!==id)
    return route.fulfill({json:{id}})
  })
  await page.route(`${supabaseHost}/auth/v1/factors`,route=>{
    factors.push({id:fresh,factor_type:'totp',status:'unverified',created_at:'2026-11-10T08:00:00Z'})
    return route.fulfill({json:{id:fresh,type:'totp',totp:{secret,qr_code:'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"/>',uri:'otpauth://totp/synthetic'}}})
  })
  await open(page)
  await page.getByRole('button',{name:'CONFIGURAR OTRA CLAVE',exact:true}).click()
  await expect(page.getByText(secret,{exact:true})).toBeVisible()
  expect(removed.sort()).toEqual([older,F].sort())
  expect(factors.some(factor=>factor.id===phone)).toBe(true)
  await switchMockSession(page,USER_B)
  await expect(page.getByText('Esta cuenta no tiene permisos de administración.',{exact:true})).toBeVisible()
  await expect(page.getByText(secret,{exact:true})).toHaveCount(0)
  await switchMockSession(page,USER_A)
  await expect(page.getByText('Hay una configuración pendiente.',{exact:false})).toBeVisible()
  await expect(page.getByText(secret,{exact:true})).toHaveCount(0)
  await expect(page.getByRole('img',{name:'QR para configurar tu aplicación de autenticación',exact:true})).toHaveCount(0)
})
