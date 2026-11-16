import { IDLE_CONFIG, stationById, type IdleConfig } from "./idle-config.ts"
import type { Good } from "./products.ts"

export type StudioOrder = {
  id: string
  title: string
  stationId: string
  product: string
  count: number
  reward: number
}

/** Encargos del estudio. El extra se avisa a la app y no se canjea aquí. */
export const STUDIO_ORDERS: StudioOrder[] = [
  { id: "maqueta", title: "Maqueta para el sello", stationId: "music", product: "USB", count: 4, reward: 12 },
  { id: "club", title: "Club House para el escaparate", stationId: "fashion", product: "Club House Tee", count: 4, reward: 20 },
  { id: "clip", title: "Clip para el viernes", stationId: "video", product: "Clip", count: 4, reward: 24 },
  { id: "mechero", title: "Mecheros para la puerta", stationId: "print", product: "Mechero sin llama", count: 4, reward: 24 },
  { id: "single", title: "Single del sello", stationId: "sello", product: "Single", count: 4, reward: 32 },
]

type StationSlice = Record<string, { unlocked?: boolean } | undefined>

export function currentOrder(stations: StationSlice, done: string[] | undefined, config: IdleConfig = IDLE_CONFIG): StudioOrder | null {
  const closed = new Set(done ?? [])
  return (
    STUDIO_ORDERS.find((order) => {
      if (closed.has(order.id)) return false
      const station = stationById(config, order.stationId)
      return Boolean(station && stations[order.stationId]?.unlocked)
    }) ?? null
  )
}

export function orderBonus(stations: StationSlice, done: string[] | undefined, shipped: Good[]): { id: string; reward: number; title: string } | null {
  const order = currentOrder(stations, done)
  if (!order) return null
  const matching = shipped.filter((good) => good.stationId === order.stationId && good.name === order.product).length
  if (matching < order.count) return null
  return { id: order.id, reward: order.reward, title: order.title }
}
