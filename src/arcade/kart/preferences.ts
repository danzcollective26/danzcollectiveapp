import { DEFAULT_BUILD, VENUES, normalizeBuild, type KartBuild, type VenueId } from './garage.ts'
export type KartQuality = 'auto' | 'lite' | 'high' | 'flat'
export type KartCamera = 'follow' | 'track'
export type KartPreferences = { quality:KartQuality; camera:KartCamera; sound:boolean; livery:number;autoThrottle:boolean;builds:[KartBuild,KartBuild];venue:VenueId }
export const KART_PREFERENCES_KEY='danzporter-preferences-v3'
export const KART_LIVERIES=[{name:'LIMA CLUB',color:'#d9fa69'},{name:'CREW ROSÉ',color:'#f595b7'},{name:'PETROL RUN',color:'#82dadd'},{name:'COPPER RS',color:'#edb56f'}] as const
export const DEFAULT_KART_PREFERENCES:KartPreferences={quality:'auto',camera:'follow',sound:true,livery:0,autoThrottle:false,venue:'harbor',builds:[{...DEFAULT_BUILD},{...DEFAULT_BUILD,color:'#82dadd'}]}
export function readKartPreferences():KartPreferences{
  try{
    const current=localStorage.getItem(KART_PREFERENCES_KEY),legacy=current===null?localStorage.getItem('danz-kart-preferences-v2'):null,v=JSON.parse(current??legacy??'null')
    const livery=Number.isInteger(v?.livery)&&v.livery>=0&&v.livery<4?v.livery:0
    const first={...DEFAULT_BUILD,color:legacy?KART_LIVERIES[livery].color:DEFAULT_BUILD.color}
    return {
      quality:['auto','lite','high','flat'].includes(v?.quality)?v.quality:'auto',camera:['follow','track'].includes(v?.camera)?v.camera:'follow',
      sound:typeof v?.sound==='boolean'?v.sound:true,livery,autoThrottle:v?.autoThrottle===true,
      venue:VENUES.some(x=>x.id===v?.venue)?v.venue:'harbor',
      builds:[normalizeBuild(v?.builds?.[0],first),normalizeBuild(v?.builds?.[1],legacy?{...DEFAULT_BUILD,color:KART_LIVERIES[(livery+1)%4].color}:DEFAULT_KART_PREFERENCES.builds[1])],
    }
  }catch{return {...DEFAULT_KART_PREFERENCES,builds:[{...DEFAULT_BUILD},{...DEFAULT_KART_PREFERENCES.builds[1]}]}}
}
export function saveKartPreferences(v:KartPreferences){try{localStorage.setItem(KART_PREFERENCES_KEY,JSON.stringify(v))}catch{/* Preferences remain usable for this session. */}}
