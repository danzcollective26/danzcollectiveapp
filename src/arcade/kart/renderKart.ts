import type { Race } from './engine'
import type { KartPreferences } from './preferences'
import { effectiveCamera } from './camera'

/** Load only the chosen renderer; old 2D presentation remains a compatible fallback. */
export function createKartRenderer(parent:HTMLElement,read:()=>Race,advance:(dt:number)=>void,ready:()=>void,options:()=>KartPreferences){
  let disposed=false,fallback=false,generation=0,compatibleView='',delegate:{wake:(reset?:boolean)=>void;destroy:()=>void}|null=null
  const requestedView=()=>effectiveCamera(options().camera,read().mode)==='cockpit'?'cockpit':'track'
  async function compatible(){
    if(disposed)return;fallback=true;const view=requestedView();if(compatibleView===view)return;compatibleView=view
    const ticket=++generation;delegate?.destroy();delegate=null
    try{const m=view==='cockpit'?await import('./cockpit2d'):await import('./renderer');if(disposed||ticket!==generation)return
    parent.querySelectorAll('canvas').forEach(canvas=>canvas.remove())
    parent.dataset.renderMode='2d';delegate='createCockpitRenderer' in m?m.createCockpitRenderer(parent,read,advance,ready,options):m.createKartRenderer(parent,read,advance,ready,options)}catch{if(!disposed&&ticket===generation){compatibleView='';parent.dataset.renderMode='unavailable'}}
  }
  if(options().quality==='flat')void compatible()
  else void import('./renderer3d').then(m=>{if(disposed)return;try{delegate=m.createPremiumKartRenderer(parent,read,advance,ready,options,()=>void compatible())}catch{void compatible()}}).catch(()=>void compatible())
  return {wake(reset=false){if(fallback&&compatibleView!==requestedView())void compatible();else delegate?.wake(reset)},destroy(){disposed=true;generation++;delegate?.destroy();delegate=null}}
}
