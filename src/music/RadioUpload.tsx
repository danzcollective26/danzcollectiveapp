import {useState, type ChangeEvent} from 'react'
import {useAuth} from '../auth/AuthProvider'
import {useAdminAccess} from '../admin/access'
import {DANZ_TRACKS} from './playlist'
import './upload.css'
/** Browser-side upload. Server RLS independently checks membership in danz_admins. */
export default function RadioUpload(){
 const {client,user,loading}=useAuth()
 const access=useAdminAccess(client,user?.id??null,loading)
 const [busy,setBusy]=useState(false)
 const [status,setStatus]=useState('')
 const [progress,setProgress]=useState(0)
 if(!user||!access.member)return null
 const upload=async(event:ChangeEvent<HTMLInputElement>)=>{
  if(!client||busy)return
  const input=event.currentTarget
  const files=Array.from(input.files??[])
  if(!files.length)return
  const chosen=files.map(file=>({file,match:/^track-([1-6])\.mp3$/i.exec(file.name)}))
  if(chosen.some(item=>!item.match||!item.file.type.includes('audio')&&!item.file.name.toLowerCase().endsWith('.mp3')||item.file.size>12*1024*1024)){
   setStatus('Selecciona los MP3 preparados: track-1.mp3 a track-6.mp3, máximo 12 MB cada uno.');input.value='';return
  }
  setBusy(true);setProgress(0);setStatus('Publicando audio…')
  try{
   for(let i=0;i<chosen.length;i++){
    const {file}=chosen[i]
    const {error}=await client.storage.from('danz-radio').upload(file.name.toLowerCase(),file,{contentType:'audio/mpeg',upsert:true,cacheControl:'3600'})
    if(error)throw new Error('No se pudo subir '+file.name+'. Comprueba la sesión y los permisos.')
    setProgress(i+1)
   }
   setStatus('Listo: '+chosen.length+' archivo(s) publicado(s). Actualiza la app para escuchar el hilo musical.')
  }catch(reason){setStatus(reason instanceof Error?reason.message:'Error subiendo el audio.')}
  finally{setBusy(false);input.value=''}
 }
 return <section className="account-card danz-radio-upload" aria-label="Publicar hilo musical">
   <h2>Hilo musical · administración</h2>
   <p className="account-note">Solo administradores: publica los seis MP3 optimizados. La música se escuchará en la app cuando estén cargados. Utiliza únicamente temas con derechos autorizados.</p>
   <input type="file" id="danz-radio-upload-files" accept=".mp3,audio/mpeg" multiple disabled={busy} onChange={event=>{void upload(event)}}/>
   <label htmlFor="danz-radio-upload-files" className="outline-btn">SELECCIONAR LOS 6 MP3</label>
   <p className="account-note">{DANZ_TRACKS.map((track,n)=>((n+1)+'. '+track.title)).join(' · ')}</p>
   {busy&&<p role="status">Subiendo {progress}/{6} archivos…</p>}
   {status&&<p role="status">{status}</p>}
 </section>
}
