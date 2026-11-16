export const ARCADE_INTRO_GAMES = ['groove', 'snake', 'collecta', 'danzporter'] as const
export type ArcadeIntroId = typeof ARCADE_INTRO_GAMES[number]

export type ArcadeIntroMedia = {
  src: string
  poster: string
  title: string
}

/** Public URLs only. The files stay out of the JS bundle and the offline shell. */
const MEDIA: Partial<Record<ArcadeIntroId, ArcadeIntroMedia>> = {
  groove: {
    src: '/arcade/intros/intro-grooveninja.mp4',
    poster: '/arcade/intros/intro-grooveninja-poster.webp',
    title: 'GROOVE NINJA',
  },
}

export function arcadeIntroMedia(id: ArcadeIntroId): ArcadeIntroMedia | null {
  return MEDIA[id] ?? null
}

export function arcadeIntroSeenKey(id: ArcadeIntroId): string {
  return `danz-arcade-intro-seen:${id}`
}

export function browserSession(): Storage | null {
  try { return sessionStorage } catch { return null }
}

export function readArcadeIntroSeen(id: ArcadeIntroId, storage: Pick<Storage, 'getItem'> | null): boolean {
  try { return storage?.getItem(arcadeIntroSeenKey(id)) === '1' } catch { return false }
}

export function rememberArcadeIntro(id: ArcadeIntroId, storage: Pick<Storage, 'setItem'> | null) {
  try { storage?.setItem(arcadeIntroSeenKey(id), '1') } catch { /* Private mode can reject session storage. */ }
}

/** Games without a film, a session that already watched it, or reduced motion go straight in. */
export function shouldPlayArcadeIntro(id: ArcadeIntroId, seen: boolean, reducedMotion: boolean): boolean {
  return arcadeIntroMedia(id) !== null && !seen && !reducedMotion
}
