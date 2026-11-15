export type KartQuality = 'auto' | 'lite' | 'high' | 'flat'
export type KartCamera = 'follow' | 'track'
export type KartPreferences = { quality:KartQuality; camera:KartCamera; sound:boolean; livery:number }
export const KART_PREFERENCES_KEY='danz-kart-preferences-v2'
export const KART_LIVERIES=[{name:'LIMA CLUB',color:'#d9fa69'},{name:'CREW ROSÉ',color:'#f595b7'},{name:'PETROL RUN',color:'#82dadd'},{name:'COPPER RS',color:'#edb56f'}] as const
export const DEFAULT_KART_PREFERENCES:KartPreferences={quality:'auto',camera:'follow',sound:true,livery:0}
export function readKartPreferences():KartPreferences{
  try{const v=JSON.parse(localStorage.getItem(KART_PREFERENCES_KEY)??'null');return {
    quality:['auto','lite','high','flat'].includes(v?.quality)?v.quality:'auto',
    camera:['follow','track'].includes(v?.camera)?v.camera:'follow',
    sound:typeof v?.sound==='boolean'?v.sound:true,
    livery:Number.isInteger(v?.livery)&&v.livery>=0&&v.livery<4?v.livery:0,
  }}catch{return {...DEFAULT_KART_PREFERENCES}}
}
export function saveKartPreferences(v:KartPreferences){try{localStorage.setItem(KART_PREFERENCES_KEY,JSON.stringify(v))}catch{/* Preferences remain usable for this session. */}}
