import type {ReactElement} from 'react'
// Proposed integration boundary. Progress reports are informational, not currency.
export type DanzProgressEvent =
 | {schemaVersion:1;gameId:'idle-studio';milestone:'first-upgrade'|'fashion-unlocked'}
 | {schemaVersion:1;gameId:'groove-ninja';milestone:'first-perfect-phrase'|'track-completed'}
export type DanzGameProps={
 onExit:()=>void
 storageKey?:string
 onProgress?:(event:DanzProgressEvent)=>void
}
export type DanzGameComponent=(props:DanzGameProps)=>ReactElement
// Contract requirements: no Auth/admin/database keys, no direct DANZPOINTS awards;
// host supplies identity/navigation. Pause and release sound/timers/listeners on exit.
// Validate and version local saves; use a per-game namespace and safe defaults.
