import type { ReactElement } from "react"

/** Aviso local. claim es siempre false: la app principal valida cualquier premio. */
export type IdlePlayer = {
  id: string
  name: string
}

export type IdleProgressEvent = {
  schemaVersion: 1
  gameId: "idle-studio"
  milestone: "first-upgrade" | "fashion-unlocked" | "station-maxed" | "shelf-full" | "raid-stopped" | "order-filled"
  stationId?: string
  loops?: number
  playerId?: string
  claim?: false
}

export function progressReport(
  milestone: IdleProgressEvent["milestone"],
  player?: IdlePlayer | null,
  extra?: { stationId?: string; loops?: number },
): IdleProgressEvent {
  const id = player?.id?.trim()
  return {
    schemaVersion: 1,
    gameId: "idle-studio",
    milestone,
    claim: false,
    ...(extra?.stationId ? { stationId: extra.stationId } : {}),
    ...(typeof extra?.loops === "number" ? { loops: extra.loops } : {}),
    ...(id ? { playerId: id.slice(0, 80) } : {}),
  }
}

export type DanzIdleStudioProps = {
  onExit: () => void
  /** Por defecto, danz-idle-prototype-v1. */
  storageKey?: string
  /** Quién entra desde la app. No concede premios. */
  player?: IdlePlayer | null
  /** Información local no válida para conceder premios reales. */
  onProgress?: (event: IdleProgressEvent) => void
}

export type DanzIdleStudioComponent = (props: DanzIdleStudioProps) => ReactElement

export const DEFAULT_STORAGE_KEY = "danz-idle-prototype-v1"
