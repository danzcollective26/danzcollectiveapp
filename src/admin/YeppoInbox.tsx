import {useEffect,useState} from 'react'
import type {SupabaseClient} from '@supabase/supabase-js'
import type {Database} from '../types/database'
type Item=Database['public']['Tables']['danz_yeppo_feedback']['Row']
const category:Record<string,string>={error:'Error',sugerencia:'Sugerencia',ayuda:'Ayuda',yeppo:'Yeppo'}
const status:Record<string,string>={new:'Nuevo',reviewing:'En revisión',resolved:'Resuelto'}
export default function YeppoInbox({client}:{client:SupabaseClient<Database>}){
 const [items,setItems]=useState<Item[]>([])
 const [loading,setLoading]=useState(true)
 const [problem,setProblem]=useState('')
 const [refresh,setRefresh]=useState(0)
 const [updating,setUpdating]=useState<string|null>(null)
 useEffect(()=>{
  let active=true
  setLoading(true);setProblem('')
  const controller=new AbortController()
  void client.from('danz_yeppo_feedback').select('id,user_id,category,section,message,status,created_at,updated_at').order('created_at',{ascending:false}).limit(60).abortSignal(controller.signal).then(({data,error})=>{
    if(!active)return
    if(error){setProblem('No se ha podido cargar el buzón. Comprueba tus permisos.');setItems([])}
    else setItems(data??[])
    setLoading(false)
  })
  return()=>{active=false;controller.abort()}
 },[client,refresh])
 const update=async(item:Item,next:string)=>{
  setUpdating(item.id);setProblem('')
  const {error}=await client.from('danz_yeppo_feedback').update({status:next,updated_at:new Date().toISOString()}).eq('id',item.id)
  if(error)setProblem('No se pudo actualizar esta incidencia. Comprueba tus permisos.')
  else setRefresh(n=>n+1)
  setUpdating(null)
 }
 return <section className="account-card yeppo-inbox" aria-label="Buzón de Yeppo">
  <div className="admin-heading"><h2>🌸 Buzón de Yeppo</h2><button type="button" className="outline-btn" onClick={()=>setRefresh(n=>n+1)}>ACTUALIZAR</button></div>
  <p>Incidencias y sugerencias enviadas desde Yeppo por usuarios identificados. Solo administración puede revisar el conjunto. Las entradas más recientes aparecen primero.</p>
  {loading&&<p role="status">Cargando mensajes…</p>}
  {problem&&<p role="alert" className="account-error">{problem}</p>}
  {!loading&&!items.length&&!problem&&<p>Todavía no hay mensajes.</p>}
  <ul className="yeppo-inbox-list">{items.map(item=><li key={item.id}>
   <div><strong>{category[item.category]??item.category}</strong> · {item.section} · {new Date(item.created_at).toLocaleString('es-ES')}</div>
   <p>{item.message}</p>
   <small>Usuario: {item.user_id.slice(0,8)}… · {status[item.status]??item.status}</small>
   <div className="admin-actions">
    {(['new','reviewing','resolved'] as const).map(next=><button key={next} type="button" className="outline-btn" disabled={updating!==null||item.status===next} onClick={()=>{void update(item,next)}}>{status[next]}</button>)}
   </div>
  </li>)}</ul>
  {items.length===60&&<p>Mostrando los 60 mensajes más recientes.</p>}
 </section>
}
