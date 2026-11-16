import { useEffect, useState } from 'react'
import { FAVORITES_EVENT, readFavorites, toggleFavorite } from './favorites'

export function useFavorites() {
  const [ids, setIds] = useState<string[]>(() => readFavorites())
  useEffect(() => {
    const refresh = () => setIds(readFavorites())
    window.addEventListener(FAVORITES_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(FAVORITES_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return {
    has: (key: string) => ids.includes(key),
    toggle: (key: string) => toggleFavorite(key),
  }
}
