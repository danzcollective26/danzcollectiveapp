export const GROOVE_PREFERENCES_KEY = 'danz-groove-visuals-v1'
export const CLUB_UNLOCK_CUTS = 20
export type GroovePreferences = { style: 'classic' | 'club'; effects: 'auto' | 'lite'; bestCuts: number }
export function parseGroovePreferences(raw: string | null): GroovePreferences {
  const fallback: GroovePreferences = { style: 'classic', effects: 'auto', bestCuts: 0 }
  try {
    const value = JSON.parse(raw ?? 'null')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback
    const bestCuts = Number.isSafeInteger(value.bestCuts) && value.bestCuts >= 0 && value.bestCuts <= 10000 ? value.bestCuts : 0
    return { bestCuts, style: value.style === 'club' && bestCuts >= CLUB_UNLOCK_CUTS ? 'club' : 'classic', effects: value.effects === 'lite' ? 'lite' : 'auto' }
  } catch { return fallback }
}
export function readGroovePreferences(): GroovePreferences { try { return parseGroovePreferences(localStorage.getItem(GROOVE_PREFERENCES_KEY)) } catch { return parseGroovePreferences(null) } }
