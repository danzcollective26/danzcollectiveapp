import {useEffect,useState} from 'react'
import {useAuth} from './AuthProvider'
import type {Json} from '../types/database'
export type Identity={verified:boolean;emailVerified:boolean;handle:string|null;profileHandle:string|null;status:'none'|'pending'|'verified'|'changed'|'rejected';code:string|null;expiresAt:string|null}
export function parseIdentity(value:Json):Identity{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid identity')
 const v=value as Record<string,unknown>
 if(typeof v.verified!=='boolean'||typeof v.emailVerified!=='boolean'||!['none','pending','verified','changed','rejected'].includes(String(v.status))||![v.handle,v.profileHandle,v.code,v.expiresAt].every(s=>s===null||typeof s==='string'))throw Error('Invalid identity')
 return v as Identity
}
export const IDENTITY_CHANGE='danz-identity-change'
export const notifyIdentity=()=>window.dispatchEvent(new Event(IDENTITY_CHANGE))
export function useIdentity(){
 const auth=useAuth(),[data,setData]=useState<Identity|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(false),[attempt,setAttempt]=useState(0)
 useEffect(()=>{const refresh=()=>setAttempt(n=>n+1);window.addEventListener(IDENTITY_CHANGE,refresh);return()=>window.removeEventListener(IDENTITY_CHANGE,refresh)},[])
 useEffect(()=>{
  setData(null);setError(false);if(!auth.client||!auth.user){setLoading(false);return}
  const client=auth.client,abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);let current=true;setLoading(true)
  void(async()=>{try{const r=await client.rpc('danz_identity_status').abortSignal(abort.signal);if(r.error||!r.data)throw Error();const next=parseIdentity(r.data);if(current)setData(next)}catch{if(current)setError(true)}finally{clearTimeout(timer);if(current)setLoading(false)}})()
  return()=>{current=false;clearTimeout(timer);abort.abort()}
 },[auth.client,auth.user?.id,attempt])
 return{data,loading,error,refresh:()=>setAttempt(n=>n+1)}
}
