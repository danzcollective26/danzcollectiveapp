import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { euroAmount } from './amount'
import './DanzPoints.css'
type Receipt={id:string;reference:string;amount_cents:number;voided_at:string|null;code:string}
type Suggestion={id:string;kind:string;body:string;status:string}
export default function AdminPoints({client,eventId}:{client:SupabaseClient<Database>;eventId:string}){
 const [open,setOpen]=useState(false),[reload,setReload]=useState(0),[data,setData]=useState<{receipts:Receipt[];suggestions:Suggestion[]}|null>(null)
 const [code,setCode]=useState(''),[reference,setReference]=useState(''),[amount,setAmount]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 const alive=useRef(true),action=useRef<AbortController|null>(null)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;action.current?.abort()}},[])
 useEffect(()=>{
  if(!open)return
  let current=true;const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000)
  void(async()=>{try{const r=await client.rpc('danz_points_admin',{p_event_id:eventId}).abortSignal(abort.signal);if(r.error||!r.data||typeof r.data!=='object'||Array.isArray(r.data))throw Error();const v=r.data as {receipts?:unknown;suggestions?:unknown};if(!Array.isArray(v.receipts)||!Array.isArray(v.suggestions))throw Error();if(current)setData(v as {receipts:Receipt[];suggestions:Suggestion[]})}catch{if(current)setMessage('No se ha podido cargar DANZPOINTS. Comprueba la sesión de administración y reintenta.')}finally{clearTimeout(timer)}})()
  return()=>{current=false;clearTimeout(timer);abort.abort()}
 },[client,eventId,open,reload])
 async function save(event:FormEvent){
  event.preventDefault();const cents=euroAmount(amount);if(!cents){setMessage('Introduce un importe válido, por ejemplo 38,00.');return}if(action.current)return
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);action.current=abort;setBusy(true);setMessage('')
  try{const r=await client.rpc('danz_points_purchase',{p_event_id:eventId,p_code:code.trim(),p_reference:reference.trim(),p_amount_cents:cents}).abortSignal(abort.signal);if(r.error)throw Error();if(alive.current){setMessage('Compra verificada registrada. El límite de puntos se calcula automáticamente.');setReference('');setAmount('');setReload(x=>x+1)}}catch{if(alive.current)setMessage('No se ha registrado la compra. Comprueba código, ticket, evento del día 13 y sesión con verificación. Reintentar el mismo ticket no duplica puntos.')}finally{clearTimeout(timer);action.current=null;if(alive.current)setBusy(false)}
 }
 async function voidReceipt(id:string){
  if(action.current||!window.confirm('¿Anular este registro de puntos por devolución o error? No realiza una devolución de dinero.'))return
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);action.current=abort;setBusy(true)
  try{const r=await client.rpc('danz_points_void',{p_id:id}).abortSignal(abort.signal);if(r.error)throw Error();if(alive.current){setMessage('Registro anulado y puntos recalculados.');setReload(x=>x+1)}}catch{if(alive.current)setMessage('No se ha podido anular. Reinténtalo.')}finally{clearTimeout(timer);action.current=null;if(alive.current)setBusy(false)}
 }
 return <details className="account-card points-admin" onToggle={event=>setOpen(event.currentTarget.open)}><summary>DANZPOINTS · COMPRAS Y BUZÓN</summary>{open&&<><p>Piloto del 13 de noviembre: registra solo compras ya comprobadas. La asistencia se reconoce por el sello; todas las compras de ropa juntas tienen un límite de 600 puntos por evento.</p><form className="account-form" onSubmit={save}><label htmlFor="points-admin-code">CÓDIGO DANZ DEL COMPRADOR</label><input id="points-admin-code" value={code} required maxLength={16} autoCapitalize="characters" disabled={busy} placeholder="DNZ-ABCDEF123456" onChange={e=>setCode(e.target.value.toUpperCase())}/><label htmlFor="points-admin-reference">REFERENCIA DEL TICKET O PEDIDO</label><input id="points-admin-reference" value={reference} required maxLength={80} disabled={busy} onChange={e=>setReference(e.target.value)}/><label htmlFor="points-admin-amount">IMPORTE DE ROPA VERIFICADO (€)</label><input id="points-admin-amount" inputMode="decimal" value={amount} required disabled={busy} onChange={e=>setAmount(e.target.value)}/><label><input type="checkbox" required disabled={busy}/> He comprobado la compra y su importe.</label><button className="primary-btn" disabled={busy}>{busy?'REGISTRANDO…':'REGISTRAR COMPRA'}</button></form>{message&&<p role="status">{message}</p>}<button className="outline-btn" disabled={busy} onClick={()=>setReload(x=>x+1)}>ACTUALIZAR DANZPOINTS</button><div className="points-admin-list"><h3>COMPRAS REGISTRADAS</h3>{data?.receipts.map(r=><div key={r.id}><p>{r.reference} · {r.code} · {(r.amount_cents/100).toLocaleString('es-ES',{style:'currency',currency:'EUR'})}</p>{r.voided_at?<small>ANULADA</small>:<button className="outline-btn" disabled={busy} onClick={()=>voidReceipt(r.id)}>ANULAR REGISTRO</button>}</div>)}<h3>BUZÓN PRIVADO</h3>{data?.suggestions.map(s=><div key={s.id}><strong>{({reward:'RECOMPENSA',product:'PRODUCTO',activity:'ACTIVIDAD',other:'OTRA IDEA'})[s.kind]??'PROPUESTA'}</strong><p>{s.body}</p></div>)}{data&&!data.suggestions.length&&<p>Todavía no hay propuestas.</p>}</div></>}</details>
}
