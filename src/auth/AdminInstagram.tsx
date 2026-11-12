import {useEffect,useRef,useState} from 'react'
import type {SupabaseClient} from '@supabase/supabase-js'
import type {Database} from '../types/database'
type Request={user_id:string;handle:string;challenge:string;requested_at:string}
export default function AdminInstagram({client}:{client:SupabaseClient<Database>}){
 const[rows,setRows]=useState<Request[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[reload,setReload]=useState(0),[confirmed,setConfirmed]=useState<Record<string,boolean>>({}),[busy,setBusy]=useState('')
 const action=useRef<AbortController|null>(null),alive=useRef(true)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;action.current?.abort()}},[])
 useEffect(()=>{
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);let current=true;setLoading(true);setError('')
  void(async()=>{try{const r=await client.rpc('danz_instagram_admin').abortSignal(abort.signal);if(r.error||!Array.isArray(r.data)||r.data.length>100)throw Error();const data=r.data.map(raw=>{if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error();const v=raw as Record<string,unknown>;if(typeof v.user_id!=='string'||typeof v.handle!=='string'||!/^[a-z0-9_.]{1,30}$/.test(v.handle)||typeof v.challenge!=='string'||!/^DANZ-[A-F0-9]{10}$/.test(v.challenge)||typeof v.requested_at!=='string')throw Error();return v as Request});if(current){setRows(data);setConfirmed({})}}catch{if(current)setError('No se han podido consultar las solicitudes. Revisa tu sesión administrativa y reinténtalo.')}finally{clearTimeout(timer);if(current)setLoading(false)}})()
  return()=>{current=false;clearTimeout(timer);abort.abort()}
 },[client,reload])
 async function review(row:Request,approve:boolean){
  if(action.current||(approve&&!confirmed[row.user_id]))return
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);action.current=abort;setBusy(row.user_id);setError('')
  try{const r=await client.rpc('danz_instagram_review',{p_user:row.user_id,p_code:row.challenge,p_approve:approve}).abortSignal(abort.signal);if(r.error)throw Error();if(alive.current)setReload(n=>n+1)}catch{if(alive.current)setError('No se pudo revisar. La solicitud puede haber cambiado o tu sesión requiere comprobarse. Recarga la lista.')}finally{clearTimeout(timer);action.current=null;if(alive.current)setBusy('')}
 }
 return <section className="account-card admin-instagram" aria-label="Verificación de Instagram"><h2>VERIFICAR INSTAGRAM</h2><p className="account-note">Comprueba el código en un mensaje recibido desde ese usuario o en la bio del perfil indicado. No valides un nombre escrito sin prueba. Esta revisión requiere tu sesión con doble factor.</p>{loading?<p>Cargando solicitudes…</p>:rows.length?rows.map(r=><article key={r.user_id} className="instagram-review"><a href={`https://www.instagram.com/${r.handle}/`} target="_blank" rel="noopener noreferrer">@{r.handle} ↗</a><p>Código a comprobar: <strong>{r.challenge}</strong></p><label><input type="checkbox" checked={Boolean(confirmed[r.user_id])} onChange={e=>setConfirmed(v=>({...v,[r.user_id]:e.target.checked}))} disabled={Boolean(busy)}/> He comprobado este código desde este Instagram.</label><div><button className="primary-btn" disabled={Boolean(busy)||!confirmed[r.user_id]} onClick={()=>void review(r,true)}>VALIDAR VINCULACIÓN</button><button className="outline-btn" disabled={Boolean(busy)} onClick={()=>void review(r,false)}>RECHAZAR SOLICITUD</button></div></article>):<p>No hay solicitudes pendientes vigentes.</p>}{error&&<p aria-live="polite">{error}</p>}<button className="outline-btn" disabled={loading||Boolean(busy)} onClick={()=>setReload(n=>n+1)}>ACTUALIZAR SOLICITUDES ↻</button></section>
}
