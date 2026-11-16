export const LEVELS_PER_PRODUCT = 20
export const LEVELS_PER_OPERATOR = 30
export const SHELF_LIMIT = 30
export const PACK_SIZE = 4

/** Solo estos puestos dejan producto en el estante. El resto se mejora, no fabrica. */
export const PRODUCERS = new Set(["music", "fashion", "video", "print", "sello"])

export type ProductTier = 1 | 2 | 3

export type Good = {
  stationId: string
  tier: ProductTier
  name: string
}

const NAMES: Record<string, [string, string, string]> = {
  music: ["USB", "Vinilo", "Vinilo de platino"],
  fashion: ["Parche", "Camiseta", "Prenda"],
  video: ["Clip", "Vídeo", "Campaña"],
  print: ["Mechero sin llama", "Papel ya escrito", "Trofeo al casi"],
  cocina: ["Taza", "Lote", "Catering"],
  sala: ["Pase", "Sesión", "Noche"],
  sello: ["Single", "EP", "Disco"],
  seguridad: ["Pase", "Ronda", "Cierre"],
}

const FASHION_RUN: Array<{ until: number; name: string }> = [
  { until: 12, name: "Club House Tee" },
  { until: 24, name: "Disco Culture Tee" },
  { until: 36, name: "Tracks & Cocktails Tee" },
  { until: 48, name: "Yepo Bag" },
  { until: 60, name: "YEPO SWIM SHORT" },
]

const PRINT_RUN: Array<{ until: number; name: string }> = [
  { until: 12, name: "Mechero sin llama" },
  { until: 24, name: "Papel que ya viene doblado" },
  { until: 36, name: "Figura del perro del vecino" },
  { until: 48, name: "Prototipo de encargo" },
  { until: 60, name: "Trofeo al segundo puesto" },
]

export function printProduct(level: number) {
  return PRINT_RUN.find((item) => level <= item.until)?.name ?? "Trofeo al segundo puesto"
}

export function fashionProduct(level: number) {
  return FASHION_RUN.find((item) => level <= item.until)?.name ?? "YEPO SWIM SHORT"
}

export function productTier(level: number): ProductTier {
  if (level >= 41) return 3
  if (level >= 21) return 2
  return 1
}

export function productName(stationId: string, level: number): string {
  if (stationId === "fashion") return fashionProduct(level)
  if (stationId === "print") return printProduct(level)
  const names = NAMES[stationId]
  if (!names) return "Paquete"
  return names[productTier(level) - 1]!
}

export function productValue(tier: ProductTier): number {
  if (tier === 3) return 32
  if (tier === 2) return 14
  return 5
}

export function shelfValue(goods: Good[]): number {
  return goods.reduce((sum, good) => sum + productValue(good.tier), 0)
}

export type OperatorRole = "craft" | "pack"

export type OperatorDef = {
  name: string
  stationId: string
  role: OperatorRole
  at: number
  post: "main" | "side"
}

/** Al 30 se queda en tu mesa. Al 60 abre el segundo puesto. */
export const OPERATOR_ROSTER: OperatorDef[] = [
  { name: "Luitzmi", stationId: "music", role: "craft", at: 30, post: "main" },
  { name: "Chicharro", stationId: "music", role: "craft", at: 60, post: "side" },
  { name: "Roncero", stationId: "fashion", role: "craft", at: 30, post: "main" },
  { name: "Juanfran", stationId: "fashion", role: "craft", at: 60, post: "side" },
  { name: "Cosa", stationId: "video", role: "craft", at: 30, post: "main" },
  { name: "Alpi", stationId: "video", role: "craft", at: 60, post: "side" },
  { name: "Mike", stationId: "print", role: "craft", at: 30, post: "main" },
  { name: "Jokano", stationId: "print", role: "craft", at: 60, post: "side" },
  { name: "León", stationId: "sello", role: "craft", at: 30, post: "main" },
  { name: "Tomy", stationId: "sello", role: "craft", at: 60, post: "side" },
]

export function unlockedOperators(levels: Record<string, { unlocked?: boolean; level: number } | undefined>): OperatorDef[] {
  return OPERATOR_ROSTER.filter((operator) => {
    const progress = levels[operator.stationId]
    const level = progress?.unlocked ? (progress.level ?? 0) : 0
    return level >= operator.at
  })
}
