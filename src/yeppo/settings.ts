export const YEPPO_PREFERENCE_EVENT='danz-yeppo-preference'
const KEY='danz-yeppo-enabled-v1'
const SILENCE='danz-yeppo-silent-until-v1'
export function readYeppoEnabled():boolean{try{return localStorage.getItem(KEY)!=='false'}catch{return true}}
export function setYeppoEnabled(enabled:boolean){try{localStorage.setItem(KEY,String(enabled))}catch{/* Storage optional. */}window.dispatchEvent(new Event(YEPPO_PREFERENCE_EVENT))}
export function readYeppoSilencedUntil():number{try{return Number(localStorage.getItem(SILENCE))||0}catch{return 0}}
export function silenceYeppoForOneHour(){try{localStorage.setItem(SILENCE,String(Date.now()+60*60*1000))}catch{}window.dispatchEvent(new Event(YEPPO_PREFERENCE_EVENT))}
