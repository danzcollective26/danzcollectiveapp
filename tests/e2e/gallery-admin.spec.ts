import { test, expect, type Page } from '@playwright/test'
import { makeSession, mockSupabase, sessionStorageKey, supabaseHost } from './helpers/supabase'
import { readFile } from 'node:fs/promises'
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

async function savedAlbum(page: Page) {
  const bytes = await install(page)
  const second = { ...event, id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', title: 'Otra noche' }
  const rows = [{ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', event_id: E, storage_path: `${E}/original.jpg`, preview_path: `${E}/preview.jpg`, original_name: 'DANZ-original.jpg', status: 'draft', upload_ready: true }]
  let signs = 0
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_events`, r => r.fulfill({ json: [second, event] }))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_photos`, r => r.fulfill({ json: rows.filter(p => p.event_id === r.request().postDataJSON().p_event_id) }))
  await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos`, r => { signs++; return r.fulfill({ json: r.request().postDataJSON().paths.map((path: string) => ({ path, signedURL: `/object/sign/danz-event-photos/${path}?token=synthetic-${signs}`, error: null })) }) })
  await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos/**`, r => r.fulfill({ contentType: 'image/jpeg', body: bytes }))
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_photo_state`, r => { const request = r.request().postDataJSON(); for (const row of rows) if (request.p_ids.includes(row.id)) row.status = request.p_status; return r.fulfill({ json: request.p_ids.length }) })
  await page.getByRole('button', { name: 'ACTUALIZAR EVENTOS', exact: true }).click()
  await page.getByRole('button', { name: /Galería de prueba.*ABRIR ÁLBUM/ }).click()
  await expect(page.getByRole('button', { name: 'Abrir foto DANZ-original.jpg', exact: true })).toBeVisible()
  return { bytes, rows, signs: () => signs, second }
}

test('saved drafts stay in their album after Back, another section, reload and adding a second batch', async ({ page }) => {
  const { rows, bytes } = await savedAlbum(page)
  const opening = page.getByRole('button', { name: 'Abrir foto DANZ-original.jpg', exact: true })
  await page.getByRole('button', { name: '← VOLVER AL INICIO', exact: true }).click()
  await page.goBack()
  await expect(opening).toBeVisible()
  await page.getByRole('button', { name: 'Fotos', exact: true }).filter({ visible: true }).first().click()
  await expect(page.getByRole('heading', { name: 'MIS ÁLBUMES.', exact: true })).toBeVisible()
  await expect(opening).toBeVisible()
  await page.reload()
  await expect(opening).toBeVisible()
  await page.getByRole('button', { name: 'BORRADORES', exact: true }).click()
  await expect(opening).toBeVisible()
  let uploads = 0
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_prepare_photo`, r => {
    const p = r.request().postDataJSON()
    rows.push({ id: p.p_id, event_id: E, storage_path: `${E}/${p.p_id}/original.jpg`, preview_path: `${E}/${p.p_id}/preview.jpg`, original_name: p.p_name, status: 'draft', upload_ready: false })
    return r.fulfill({ json: [{ ...rows.at(-1), original_exists: false, preview_exists: false }] })
  })
  await page.route(`${supabaseHost}/storage/v1/object/danz-event-photos/**`, r => { uploads++; return r.fulfill({ json: { Key: 'synthetic' } }) })
  await page.route(`${supabaseHost}/rest/v1/rpc/danz_finish_photo`, r => { rows.find(p => p.id === r.request().postDataJSON().p_id)!.upload_ready = true; return r.fulfill({ json: null }) })
  await page.getByLabel('Seleccionar fotos para subir', { exact: true }).setInputFiles({ name: 'segunda-tanda.jpg', mimeType: 'image/jpeg', buffer: bytes })
  await page.getByLabel('Confirmo que las fotos ya incluyen su marca de agua.', { exact: true }).check()
  await page.getByRole('button', { name: 'SUBIR COMO BORRADORES', exact: true }).click()
  await expect(page.getByText('1 de 1 completadas', { exact: true })).toBeVisible()
  await expect(opening).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abrir foto segunda-tanda.jpg', exact: true })).toBeVisible()
  expect(rows).toHaveLength(2); expect(uploads).toBe(2)
})

test('the admin can open and download an original without an attendance stamp, and phone Back closes only the photo', async ({ page }) => {
  const { bytes } = await savedAlbum(page)
  const opening = page.getByRole('button', { name: 'Abrir foto DANZ-original.jpg', exact: true })
  await opening.click()
  const viewer = page.getByRole('dialog', { name: 'Foto del álbum Galería de prueba', exact: true })
  await expect(viewer).toBeVisible()
  await expect(viewer.getByRole('img')).toHaveJSProperty('naturalWidth', 640)
  const download = page.waitForEvent('download')
  await viewer.getByRole('button', { name: 'DESCARGAR ORIGINAL', exact: true }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('DANZ-original.jpg')
  expect(await readFile((await file.path())!)).toEqual(bytes)
  await page.goBack()
  await expect(viewer).toHaveCount(0)
  await expect(opening).toBeVisible()
  await opening.click()
  await viewer.getByRole('button', { name: 'Cerrar foto del álbum', exact: true }).click()
  await expect(viewer).toHaveCount(0)
  await expect(opening).toBeVisible()
})

test('published photos remain visible in My albums and previews renew after a minute', async ({ page }) => {
  await page.clock.install()
  const album = await savedAlbum(page)
  await page.getByLabel('Seleccionar las fotos listas de esta página', { exact: true }).check()
  await page.getByRole('button', { name: 'PUBLICAR SELECCIONADAS (1)', exact: true }).click()
  await page.getByRole('button', { name: 'CONFIRMAR FOTOS', exact: true }).click()
  await expect(page.getByText('1 fotos publicadas.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'PUBLICADAS', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Abrir foto DANZ-original.jpg', exact: true })).toBeVisible()
  const before = album.signs()
  await page.clock.fastForward(46_000)
  await expect.poll(album.signs).toBeGreaterThan(before)
  await page.clock.fastForward(16_000)
  await expect(page.getByRole('img', { name: 'Vista previa de DANZ-original.jpg', exact: true })).toHaveJSProperty('naturalWidth', 640)
  await page.getByRole('button', { name: /Otra noche.*ABRIR ÁLBUM/ }).click()
  await expect(page.getByRole('button', { name: 'Abrir foto DANZ-original.jpg', exact: true })).toHaveCount(0)
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Abrir foto DANZ-original.jpg', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

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

for (const denied of [{ status: 401, code: 'InvalidJWT' }, { status: 403, code: 'AccessDenied' }]) {
  test(`Storage ${denied.status} pauses the remaining batch and retry preserves completed originals`, async ({ page }) => {
    const bytes = await install(page)
    const rows: any[] = []
    const reservations: string[] = []
    const uploads: string[] = []
    let blocked = true
    await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_photos`, r => r.fulfill({ json: rows }))
    await page.route(`${supabaseHost}/rest/v1/rpc/danz_prepare_photo`, async r => {
      const p = r.request().postDataJSON()
      reservations.push(p.p_name)
      let row = rows.find(row => row.sha256 === p.p_sha256)
      if (!row) {
        row = { id: p.p_id, event_id: E, storage_path: `${E}/${p.p_id}/original.jpg`, preview_path: `${E}/${p.p_id}/preview.jpg`, original_name: p.p_name, status: 'draft', upload_ready: false, original_exists: false, preview_exists: false, sha256: p.p_sha256 }
        rows.push(row)
      }
      await r.fulfill({ json: [row] })
    })
    await page.route(`${supabaseHost}/storage/v1/object/danz-event-photos/**`, async r => {
      const path = new URL(r.request().url()).pathname
      const row = rows.find(row => path.endsWith(row.storage_path) || path.endsWith(row.preview_path))
      if (blocked && row.original_name === 'b.jpg') {
        await r.fulfill({ status: denied.status, json: { statusCode: String(denied.status), code: denied.code, message: 'Synthetic denied upload' } })
        return
      }
      uploads.push(row.original_name)
      row[path.endsWith(row.storage_path) ? 'original_exists' : 'preview_exists'] = true
      await r.fulfill({ json: { Key: 'synthetic-upload' } })
    })
    await page.route(`${supabaseHost}/rest/v1/rpc/danz_finish_photo`, async r => {
      rows.find(row => row.id === r.request().postDataJSON().p_id).upload_ready = true
      await r.fulfill({ json: null })
    })
    await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos`, r => r.fulfill({ json: r.request().postDataJSON().paths.map((path: string) => ({ path, signedURL: `/object/sign/danz-event-photos/${path}?token=synthetic`, error: null })) }))
    await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos/**`, r => r.fulfill({ contentType: 'image/jpeg', body: bytes }))
    await page.getByLabel('Seleccionar fotos para subir', { exact: true }).setInputFiles(['a', 'b', 'c'].map(name => ({ name: `${name}.jpg`, mimeType: 'image/jpeg', buffer: Buffer.concat([bytes, Buffer.from(name)]) })))
    await page.getByLabel('Confirmo que las fotos ya incluyen su marca de agua.', { exact: true }).check()
    await page.getByRole('button', { name: 'SUBIR COMO BORRADORES', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Hay que volver a verificar la sesión y los permisos.')
    await expect(page.getByText('1 de 3 completadas · Carga pausada · 1 pendientes de reintento', { exact: true })).toBeVisible()
    expect(reservations).toEqual(['a.jpg', 'b.jpg'])
    expect(uploads).toEqual(['a.jpg', 'a.jpg'])
    blocked = false
    await page.getByRole('button', { name: 'CONTINUAR CARGA', exact: true }).click()
    await expect(page.getByText('3 de 3 completadas', { exact: true })).toBeVisible()
    expect(reservations).toEqual(['a.jpg', 'b.jpg', 'b.jpg', 'c.jpg'])
    expect(uploads).toEqual(['a.jpg', 'a.jpg', 'b.jpg', 'b.jpg', 'c.jpg', 'c.jpg'])
    expect(rows).toHaveLength(3)
    expect(rows.every(row => row.upload_ready && row.status === 'draft')).toBe(true)
  })
}

for (const phase of ['prepare', 'preview', 'finish', 'service'] as const) {
  test(`${phase}: an interrupted batch pauses and resumes without overwriting a partially stored photo`, async ({ page }) => {
    const bytes = await install(page)
    const rows: any[] = []
    const reservations: string[] = []
    const uploads: string[] = []
    let interrupted = true
    await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_photos`, r => r.fulfill({ json: rows }))
    await page.route(`${supabaseHost}/rest/v1/rpc/danz_prepare_photo`, async r => {
      const p = r.request().postDataJSON()
      reservations.push(p.p_name)
      if (interrupted && p.p_name === 'b.jpg' && phase === 'prepare') { await r.abort('failed'); return }
      let row = rows.find(row => row.sha256 === p.p_sha256)
      if (!row) {
        row = { id: p.p_id, event_id: E, storage_path: `${E}/${p.p_id}/original.jpg`, preview_path: `${E}/${p.p_id}/preview.jpg`, original_name: p.p_name, status: 'draft', upload_ready: false, original_exists: false, preview_exists: false, sha256: p.p_sha256 }
        rows.push(row)
      }
      await r.fulfill({ json: [row] })
    })
    await page.route(`${supabaseHost}/storage/v1/object/danz-event-photos/**`, async r => {
      const path = new URL(r.request().url()).pathname
      const row = rows.find(row => path.endsWith(row.storage_path) || path.endsWith(row.preview_path))
      if (interrupted && row.original_name === 'b.jpg' && path.endsWith(row.preview_path)) {
        if (phase === 'preview') { await r.abort('failed'); return }
        if (phase === 'service') { await r.fulfill({ status: 503, json: { code: 'InternalError', statusCode: '503', message: 'Synthetic unavailable service' } }); return }
      }
      uploads.push(path)
      row[path.endsWith(row.storage_path) ? 'original_exists' : 'preview_exists'] = true
      await r.fulfill({ json: { Key: 'synthetic-upload' } })
    })
    await page.route(`${supabaseHost}/rest/v1/rpc/danz_finish_photo`, async r => {
      const row = rows.find(row => row.id === r.request().postDataJSON().p_id)
      if (interrupted && row.original_name === 'b.jpg' && phase === 'finish') { await r.abort('failed'); return }
      row.upload_ready = true
      await r.fulfill({ json: null })
    })
    await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos`, r => r.fulfill({ json: r.request().postDataJSON().paths.map((path: string) => ({ path, signedURL: `/object/sign/danz-event-photos/${path}?token=synthetic`, error: null })) }))
    await page.route(`${supabaseHost}/storage/v1/object/sign/danz-event-photos/**`, r => r.fulfill({ contentType: 'image/jpeg', body: bytes }))
    await page.getByLabel('Seleccionar fotos para subir', { exact: true }).setInputFiles(['a', 'b', 'c'].map(name => ({ name: `${name}.jpg`, mimeType: 'image/jpeg', buffer: Buffer.concat([bytes, Buffer.from(name)]) })))
    await page.getByLabel('Confirmo que las fotos ya incluyen su marca de agua.', { exact: true }).check()
    await page.getByRole('button', { name: 'SUBIR COMO BORRADORES', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(phase === 'service' ? 'El servicio de fotos no responde ahora.' : 'Se ha interrumpido la conexión.')
    await expect(page.getByText('1 de 3 completadas · Carga pausada · 1 pendientes de reintento', { exact: true })).toBeVisible()
    expect(reservations).not.toContain('c.jpg')
    expect(rows.find(row => row.original_name === 'a.jpg').upload_ready).toBe(true)
    const partial = rows.find(row => row.original_name === 'b.jpg')
    if (phase === 'preview' || phase === 'service') expect(partial).toMatchObject({ original_exists: true, preview_exists: false, upload_ready: false })
    if (phase === 'finish') expect(partial).toMatchObject({ original_exists: true, preview_exists: true, upload_ready: false })
    interrupted = false
    await page.getByRole('button', { name: 'CONTINUAR CARGA', exact: true }).click()
    await expect(page.getByText('3 de 3 completadas', { exact: true })).toBeVisible()
    expect(reservations.filter(name => name === 'a.jpg')).toHaveLength(1)
    expect(rows).toHaveLength(3)
    expect(rows.every(row => row.upload_ready && row.status === 'draft')).toBe(true)
    expect(uploads).toHaveLength(6)
    expect(new Set(uploads).size).toBe(6)
  })
}
