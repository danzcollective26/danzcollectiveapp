import {test,expect} from '@playwright/test'
import {installMockSession,mockSupabase,supabaseHost} from './helpers/supabase'

test('radio picker is explicitly clickable on Android and shows selected file',async({page})=>{
 await mockSupabase(page)
 await installMockSession(page)
 await page.route(`${supabaseHost}/rest/v1/rpc/danz_admin_context`,route=>route.fulfill({json:[{is_admin:true,permissions:['events.manage']}]}))
 await page.goto('/?seccion=cuenta')
 const upload=page.getByRole('region',{name:'Publicar hilo musical'})
 await expect(upload.getByRole('button',{name:'ABRIR ARCHIVOS DEL MÓVIL'})).toBeVisible()
 const picker=page.waitForEvent('filechooser')
 await upload.getByRole('button',{name:'ABRIR ARCHIVOS DEL MÓVIL'}).click()
 const chooser=await picker
 expect(chooser.isMultiple()).toBe(true)
 await chooser.setFiles({name:'track-1.mp3',mimeType:'audio/mpeg',buffer:Buffer.from('ID3 audio fixture')})
 await expect(upload.getByText('track-1.mp3', {exact:false})).toBeVisible()
 await expect(upload.getByRole('button',{name:'PUBLICAR 1 MP3'})).toBeVisible()
})
