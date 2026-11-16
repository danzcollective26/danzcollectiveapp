export type DollLook = {
  skin: number
  hair: number
  shirt: number
  cut: number
  tee: number
  gender: number
}

export const SKINS = ["#f6e2c8", "#f0d2b4", "#e0ac7a", "#c68642", "#8d5524"]
export const HAIRS = ["#2a241c", "#6b3a1f", "#d9a441", "#c45b7a", "#1a1a1a"]
export const SHIRTS = ["#1a1a1a", "#d9ff6b", "#e23b3b", "#3a6ea5", "#f3f0e8"]
export const CUTS = ["Corto", "Largo", "Moño"]

export const DEFAULT_LOOK: DollLook = { skin: 1, hair: 0, shirt: 0, cut: 0, tee: 0, gender: 0 }

const LOOK_KEY = "danz-idle-look-v1"

function clampIndex(value: unknown, length: number, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < length ? value : fallback
}

export function loadLook(storage: Pick<Storage, "getItem">): DollLook {
  try {
    const raw = storage.getItem(LOOK_KEY)
    if (!raw) return DEFAULT_LOOK
    const parsed = JSON.parse(raw) as Partial<DollLook>
    return {
      skin: clampIndex(parsed.skin, SKINS.length, DEFAULT_LOOK.skin),
      hair: clampIndex(parsed.hair, HAIRS.length, DEFAULT_LOOK.hair),
      shirt: clampIndex(parsed.shirt, SHIRTS.length, DEFAULT_LOOK.shirt),
      cut: clampIndex(parsed.cut, CUTS.length, DEFAULT_LOOK.cut),
      tee: clampIndex(parsed.tee, 3, DEFAULT_LOOK.tee),
      gender: parsed.gender === 1 ? 1 : 0,
    }
  } catch {
    return DEFAULT_LOOK
  }
}

export function saveLook(storage: Pick<Storage, "setItem">, look: DollLook) {
  storage.setItem(LOOK_KEY, JSON.stringify(look))
}

export const STAGE_NAME: Record<string, string[]> = {
  music: ["Puesto pelado", "Ordenador mejor y lámpara", "Cabina con micro y cascos", "Monitores y ON AIR"],
  fashion: ["Un burro", "Mesa de corte", "Escaparate"],
  video: ["Tablero vacío", "Set de cámaras", "Plató"],
  print: ["Impresora pequeña", "Con filamento", "Taller doble"],
  cocina: ["Un microondas", "Tazas", "La barra"],
  sala: ["Un sofá", "La pista", "La consola"],
}

export const STAGE_NEXT: Record<string, string[]> = {
  music: [
    "Al subir, el ordenador mejora y aparece la lámpara.",
    "Al subir, la sala queda terminada: micro puesto y cascos colgando.",
    "Al subir entran dos monitores y se enciende el ON AIR.",
    "",
  ],
  fashion: ["Al subir entra la mesa de corte y más ropa.", "Al subir monta el escaparate.", ""],
  video: ["Al subir aparecen las cámaras.", "Al subir se enciende el plató.", ""],
  print: ["Al subir llegan las bobinas.", "Al subir se abre la segunda impresora.", ""],
  cocina: ["Al subir salen las tazas.", "Al subir entra la mesa. Y ya.", ""],
  sala: ["Al subir se enciende la pista.", "Al subir entra la consola. Y ya.", ""],
}

export function stageIndex(level: number) {
  if (level >= 4) return 3
  if (level >= 3) return 2
  if (level >= 2) return 1
  return 0
}
