export type CollectaControlKind = 'arrows' | 'joystick'
export type CollectaControls = [CollectaControlKind, CollectaControlKind]
export const COLLECTA_CONTROLS_KEY = 'danz-collecta-controls-v1'
export const DEFAULT_COLLECTA_CONTROLS: CollectaControls = ['arrows', 'arrows']
export function parseCollectaControls(raw: string | null): CollectaControls {
  try {
    const data = JSON.parse(raw ?? 'null')
    if (!Array.isArray(data) || data.length !== 2) return ['arrows', 'arrows']
    return data.map(value => value === 'joystick' ? 'joystick' : 'arrows') as CollectaControls
  } catch { return ['arrows', 'arrows'] }
}
export function readCollectaControls(): CollectaControls {
  try { return parseCollectaControls(localStorage.getItem(COLLECTA_CONTROLS_KEY)) } catch { return ['arrows', 'arrows'] }
}
export function saveCollectaControls(value: CollectaControls) {
  try { localStorage.setItem(COLLECTA_CONTROLS_KEY, JSON.stringify(value)) } catch { /* This page still keeps the selected controls in memory. */ }
}
