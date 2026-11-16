import { useEffect, useState } from 'react'
import { haptic } from './haptics.ts'
const PREFIX = 'danz-photo-favorites-v1:'
const validIds = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id)))].slice(0,500) : []
export function readFavorites(scope: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PREFIX + scope) ?? '[]')
    return validIds(value)
  } catch { return [] }
}
export function writeFavorites(scope: string, ids: string[]) {
  try { localStorage.setItem(PREFIX + scope, JSON.stringify(validIds(ids))); return true } catch { return false }
}
/** Only identifiers persist; originals, signed URLs and names never enter this store. */
export function usePhotoFavorites(scope: string) {
  const [state, setState] = useState(() => ({ scope, ids: readFavorites(scope), persisted: true }))
  const ids = state.scope === scope ? state.ids : readFavorites(scope)
  useEffect(() => {
    setState({ scope, ids: readFavorites(scope), persisted: true })
    const refresh = (event: StorageEvent) => { if (!event.key || event.key === PREFIX + scope) setState({ scope, ids: readFavorites(scope), persisted: true }) }
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [scope])
  return { ids, persisted: state.scope !== scope || state.persisted, toggle(id: string) {
    const next = ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id].slice(-500)
    const persisted = writeFavorites(scope, next)
    setState({ scope, ids: next, persisted }); haptic('tap')
  } }
}
