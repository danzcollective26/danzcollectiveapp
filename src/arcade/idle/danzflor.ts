/** Instantánea pública de Tracks & Cocktails. La tienda manda si responde. */
export type FlorPiece = {
  handle: string
  title: string
  priceCents: number
  available: boolean
  href: string
}

const STORE = "https://danzcollective.com"

export const DANZFLOR: FlorPiece[] = [
  { handle: "club-house-tee", title: "Club House Tee", priceCents: 3800, available: true, href: `${STORE}/products/club-house-tee` },
  { handle: "disco-culture-tee", title: "Disco Culture Tee", priceCents: 3800, available: true, href: `${STORE}/products/disco-culture-tee` },
  { handle: "tracks-cocktails-tee", title: "Tracks & Cocktails Tee", priceCents: 3800, available: true, href: `${STORE}/products/tracks-cocktails-tee` },
  { handle: "yepo-bag", title: "Yepo Bag", priceCents: 1400, available: false, href: `${STORE}/products/yepo-bag` },
  { handle: "swim-short", title: "YEPO SWIM SHORT", priceCents: 4000, available: true, href: `${STORE}/products/swim-short` },
]

export function florByTitle(pieces: FlorPiece[], title: string): FlorPiece | null {
  return pieces.find((piece) => piece.title === title) ?? null
}

export function euros(cents: number): string {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100)
}

export function readFlorProduct(raw: unknown, expected: FlorPiece): FlorPiece | null {
  if (!raw || typeof raw !== "object") return null
  const item = raw as { title?: unknown; handle?: unknown; price?: unknown; available?: unknown }
  if (item.title !== expected.title || item.handle !== expected.handle) return null
  if (typeof item.price !== "number" || !Number.isSafeInteger(item.price) || item.price < 0 || item.price > 100_000) return null
  if (typeof item.available !== "boolean") return null
  return { ...expected, priceCents: item.price, available: item.available }
}

export async function refreshDanzFlor(fetchImpl: typeof fetch = fetch): Promise<FlorPiece[] | null> {
  const next = await Promise.all(
    DANZFLOR.map(async (piece) => {
      try {
        const response = await fetchImpl(`${piece.href}.js`, { headers: { accept: "application/json" } })
        if (!response.ok) return piece
        return readFlorProduct(await response.json(), piece) ?? piece
      } catch {
        return null
      }
    }),
  )
  if (next.some((piece) => piece === null)) return null
  return next as FlorPiece[]
}
