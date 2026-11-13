import {yeppoMessage,type YeppoCategory,type YeppoVariables} from './messages.ts'
export type YeppoEvent={kind:YeppoCategory;variables?:YeppoVariables;verified?:boolean}
export type YeppoLedger={day:string;count:number;lastAt:number;dismissals:number;suppressedUntil:number}
const KEY='danz-yeppo-ledger-v1'
export const MIN_GAP_MS=8*60*1000
export const MAX_GAP_MS=12*60*1000
export const DAILY_MAX=5
export const messageHasFacts=(kind:YeppoCategory)=>['fotos','racha','aviso','fiesta'].includes(kind)
const dayKey=(now:number)=>new Date(now).toLocaleDateString('sv-SE')
export function readLedger(now=Date.now()):YeppoLedger{
 let value:Partial<YeppoLedger>={}
 try{value=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
 return{day:dayKey(now),count:value.day===dayKey(now)?Math.max(0,Number(value.count)||0):0,lastAt:Number(value.lastAt)||0,dismissals:Math.max(0,Number(value.dismissals)||0),suppressedUntil:Number(value.suppressedUntil)||0}
}
export function writeLedger(value:YeppoLedger){try{localStorage.setItem(KEY,JSON.stringify(value))}catch{}}
export function mayAppear(ledger:YeppoLedger,now:number,activeMs:number):boolean{
 if(ledger.count>=DAILY_MAX||now<ledger.suppressedUntil||activeMs<MIN_GAP_MS)return false
 const stagger=MIN_GAP_MS+(ledger.count%3)*2*60_000
 return !ledger.lastAt||now-ledger.lastAt>=Math.min(MAX_GAP_MS,stagger)
}
export function dismissed(ledger:YeppoLedger,now:number):YeppoLedger{
 const dismissals=ledger.dismissals+1
 return {...ledger,dismissals,suppressedUntil:dismissals>=2?now+60*60*1000:ledger.suppressedUntil}
}
export function nextPhrase(category:YeppoCategory,variables:YeppoVariables={},seed=0):string|null{
 const lines=category==='hora'?[0,1,2,3]:[0,1,2,3,4]
 for(let i=0;i<lines.length;i++){const result=yeppoMessage(category,seed+i,variables);if(result)return result}
 return null
}
