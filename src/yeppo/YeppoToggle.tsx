import {useEffect,useState} from 'react'
import {useAuth} from '../auth/AuthProvider'
import {readYeppoEnabled,setYeppoEnabled,YEPPO_PREFERENCE_EVENT} from './settings'

/** Local-first preference; signed-in members also sync it with danz_profiles. */
export default function YeppoToggle(){
 const {client,user}=useAuth()
 const [enabled,setEnabled]=useState(readYeppoEnabled)
 const [saving,setSaving]=useState(false)
 const [issue,setIssue]=useState('')
 useEffect(()=>{
  const refresh=()=>setEnabled(readYeppoEnabled())
  window.addEventListener(YEPPO_PREFERENCE_EVENT,refresh)
  return()=>window.removeEventListener(YEPPO_PREFERENCE_EVENT,refresh)
 },[])
 useEffect(()=>{
  if(!client||!user)return
  let current=true
  void client.from('danz_profiles').select('yeppo_enabled').eq('user_id',user.id).maybeSingle().then(({data,error})=>{
   if(current&&!error&&data){setYeppoEnabled(data.yeppo_enabled)}
  })
  return()=>{current=false}
 },[client,user?.id])
 const toggle=async()=>{
  const next=!enabled
  setYeppoEnabled(next);setEnabled(next);setIssue('')
  if(!client||!user)return
  setSaving(true)
  try{
   const existing=await client.from('danz_profiles').select('user_id').eq('user_id',user.id).maybeSingle()
   if(existing.error)throw existing.error
   const result=existing.data
      ? await client.from('danz_profiles').update({yeppo_enabled:next}).eq('user_id',user.id)
      : await client.from('danz_profiles').insert({user_id:user.id,yeppo_enabled:next})
   if(result.error)throw result.error
  }catch{setIssue('Preferencia guardada en este dispositivo; no se pudo sincronizar con tu cuenta.')}
  finally{setSaving(false)}
 }
 return <section className="account-card" aria-label="Preferencias de Yeppo">
   <h2>Yeppo, la flor vacilona</h2>
   <p className="account-note">De vez en cuando aparece con alguna pullita. Sin sonidos, sin chatbot y sin interrumpir partidas.</p>
   <label className="yeppo-pref"><input type="checkbox" checked={enabled} onChange={()=>{void toggle()}} disabled={saving}/><span>Yeppo {enabled?'activado':'desactivado'}</span></label>
   {issue&&<p className="account-note" role="status">{issue}</p>}
 </section>
}
