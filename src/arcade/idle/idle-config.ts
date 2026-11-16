/** Valores de economía provisionales. No son decisiones cerradas del colectivo. */

export type UnlockRule = { type: "level"; stationId: string; level: number }

export type StationConfig = {
  id: string
  name: string
  kicker: string
  summary: string
  playable: boolean
  startsUnlocked: boolean
  maxLevel: number
  /** Coste de pasar del nivel L al L+1: baseCost × L. Crece en cada nivel. */
  baseCost: number
  payout: number
  payoutPerLevel: number
  durationMs: number
  durationCutMs: number
  unlock: UnlockRule[]
  x: number
  y: number
  job: { id: string; verb: string }
}

export type IdleConfig = {
  schemaVersion: 1
  currency: { id: string; name: string; disclaimer: string }
  hiddenProduction: "paused"
  minimumJobMs: number
  stations: StationConfig[]
}

export const IDLE_CONFIG: IdleConfig = {
  schemaVersion: 1,
  currency: {
    id: "loops",
    name: "Loops",
    disclaimer: "Moneda ficticia de prototipo. Sin valor real y sin canje.",
  },
  hiddenProduction: "paused",
  minimumJobMs: 1400,
  stations: [
    // Más adelante: quizá quitar alguna sala grande y meter salas cortas
    // (pocos niveles), como seguridad. Cocina ya está entre las siete.
    // Al cerrar Vídeo, enseñar el catálogo de Música y el de Moda por si hay que cambiar piezas.
    {
      id: "music",
      name: "Música",
      kicker: "Mesa de grabación",
      summary: "Graba una toma. Luitzmi jura que esta sí vale.",
      playable: true,
      startsUnlocked: true,
      maxLevel: 60,
      baseCost: 18,
      payout: 8,
      payoutPerLevel: 4,
      durationMs: 5200,
      durationCutMs: 200,
      unlock: [],
      x: 454,
      y: 700,
      job: { id: "take", verb: "Grabar" },
    },
    {
      id: "fashion",
      name: "Moda",
      kicker: "Mesa de corte",
      summary: "Corta una prenda antes de que el burro opine.",
      playable: true,
      startsUnlocked: false,
      maxLevel: 60,
      baseCost: 14,
      payout: 12,
      payoutPerLevel: 5,
      durationMs: 4200,
      durationCutMs: 200,
      unlock: [{ type: "level", stationId: "music", level: 8 }],
      x: 200,
      y: 520,
      job: { id: "pattern", verb: "Cortar" },
    },
    {
      id: "video",
      name: "Vídeo",
      kicker: "Cabina",
      summary: "Cierra un clip, un vídeo o una campaña. Cosa ya está en el boceto.",
      playable: true,
      startsUnlocked: false,
      maxLevel: 60,
      baseCost: 20,
      payout: 16,
      payoutPerLevel: 6,
      durationMs: 4800,
      durationCutMs: 200,
      unlock: [{ type: "level", stationId: "fashion", level: 8 }],
      x: 1180,
      y: 520,
      job: { id: "cut", verb: "Diseñar" },
    },
    {
      id: "print",
      name: "Los Primos",
      kicker: "Impresión 3D",
      summary: "Los Primos Brothers venden lo que salga de la impresora. Y también lo que no.",
      playable: true,
      startsUnlocked: false,
      maxLevel: 60,
      baseCost: 26,
      payout: 20,
      payoutPerLevel: 7,
      durationMs: 5200,
      durationCutMs: 200,
      unlock: [{ type: "level", stationId: "video", level: 8 }],
      x: 760,
      y: 340,
      job: { id: "print", verb: "Vender" },
    },
    {
      id: "sello",
      name: "Sello",
      kicker: "Discográfica",
      summary: "Sesenta niveles. Single, EP y disco. León se queda. Tomy abre el segundo puesto.",
      playable: true,
      startsUnlocked: false,
      maxLevel: 60,
      baseCost: 32,
      payout: 24,
      payoutPerLevel: 8,
      durationMs: 5400,
      durationCutMs: 200,
      unlock: [{ type: "level", stationId: "print", level: 8 }],
      x: 520,
      y: 860,
      job: { id: "sign", verb: "Firmar" },
    },
    {
      id: "seguridad",
      name: "Seguridad",
      kicker: "Puerta",
      summary: "La rata entra desde el principio. Mono se contrata al 12 de Música y ronda el estudio. El equipo se compra.",
      playable: true,
      startsUnlocked: false,
      maxLevel: 6,
      baseCost: 10,
      payout: 4,
      payoutPerLevel: 1,
      durationMs: 4800,
      durationCutMs: 60,
      unlock: [{ type: "level", stationId: "music", level: 12 }],
      x: 640,
      y: 420,
      job: { id: "watch", verb: "Rondar" },
    },
    {
      id: "cocina",
      name: "Cocina",
      kicker: "Office",
      summary: "Un rincón. Ocho niveles y una taza. Pepe dice que con eso basta.",
      playable: true,
      startsUnlocked: false,
      maxLevel: 8,
      baseCost: 8,
      payout: 4,
      payoutPerLevel: 1,
      durationMs: 5000,
      durationCutMs: 80,
      unlock: [{ type: "level", stationId: "music", level: 6 }],
      x: 1280,
      y: 1000,
      job: { id: "heat", verb: "Calentar" },
    },
    {
      id: "sala",
      name: "Sala",
      kicker: "Rincón",
      summary: "Diez niveles. Un sofá, una pista y una consola. Vero dice que con eso se puede invitar a alguien.",
      playable: true,
      startsUnlocked: false,
      maxLevel: 10,
      baseCost: 8,
      payout: 4,
      payoutPerLevel: 1,
      durationMs: 5000,
      durationCutMs: 80,
      unlock: [{ type: "level", stationId: "cocina", level: 4 }],
      x: 240,
      y: 250,
      job: { id: "glow", verb: "Ambiente" },
    },
    {
      id: "envios",
      name: "Envíos",
      kicker: "Logística",
      summary: "El estante está en Música, junto a la puerta. Empaqueta lo fabricado y lo cambia por Loops.",
      playable: true,
      startsUnlocked: true,
      maxLevel: 60,
      baseCost: 20,
      payout: 0,
      payoutPerLevel: 0,
      durationMs: 4000,
      durationCutMs: 80,
      unlock: [],
      x: 960,
      y: 1100,
      job: { id: "pack", verb: "Empaquetar" },
    },
  ],
}

export function stationById(config: IdleConfig, id: string): StationConfig | undefined {
  return config.stations.find((station) => station.id === id)
}
