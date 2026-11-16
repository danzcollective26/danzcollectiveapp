export const FAVORITES_KEY = 'danz-photo-favorites-v1'
export const FAVORITES_EVENT = 'danz-photo-favorites'

export type FavoriteStore = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function favoriteKey(scope: 'local' | 'private', id: string) {
  return `${scope}:${id}`
}

export function readFavorites(store: FavoriteStore = localStorage): string[] {
  try {
    const raw = JSON.parse(store.getItem(FAVORITES_KEY) ?? '[]') as unknown
    return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string').slice(-200) : []
  } catch {
    return []
  }
}

export function toggleFavorite(key: string, store: FavoriteStore = localStorage) {
  const current = readFavorites(store)
  const next = current.includes(key) ? current.filter(item => item !== key) : [...current, key].slice(-200)
  try { store.setItem(FAVORITES_KEY, JSON.stringify(next)) } catch { /* Preference stays in memory for this tap. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(FAVORITES_EVENT))
  return next.includes(key)
}
