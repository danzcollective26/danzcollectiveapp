import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import type { Game, GameMode } from '../snake'
import type { Json } from '../types/database'
export type CompetitionRun={id:string;owner:string;status:'active'|'saving'|'saved'|'error'|'expired';expiresAt:string;score?:number}
export const valueObject=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
export function useSnakeCompetition(game:Game,onStart:(mode:GameMode,seed:number)=>void,onPause:()=>void){
 const auth=useAuth(),[run,setRun]=useState<CompetitionRun|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[revision,setRevision]=useState(0),[alias,setAlias]=useState('')
 const generation=useRef(0),current=useRef<CompetitionRun|null>(null),action=useRef<AbortController|null>(null),pending=useRef<{id:string;mode:GameMode;alias:string}|null>(null),alive=useRef(true)
 function update(next:CompetitionRun|null){current.current=next;setRun(next)}
 function clear(){generation.current++;action.current?.abort();action.current=null;pending.current=null;update(null);setBusy(false);setMessage('')}
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;action.current?.abort()}},[])
 useEffect(()=>{clear();setAlias(auth.user?`DANZER-${auth.user.id.slice(0,4).toUpperCase()}`:'');if(game.seed!==undefined)onPause()},[auth.user?.id])
 async function start(mode:GameMode){
  if(!auth.client||!auth.user||action.current)return
  onPause();const client=auth.client,owner=auth.user.id,version=++generation.current,abort=new AbortController();action.current=abort;setBusy(true);setMessage('Preparando tu partida de competición…')
  if(!pending.current||pending.current.mode!==mode||pending.current.alias!==alias.trim())pending.current={id:crypto.randomUUID(),mode,alias:alias.trim()}
  const request=pending.current,timer=setTimeout(()=>abort.abort(),10000)
  try{
   const r=await client.rpc('danz_snake_start',{p_id:request.id,p_mode:request.mode,p_alias:request.alias}).abortSignal(abort.signal),v=valueObject(r.data)
   if(r.error)throw r.error
   if(v.id!==request.id||!Number.isSafeInteger(v.seed)||Number(v.seed)<1||Number(v.seed)>2147483646||v.mode!==mode||typeof v.expiresAt!=='string'||!Number.isFinite(Date.parse(v.expiresAt)))throw Error('Invalid challenge')
   if(!alive.current||version!==generation.current)return
   pending.current=null;update({id:request.id,owner,status:'active',expiresAt:v.expiresAt});setMessage('Partida de competición. Tu resultado se guardará al terminar.');onStart(mode,Number(v.seed))
  }catch(e){if(alive.current&&version===generation.current)setMessage(valueObject(e).code==='54000'?'Has alcanzado el límite de 60 partidas por hora. Vuelve más tarde.':'No se ha podido preparar la partida. Comprueba tu conexión y reinténtalo.')}
  finally{clearTimeout(timer);if(action.current===abort)action.current=null;if(alive.current&&version===generation.current)setBusy(false)}
 }
 async function save(){
  const ticket=current.current
  if(!ticket||!auth.client||ticket.owner!==auth.user?.id||action.current||!game.replay||['saved','expired'].includes(ticket.status))return
  onPause();const version=generation.current,abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);action.current=abort;update({...ticket,status:'saving'});setMessage('Comprobando y guardando tu puntuación…')
  try{
   const r=await auth.client.rpc('danz_snake_submit',{p_id:ticket.id,p_moves:game.replay}).abortSignal(abort.signal),v=valueObject(r.data)
   if(r.error)throw r.error
   if(v.saved!==true||!Number.isSafeInteger(v.score)||Number(v.score)!==game.score)throw Error('Invalid result')
   if(alive.current&&version===generation.current){update({...ticket,status:'saved',score:Number(v.score)});setMessage(Number(v.score)>0?`${v.score} puntos guardados en tu clasificación. Los DANZPOINTS se conceden al cierre semanal.`:'Partida guardada. Recoge alguna cara para entrar en la clasificación.');setRevision(n=>n+1)}
  }catch(e){if(alive.current&&version===generation.current){const expired=valueObject(e).code==='55000';update({...ticket,status:expired?'expired':'error'});setMessage(expired?'La partida ha caducado. Empieza otra para competir.':'No se pudo guardar el resultado. Puedes reintentar antes de que caduque la partida.')}}
  finally{clearTimeout(timer);if(action.current===abort)action.current=null}
 }
 useEffect(()=>{if(game.over&&run?.status==='active')void save()},[game.over,run?.id,run?.status])
 useEffect(()=>{
  if(!run||!['active','error'].includes(run.status))return
  const timer=setTimeout(()=>{if(current.current?.id===run.id&&current.current.status!=='saved'){onPause();update({...run,status:'expired'});setMessage('La partida ha caducado. Empieza otra para competir.')}},Math.max(0,Date.parse(run.expiresAt)-Date.now()))
  return()=>clearTimeout(timer)
 },[run?.id,run?.status])
 return{run:run?.owner===auth.user?.id?run:null,busy,message,revision,alias,setAlias,start,save,clear,registered:Boolean(auth.user),loading:auth.loading,client:auth.client,userId:auth.user?.id??null}
}
export type SnakeCompetitionController=ReturnType<typeof useSnakeCompetition>
export function boardResponse(value:Json){
 const v=valueObject(value)
 const row=(raw:unknown)=>{const r=valueObject(raw);if(!Number.isSafeInteger(r.rank)||Number(r.rank)<1||typeof r.alias!=='string'||r.alias.length>24||!Number.isSafeInteger(r.score)||Number(r.score)<=0||!Number.isSafeInteger(r.stage)||typeof r.mine!=='boolean')throw Error('Invalid ranking');return{rank:Number(r.rank),alias:r.alias,score:Number(r.score),stage:Number(r.stage),mine:r.mine}}
 if(!Array.isArray(v.rows)||v.rows.length>20||typeof v.closesAt!=='string'||!Number.isFinite(Date.parse(v.closesAt))||!Array.isArray(v.awards))throw Error('Invalid board')
 return{rows:v.rows.map(row),mine:v.mine===null?null:row(v.mine),closesAt:v.closesAt,awards:v.awards.map(raw=>{const a=valueObject(raw);if(typeof a.week!=='string'||typeof a.alias!=='string'||!Number.isSafeInteger(a.score)||![0,50].includes(Number(a.points))||!['awarded','streak-limit','year-limit'].includes(String(a.reason)))throw Error('Invalid award');return{week:a.week,alias:a.alias,points:Number(a.points),reason:String(a.reason)}})}
}
