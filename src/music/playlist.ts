/** User-supplied DANZ radio edits. Audio files are deployed separately from Git. */
export type DanzTrack={id:string;title:string;artist:string;src:string;cover?:string}
export const DANZ_TRACKS:DanzTrack[]=[
 {id:'sashi',title:'Sashi Mixed',artist:'Chicharro (ES)',src:'/music/track-1.mp3'},
 {id:'bacalaik',title:'Bacalaik',artist:'LEÖN · Chicharro (ES) · TonyDawgs',src:'/music/track-2.mp3'},
 {id:'rush',title:'Rush Ön Me',artist:'LEÖN · TonyDawgs',src:'/music/track-3.mp3'},
 {id:'promiscuous',title:'Promiscuous (LEÖN, TonyDawgs edit)',artist:'Nelly Furtado feat. Timbaland',src:'/music/track-4.mp3'},
 {id:'caramelo',title:'Caramelo',artist:'Nico Fleitas · LEÖN · TonyDawgs · Chicharro (ES)',src:'/music/track-5.mp3'},
 {id:'feeling',title:'Just a Feeling (LEÖN, TonyDawgs edit)',artist:'TMB',src:'/music/track-6.mp3'},
]
