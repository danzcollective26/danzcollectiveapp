import {useCallback,useEffect,useRef,useState, type ChangeEvent} from 'react'
import {useAuth} from '../auth/AuthProvider'
import {useAdminAccess} from '../admin/access'
import {DANZ_TRACKS} from './playlist'
import './upload.css'

const MAX_BYTES=12*1024*1024
type UploadPhase='idle'|'selected'|'uploading'|'done'|'error'
function slot(file:File){const match=/^track-([1-6])\.mp3$/i.exec(file.name);return match?Number(match[1]):null}
function selectionIssue(files:File[]):string|null {
 if(!files.length)return 'No se ha seleccionado ningún archivo.'
 if(files.length>6)return 'Selecciona como máximo 6 canciones.'
 const seen=new Set<number>()
 for(const file of files){
  const number=slot(file)
  if(number===null)return 'Nombre no reconocido: '+file.name+'. Utiliza track-1.mp3 hasta track-6.mp3.'
  if(seen.has(number))return 'Has seleccionado dos veces track-'+number+'.mp3.'
  seen.add(number)
  if(file.size===0)return file.name+' está vacío.'
  if(file.size>MAX_BYTES)return file.name+' supera el límite de 12 MB.'
 }
 return null
}

/** Native file picker on Android, explicit confirmation and server-side RLS for admin uploads. */
export default function RadioUpload(){
 const {client,user,loading}=useAuth()
 const access=useAdminAccess(client,user?.id??null,loading)
 const inputRef=useRef<HTMLInputElement>(null)
 const [selected,setSelected]=useState<File[]>([])
 const [chooserOpened,setChooserOpened]=useState(false)
 const [phase,setPhase]=useState<UploadPhase>('idle')
 const [status,setStatus]=useState('')
 const [completed,setCompleted]=useState(0)
 const [current,setCurrent]=useState('')
 const [uploaded,setUploaded]=useState<number[]>([])
 const [checking,setChecking]=useState(false)
 const [refresh,setRefresh]=useState(0)
 const mounted=useRef(true)
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[])
 const checkFiles=useCallback(async()=>{
  if(!client||!user||!access.member)return
  setChecking(true)
  const {data,error}=await client.storage.from('danz-radio').list('',{limit:20})
  if(!mounted.current)return
  if(!error&&data)setUploaded(data.map(f=>Number(/^track-([1-6])\.mp3$/i.exec(f.name)?.[1])).filter(n=>Number.isInteger(n)&&n>=1&&n<=6))
  setChecking(false)
 },[client,user?.id,access.member])
 useEffect(()=>{void checkFiles()},[checkFiles,refresh])
 const openPicker=()=>{
  setStatus('Abriendo archivos del teléfono… Si no aparece el selector, abre DANZ directamente en Chrome con el enlace de abajo.')
  setChooserOpened(true)
  inputRef.current?.click()
 }
 const select=(event:ChangeEvent<HTMLInputElement>)=>{
  const files=Array.from(event.currentTarget.files??[])
  setChooserOpened(false)
  setSelected(files)
  setCompleted(0)
  setCurrent('')
  if(!files.length){setPhase('idle');setStatus('No has elegido archivos.');return}
  const issue=selectionIssue(files)
  if(issue){setPhase('error');setStatus(issue)}
  else {setPhase('selected');setStatus(files.length+' archivo(s) seleccionado(s). Pulsa PUBLICAR para empezar.')}
 }
 const upload=async()=>{
  if(!client||!user||!access.member||phase==='uploading')return
  const files=[...selected]
  const issue=selectionIssue(files)
  if(issue){setStatus(issue);setPhase('error');return}
  setPhase('uploading');setCompleted(0);setStatus('Comenzando publicación…')
  let done=0
  for(const file of files){
   if(!mounted.current)return
   setCurrent(file.name)
   setStatus('Subiendo '+file.name+' ('+(done+1)+' de '+files.length+')…')
   try{
    const {error}=await client.storage.from('danz-radio').upload(file.name.toLowerCase(),file,{contentType:'audio/mpeg',upsert:true,cacheControl:'3600'})
    if(!mounted.current)return
    if(error){setPhase('error');setStatus('No se pudo publicar '+file.name+': '+error.message+' (código '+(error.statusCode||'sin código')+'). Los '+done+' archivos anteriores se han conservado.');setCurrent('');return}
   }catch(reason){
    if(!mounted.current)return
    setPhase('error')
    setStatus('Error de conexión al subir '+file.name+': '+(reason instanceof Error?reason.message:'desconocido'))
    setCurrent('')
    return
   }
   done++
   setCompleted(done)
  }
  if(!mounted.current)return
  setPhase('done');setCurrent('')
  setStatus('¡Publicado! '+done+' archivo(s) subido(s). Abre Inicio y toca ▶ en el hilo musical.')
  setRefresh(value=>value+1)
  setSelected([])
  if(inputRef.current)inputRef.current.value=''
 }
 if(!user||!access.member)return null
 return <section className="account-card danz-radio-upload" aria-label="Publicar hilo musical">
  <h2>Hilo musical · administración</h2>
  <p className="account-note">Selecciona uno o varios MP3 desde tu móvil. Solo administradores pueden publicarlos. Publica únicamente música cuya difusión esté autorizada.</p>
  <label className="danz-radio-file-label" htmlFor="danz-radio-upload-files">Elegir MP3 (uno, varios o los seis)</label>
  <button type="button" className="primary-btn danz-radio-picker-button" disabled={phase==='uploading'} onClick={openPicker}>ABRIR ARCHIVOS DEL MÓVIL</button>
  <input ref={inputRef} type="file" id="danz-radio-upload-files" accept=".mp3,audio/mpeg" multiple disabled={phase==='uploading'} onChange={select} aria-label="Elegir archivos MP3 con el selector nativo"/>
  {chooserOpened&&<p className="danz-radio-upload-hint" role="status">¿No aparece ninguna ventana? Puede ser el navegador integrado. Abre la aplicación en Google Chrome directamente, no dentro de ChatGPT o Gmail.</p>}
  <a className="outline-btn danz-radio-chrome-link" href="https://danzcollectiveapp.vercel.app/?seccion=cuenta" target="_blank" rel="noopener noreferrer">ABRIR DANZ EN OTRA PESTAÑA ↗</a>
  {selected.length>0&&<ul className="danz-radio-selection">{selected.map(file=><li key={file.name}>{file.name} · {(file.size/1024/1024).toFixed(1)} MB</li>)}</ul>}
  {phase==='selected'&&<button type="button" className="primary-btn" onClick={()=>{void upload()}}>PUBLICAR {selected.length} MP3</button>}
  {phase==='error'&&selected.length>0&&<button type="button" className="outline-btn" onClick={()=>{void upload()}}>REINTENTAR SUBIDA</button>}
  {phase==='uploading'&&<progress max={selected.length} value={completed} aria-label="Progreso de subida"/>}
  <p className="danz-radio-upload-status" role="status" aria-live="polite">{status||'Todavía no has seleccionado ningún MP3.'}</p>
  {phase==='uploading'&&<p role="status">Archivo actual: {current} · {completed}/{selected.length} completados. Mantén abierta esta pantalla.</p>}
  <div className="danz-radio-upload-library">
    <strong>Temas publicados: {uploaded.length} / 6 {checking?'(comprobando…)':''}</strong>
    <button type="button" className="outline-btn" disabled={checking||phase==='uploading'} onClick={()=>setRefresh(n=>n+1)}>COMPROBAR CANCIONES</button>
    <ol>{DANZ_TRACKS.filter(track=>!track.protectedId).map((track,n)=><li key={track.id}>{uploaded.includes(n+1)?'✓':'○'} {track.title} {uploaded.includes(n+1)?'· PUBLICADO':'· PENDIENTE'}</li>)}</ol>
  </div>
 </section>
}
