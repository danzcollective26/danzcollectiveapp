/** Public radio files are served from a dedicated Supabase Storage bucket. */
const base=(import.meta as ImportMeta & {env:Record<string,string|undefined>}).env.VITE_SUPABASE_URL
const track=(n:number)=>base?.startsWith('https://') ? base.replace(/\/$/,'')+'/storage/v1/object/public/danz-radio/track-'+n+'.mp3' : '/music/track-'+n+'.mp3'
/** User-supplied DANZ radio edits. Audio files are deployed separately from Git. */
export type DanzTrack={id:string;title:string;artist:string;src:string;cover?:string}
export const DANZ_TRACKS:DanzTrack[]=[
 {id:'sashi',title:'Sashi Mixed',artist:'Chicharro (ES)',src:track(1)},
 {id:'bacalaik',title:'Bacalaik',artist:'LEÖN · Chicharro (ES) · TonyDawgs',src:track(2)},
 {id:'rush',title:'Rush Ön Me',artist:'LEÖN · TonyDawgs',src:track(3)},
 {id:'promiscuous',title:'Promiscuous (LEÖN, TonyDawgs edit)',artist:'Nelly Furtado feat. Timbaland',src:track(4)},
 {id:'caramelo',title:'Caramelo',artist:'Nico Fleitas · LEÖN · TonyDawgs · Chicharro (ES)',src:track(5)},
 {id:'feeling',title:'Just a Feeling (LEÖN, TonyDawgs edit)',artist:'TMB',src:track(6)},
]
