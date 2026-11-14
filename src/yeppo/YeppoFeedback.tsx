import {useState,type FormEvent} from 'react'
import {useAuth} from '../auth/AuthProvider'

type Category='error'|'sugerencia'|'ayuda'|'yeppo'
const CATEGORIES: {value:Category;label:string}[]=[
 {value:'error',label:'Algo no funciona'},
 {value:'sugerencia',label:'Tengo una idea'},
 {value:'ayuda',label:'Necesito ayuda'},
 {value:'yeppo',label:'Sobre Yeppo'},
]
type Section='inicio'|'pasaporte'|'fotos'|'arcade'|'danzers'|'danzin'|'danzflor'|'danzpoints'|'cuenta'|'admin'
export default function YeppoFeedback({page,onClose}:{page:Section;onClose:()=>void}){
 const {client,user}=useAuth()
 const [category,setCategory]=useState<Category>('sugerencia')
 const [message,setMessage]=useState('')
 const [busy,setBusy]=useState(false)
 const [result,setResult]=useState('')
 const [error,setError]=useState('')
 const [lastSent,setLastSent]=useState(0)
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault()
  if(!client||!user||busy)return
  const text=message.trim()
  if(text.length<10||text.length>1500){setError('Cuéntame un poco más (entre 10 y 1500 caracteres).');return}
  if(Date.now()-lastSent<60_000){setError('Espera un minuto antes de mandar otro mensaje.');return}
  setBusy(true);setError('');setResult('')
  try{
   const {data,error:reason}=await client.from('danz_yeppo_feedback').insert({user_id:user.id,category,section:page,message:text}).select('id').single()
   if(reason||!data)throw reason??new Error('Sin confirmación')
   setMessage('')
   setLastSent(Date.now())
   setResult('¡Recibido! Lo he dejado en la bandeja privada de DANZ. Administración podrá revisarlo.')
  }catch{setError('No he podido guardar tu mensaje. Comprueba la conexión y vuelve a intentarlo.')}
  finally{setBusy(false)}
 }
 return <section className="yeppo-feedback" aria-label="Enviar problema o sugerencia a DANZ">
  <div className="yeppo-feedback-title"><strong>LA BUZONERA DE YEPPO</strong><button type="button" onClick={onClose}>VOLVER AL CHAT</button></div>
  {!user||!client?<p>¡Tengo orejas de pétalo! Para guardar una sugerencia o incidencia de forma privada, entra primero con tu cuenta de DANZ. No me des contraseñas ni datos delicados.</p>
  :<form onSubmit={event=>{void submit(event)}}>
    <label htmlFor="yeppo-feedback-kind">¿Qué me cuentas?</label>
    <select id="yeppo-feedback-kind" value={category} onChange={e=>setCategory(e.target.value as Category)}>{CATEGORIES.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select>
    <label htmlFor="yeppo-feedback-message">Explícame qué ha pasado o qué mejorarías</label>
    <textarea id="yeppo-feedback-message" value={message} onChange={e=>setMessage(e.target.value)} minLength={10} maxLength={1500} rows={4} placeholder="Por ejemplo: en Arcade, al tocar el botón X…" required/>
    <p>Se guardará la sección actual y tu usuario para poder revisar el caso. No incluyas contraseñas ni información sensible.</p>
    <button type="submit" disabled={busy||message.trim().length<10}>{busy?'ENVIANDO…':'ENVIAR A DANZ ↗'}</button>
  </form>}
  {result&&<p role="status" className="yeppo-feedback-success">{result}</p>}
  {error&&<p role="alert" className="yeppo-feedback-error">{error}</p>}
 </section>
}
