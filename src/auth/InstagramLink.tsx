import {useEffect,useRef,useState,type FormEvent} from 'react'
import {useAuth} from './AuthProvider'
import {notifyIdentity,useIdentity} from './useIdentity'
export default function InstagramLink(){
 const auth=useAuth(),identity=useIdentity(),[handle,setHandle]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),action=useRef<AbortController|null>(null),alive=useRef(true)
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;action.current?.abort()}},[])
 useEffect(()=>{if(identity.data)setHandle(identity.data.profileHandle??identity.data.handle??'')},[identity.data])
 async function request(e:FormEvent){
  e.preventDefault();if(!auth.client||action.current)return
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);action.current=abort;setBusy(true);setMessage('')
  try{const r=await auth.client.rpc('danz_instagram_request',{p_handle:handle}).abortSignal(abort.signal);if(r.error)throw r.error;if(alive.current){setMessage('Código preparado. Compruébalo abajo y envíalo desde tu Instagram.');notifyIdentity()}}
  catch(e){if(alive.current){const code=(e as {code?:string})?.code;setMessage(code==='54000'?'Puedes cambiar la solicitud cinco veces al día. Prueba mañana.':code==='22023'?'Revisa el usuario. Ese Instagram puede estar vinculado a otra cuenta.':'No se ha podido preparar el código. Comprueba que tu correo esté confirmado y reinténtalo.')}}
  finally{clearTimeout(timer);action.current=null;if(alive.current)setBusy(false)}
 }
 const d=identity.data
 return <section className="account-card instagram-link" aria-label="Vincular Instagram para puntos"><h2>INSTAGRAM + DANZPOINTS</h2><p className="account-note">Para competir y disponer de puntos necesitas correo confirmado e Instagram verificado. La vinculación une ese Instagram con tu cuenta DANZ.</p>
 {identity.loading?<p aria-live="polite">Comprobando la vinculación…</p>:identity.error?<><p>No se ha podido consultar tu vinculación.</p><button className="outline-btn" onClick={identity.refresh}>REINTENTAR VINCULACIÓN</button></>:d&&<>
  {d.verified?<><p className="account-success">INSTAGRAM VERIFICADO · @{d.handle}</p><p className="account-note">Tu cuenta puede competir y disponer de DANZPOINTS. Si cambias el Instagram del perfil tendrás que comprobar la nueva vinculación.</p></>:<>
   {!d.emailVerified&&<p className="account-note">Confirma tu correo accediendo desde el enlace o código enviado a tu email.</p>}
   {d.status==='changed'&&<p>El Instagram del perfil ha cambiado. Verifica el nuevo usuario para disponer de tus puntos.</p>}
   {d.status==='rejected'&&<p>No hemos podido comprobar la solicitud anterior. Revisa el usuario y solicita otro código.</p>}
   <form className="account-form" onSubmit={request}><label htmlFor="verified-instagram">INSTAGRAM PARA VERIFICAR</label><input id="verified-instagram" value={handle} maxLength={31} required pattern="@?[A-Za-z0-9_.]{1,30}" disabled={busy||!d.emailVerified} placeholder="@tuusuario" onChange={e=>setHandle(e.target.value)}/><button className="primary-btn" disabled={busy||!d.emailVerified}>{busy?'PREPARANDO…':'PREPARAR MI CÓDIGO'}</button></form>
   {d.status==='pending'&&d.code&&<div className="instagram-proof"><label htmlFor="instagram-code">TU CÓDIGO DE VINCULACIÓN</label><input id="instagram-code" readOnly value={d.code} onFocus={e=>e.target.select()}/><ol><li>Envía <strong>{d.code}</strong> desde <strong>@{d.handle}</strong> por mensaje directo a DANZ Collective en Instagram. También puedes ponerlo temporalmente en la bio de ese perfil.</li><li>El equipo comprobará que el código llega desde ese usuario o aparece en su bio y validará la solicitud.</li><li>Al estar validado, pulsa ACTUALIZAR VINCULACIÓN. Puedes retirar el código de la bio después de la aprobación.</li></ol><a className="outline-btn external-btn" href="https://www.instagram.com/danzcollective/" target="_blank" rel="noopener noreferrer">ABRIR INSTAGRAM DE DANZ ↗</a><p className="account-note">La revisión es manual. El código caduca a los siete días; tus puntos quedan reservados mientras tanto. No te pedimos la contraseña de Instagram.</p></div>}
  </>}
  <button className="outline-btn" onClick={identity.refresh}>ACTUALIZAR VINCULACIÓN ↻</button>
 </>}{message&&<p aria-live="polite">{message}</p>}</section>
}
