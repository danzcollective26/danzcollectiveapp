const KEY = 'danz-seis-progress-v1'

export const SEIS_BACKS = [
  { id: 'clasico', name: 'CLÁSICO', wins: 0 },
  { id: 'lima', name: 'LIMA', wins: 1 },
  { id: 'rosa', name: 'ROSA', wins: 3 },
  { id: 'violeta', name: 'VIOLETA', wins: 7 },
] as const

export type SeisProgress = { wins: number; streak: number; best: number; perfect: number; back: string }

const empty = (): SeisProgress => ({ wins: 0, streak: 0, best: 0, perfect: 0, back: 'clasico' })

export function readSeisProgress(): SeisProgress {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '') as Partial<SeisProgress>
    const back = SEIS_BACKS.some(item => item.id === saved.back) ? String(saved.back) : 'clasico'
    return {
      wins: positive(saved.wins),
      streak: positive(saved.streak),
      best: positive(saved.best),
      perfect: positive(saved.perfect),
      back,
    }
  } catch {
    return empty()
  }
}

export function unlockedBacks(progress: SeisProgress) {
  return SEIS_BACKS.filter(item => progress.wins >= item.wins)
}

export function recordSeisResult(won: boolean, perfect: boolean) {
  const current = readSeisProgress()
  const next: SeisProgress = won
    ? { ...current, wins: current.wins + 1, streak: current.streak + 1, best: Math.max(current.best, current.streak + 1), perfect: current.perfect + (perfect ? 1 : 0) }
    : { ...current, streak: 0 }
  if (!unlockedBacks(next).some(item => item.id === next.back)) next.back = 'clasico'
  write(next)
  return next
}

export function chooseSeisBack(id: string) {
  const current = readSeisProgress()
  const next = unlockedBacks(current).some(item => item.id === id) ? { ...current, back: id } : current
  write(next)
  return next
}

function positive(value: unknown) {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0
}
function write(progress: SeisProgress) {
  try { localStorage.setItem(KEY, JSON.stringify(progress)) } catch { /* El marcador local es opcional. */ }
}
