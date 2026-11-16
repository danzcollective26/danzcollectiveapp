import type { Race } from './engine'
import type { KartPreferences } from './preferences'

/** Load only the chosen renderer; old 2D presentation remains a compatible fallback. */
export function createKartRenderer(parent:HTMLElement,read:()=>Race,advance:(dt:number)=>void,ready:()=>void,options:()=>KartPreferences){
  let disposed=false,fallback=false,delegate:{wake:(reset?:boolean)=>void;destroy:()=>void}|null=null
  async function compatible(){
    if(disposed||fallback)return;fallback=true;delegate?.destroy();delegate=null
    try{const m=await import('./renderer');if(disposed)return
    parent.querySelectorAll('canvas').forEach(canvas=>canvas.remove())
    parent.dataset.renderMode='2d';delegate=m.createKartRenderer(parent,read,advance,ready,options)}catch{if(!disposed)parent.dataset.renderMode='unavailable'}
  }
  if(options().quality==='flat')void compatible()
  else void import('./renderer3d').then(m=>{if(disposed)return;try{delegate=m.createPremiumKartRenderer(parent,read,advance,ready,options,()=>void compatible())}catch{void compatible()}}).catch(()=>void compatible())
  return {wake(reset=false){delegate?.wake(reset)},destroy(){disposed=true;delegate?.destroy();delegate=null}}
}
