import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import type { Json } from '../types/database'
import './DanzPoints.css'

type Activity = { title: string; attendance: number; clothing: number; active: boolean }
type Summary = { code: string; available: number; pending: number; arcade: number; events: Activity[] }
export const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
function summary(value: Json): Summary {
  const v = object(value)
  if (typeof v.code !== 'string' || !/^DNZ-[A-F0-9]{12}$/.test(v.code) || !Number.isSafeInteger(v.available) || !Number.isSafeInteger(v.pending) || Number(v.available)<0 || Number(v.pending)<0 || !Array.isArray(v.events)) throw new Error('Invalid points response')
  const events = v.events.map(raw => { const e=object(raw); if(typeof e.title!=='string'||!Number.isSafeInteger(e.attendance)||!Number.isSafeInteger(e.clothing)||typeof e.active!=='boolean')throw new Error('Invalid activity');return e as Activity })
  return { code:v.code, available:Number(v.available), pending:Number(v.pending), arcade:Number.isSafeInteger(v.arcade)&&Number(v.arcade)>=0?Number(v.arcade):0, events }
}

export default function DanzPoints({ onSignIn }: { onSignIn: () => void }) {
  const auth = useAuth()
  const [data,setData]=useState<Summary|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[reload,setReload]=useState(0)
  const [kind,setKind]=useState('reward'),[body,setBody]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
  const request=useRef<string|null>(null), action=useRef<AbortController|null>(null), alive=useRef(true)
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;action.current?.abort()}},[])
  useEffect(()=>{
    setData(null);setError('')
    if(!auth.client||!auth.user)return
    const client=auth.client,abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);let current=true;setLoading(true)
    void (async()=>{try{const r=await client.rpc('danz_points_summary').abortSignal(abort.signal);if(r.error||!r.data)throw Error();const next=summary(r.data);if(current)setData(next)}catch{if(current)setError('No hemos podido consultar tus puntos. Puedes reintentarlo.')}finally{clearTimeout(timer);if(current)setLoading(false)}})()
    return()=>{current=false;clearTimeout(timer);abort.abort()}
  },[auth.client,auth.user?.id,reload])
  async function send(event:FormEvent){
    event.preventDefault();if(!auth.client||!auth.user||action.current)return
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);action.current=abort;request.current??=crypto.randomUUID();setBusy(true);setMessage('')
    try{const r=await auth.client.rpc('danz_points_suggest',{p_id:request.current,p_kind:kind,p_body:body.trim()}).abortSignal(abort.signal);if(r.error){if(alive.current)setMessage(r.error.code==='54000'?'Has enviado cinco sugerencias en las últimas 24 horas. Prueba más tarde.':'No se ha podido enviar. Reinténtalo.');return}if(alive.current){setBody('');request.current=null;setMessage('Sugerencia recibida. La revisará el equipo.')}}catch{if(alive.current)setMessage('No se ha podido enviar. Reinténtalo.')}finally{clearTimeout(timer);action.current=null;if(alive.current)setBusy(false)}
  }
  return <div className="danz-points">
    <p className="points-intro">Ven, participa y elige tu próxima recompensa. Empezamos a acumular en DANZERS WORLD del <strong>13 de noviembre</strong>; los premios se desvelarán próximamente.</p>
    <section className="points-balance" aria-label="Mis DANZPOINTS"><h2>MIS DANZPOINTS</h2>{auth.loading||loading?<p role="status">Consultando tus puntos…</p>:!auth.user?<><p>Accede a tu cuenta para guardar tus puntos y enviar propuestas.</p><button className="primary-btn" onClick={onSignIn}>ACCEDER A MI CUENTA ↗</button></>:<>{error&&<p role="alert">{error}</p>}{data&&<><strong className="points-total">{data.available.toLocaleString('es-ES')} <small>POINTS</small></strong>{data.pending>0&&<p>{data.pending} puntos reservados. Se activarán cuando empiece el evento.</p>}<label htmlFor="points-code">MI CÓDIGO DANZ</label><input id="points-code" readOnly value={data.code} onFocus={e=>e.target.select()} /><p className="points-small">Enséñalo al registrar una compra verificada. No es una contraseña.</p>{data.arcade>0&&<p>Premios semanales de ARCADANZ: {data.arcade} puntos acumulados.</p>}{data.events.map(e=><p key={e.title}>{e.title}: {e.attendance} por asistencia · {e.clothing} por ropa{e.active?'':' · pendientes de inicio'}</p>)}</>}<button className="outline-btn" disabled={loading} onClick={()=>setReload(x=>x+1)}>ACTUALIZAR PUNTOS ↻</button></>}</section>
    <section className="points-rules"><h2>LA BASE DEL DÍA 13</h2><div><p><strong>1.000</strong><span>ASISTIR A DANZERS</span><small>Al añadir el sello del evento a tu cuenta.</small></p><p><strong>5 / €</strong><span>COMPRAS DE ROPA</span><small>Máximo conjunto: 600 puntos de ropa por evento. Solo compras verificadas.</small></p><p><strong>50</strong><span>CAMPEÓN SEMANAL DE SNAKE</span><small>Nº 1 semanal de Clásico. Máximo tres semanas seguidas y 20 premios al año.</small></p></div><p className="points-small">Base provisional del piloto. La asistencia vale más que todas las compras de ropa juntas en el mismo evento. Las devoluciones ajustan los puntos de compra. Los 20 premios anuales de Snake equivalen a una asistencia: 1.000 puntos. Practicar o enviar sugerencias no suma DANZPOINTS.</p></section>
    <section aria-label="Elegir recompensas"><h2>TU PRÓXIMA RECOMPENSA</h2><p>Estamos preparando las opciones. Todavía no hay canjes abiertos.</p><div className="points-rewards">{['FIESTAS','ROPA','BARRA','EXPERIENCIAS'].map(label=><div key={label}><span aria-hidden="true">?</span><h3>{label}</h3><small>POR DESVELAR</small></div>)}</div></section>
    <section className="points-mailbox"><h2>EL BUZÓN DEL COLECTIVO</h2><p>Propón una recompensa, pide un producto o sugiere una actividad. Tu mensaje lo recibe el equipo, de forma privada.</p>{!auth.user?<button className="outline-btn" onClick={onSignIn}>ACCEDER PARA PROPONER ↗</button>:<form onSubmit={send}><label htmlFor="points-kind">QUÉ PROPONES</label><select id="points-kind" disabled={busy} value={kind} onChange={e=>{setKind(e.target.value);request.current=null}}><option value="reward">Una recompensa</option><option value="product">Un producto o petición</option><option value="activity">Una actividad</option><option value="other">Otra sugerencia</option></select><label htmlFor="points-body">TU IDEA</label><textarea id="points-body" disabled={busy} minLength={5} maxLength={1000} required value={body} onChange={e=>{setBody(e.target.value);request.current=null}} placeholder="Cuéntanos qué te gustaría encontrar en DANZ…" /><button className="primary-btn" disabled={busy}>{busy?'ENVIANDO…':'ENVIAR PROPUESTA ↗'}</button>{message&&<p role="status">{message}</p>}</form>}</section>
  </div>
}
