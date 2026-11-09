import { test, expect, type Page } from '@playwright/test'
import { makeSession, mockSupabase, sessionStorageKey, supabaseHost } from './helpers/supabase'
const E='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const event={id:E,title:'Galería de prueba',starts_at:'2026-11-09T20:00:00Z',ends_at:null,status:'published'}
async function install(page:Page) {
  await mockSupabase(page)
  const session=makeSession(); const token=session.access_token.split('.')
  token[1]=Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(token[1],'base64url').toString()),aal:'aal2'})).toString('base64url');session.access_token=token.join('.')
  await page.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:sessionStorageKey,session})
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_context`,r=>r.fulfill({json:[{is_admin:true,permissions:['events.manage','codes.manage']}]}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_events`,r=>r.fulfill({json:[event]}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_codes`,r=>r.fulfill({json:[]}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_gallery_usage`,r=>r.fulfill({json:[{used_bytes:0,limit_bytes:900000000,photo_count:0}]}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_photos`,r=>r.fulfill({json:[]}))
  await page.goto('/?panel=admin')
  await expect(page.getByRole('heading',{name:'Fotos del evento',exact:true})).toBeVisible()
  await expect(page.getByLabel('Espacio de fotos utilizado')).toBeVisible()
  return Buffer.from(await page.evaluate(()=>{
    const canvas=document.createElement('canvas'); canvas.width=640;canvas.height=480
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#aaf01a';ctx.fillRect(0,0,640,480);ctx.fillStyle='#000';ctx.fillText('SYNTHETIC DANZ WATERMARK',10,450)
    return canvas.toDataURL('image/jpeg',0.9).split(',')[1]
  }),'base64')
}

test('an uploaded original is preserved, drafts require confirmation, and reselecting the same file does not upload twice',async({page})=>{
  const bytes=await install(page)
  const rows:any[]=[];let uploads=0;let publications=0
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_photos`,r=>r.fulfill({json:rows}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_prepare_photo`,async r=>{
    const p=r.request().postDataJSON();let row=rows.find(row=>row.sha256===p.p_sha256)
    if(!row){row={id:p.p_id,event_id:E,storage_path:`${E}/${p.p_id}/original.jpg`,preview_path:`${E}/${p.p_id}/preview.jpg`,original_name:p.p_name,status:'draft',upload_ready:false,sha256:p.p_sha256};rows.push(row)}
    await r.fulfill({json:[{...row,original_exists:row.upload_ready,preview_exists:row.upload_ready}]})
  })
  await page.route(`${supabaseHost}/storage/v1/object/danz-event-photos/**`,async r=>{
    uploads++
    if(r.request().url().endsWith('/original.jpg'))expect(r.request().postDataBuffer()!.includes(bytes)).toBe(true)
    await r.fulfill({json:{Key:'synthetic-upload'}})
  })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_finish_photo`,async r=>{rows.find(row=>row.id===r.request().postDataJSON().p_id).upload_ready=true;await r.fulfill({json:null})})
  await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos`,r=>r.fulfill({json:r.request().postDataJSON().paths.map((path:string)=>({path,signedURL:`/object/sign/danz-event-photos/${path}?token=synthetic`,error:null}))}))
  await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos/**`,r=>r.fulfill({contentType:'image/jpeg',body:bytes}))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_photo_state`,async r=>{publications++;for(const row of rows)row.status=r.request().postDataJSON().p_status;await r.fulfill({json:rows.length})})
  const file={name:'DANZ-calidad.jpg',mimeType:'image/jpeg',buffer:bytes}
  await page.getByLabel('Seleccionar fotos para subir',{exact:true}).setInputFiles([file])
  await expect(page.getByRole('button',{name:'SUBIR COMO BORRADORES',exact:true})).toBeDisabled()
  await page.getByLabel('Confirmo que las fotos ya incluyen su marca de agua.',{exact:true}).check()
  await page.getByRole('button',{name:'SUBIR COMO BORRADORES',exact:true}).click()
  await expect(page.getByText('1 de 1 completadas',{exact:true})).toBeVisible()
  expect(uploads).toBe(2);expect(publications).toBe(0)
  await page.getByLabel('Seleccionar las fotos listas de esta página',{exact:true}).check()
  await page.getByRole('button',{name:'PUBLICAR SELECCIONADAS (1)',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'Confirmar fotos',exact:true})).toBeVisible();expect(publications).toBe(0)
  await page.getByRole('button',{name:'CONFIRMAR FOTOS',exact:true}).click()
  await expect(page.getByText('1 fotos publicadas.',{exact:true})).toBeVisible();expect(publications).toBe(1)
  await page.getByLabel('Seleccionar fotos para subir',{exact:true}).setInputFiles([file])
  await page.getByLabel('Confirmo que las fotos ya incluyen su marca de agua.',{exact:true}).check()
  await page.getByRole('button',{name:'SUBIR COMO BORRADORES',exact:true}).click()
  await expect(page.getByText('1 de 1 completadas',{exact:true})).toBeVisible();expect(uploads).toBe(2)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
})

test('oversized batches and unsupported files are rejected before any upload',async({page})=>{
  const bytes=await install(page);let reservations=0
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_prepare_photo`,r=>{reservations++;return r.fulfill({json:[]})})
  await page.getByLabel('Seleccionar fotos para subir',{exact:true}).setInputFiles(Array.from({length:601},(_,i)=>({name:`foto-${i}.jpg`,mimeType:'image/jpeg',buffer:bytes})))
  await expect(page.getByRole('alert').filter({hasText:'Selecciona hasta 600 fotos por tanda.'})).toBeVisible()
  await page.getByLabel('Seleccionar fotos para subir',{exact:true}).setInputFiles({name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')})
  await expect(page.getByRole('alert').filter({hasText:'Usa archivos JPG, PNG o WebP.'})).toBeVisible()
  expect(reservations).toBe(0)
})

test('storage budget exhaustion stops the batch and keeps completed records',async({page})=>{
  const bytes=await install(page);let reservations=0
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_prepare_photo`,r=>{reservations++;return r.fulfill({status:400,json:{code:'54000',message:'Gallery storage budget exceeded'}})})
  await page.getByLabel('Seleccionar fotos para subir',{exact:true}).setInputFiles([{name:'a.jpg',mimeType:'image/jpeg',buffer:bytes},{name:'b.jpg',mimeType:'image/jpeg',buffer:bytes}])
  await page.getByLabel('Confirmo que las fotos ya incluyen su marca de agua.',{exact:true}).check()
  await page.getByRole('button',{name:'SUBIR COMO BORRADORES',exact:true}).click()
  await expect(page.getByRole('alert').filter({hasText:'La tanda supera el espacio disponible.'})).toBeVisible()
  expect(reservations).toBe(1)
})
