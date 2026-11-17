import type { Upgrade } from '../types.ts'

/**
 * Mejoras de entre noches. Se pagan con dinero de puerta.
 * `cooldown`, `cost`, `fallo` y `enfado` restan; `precision` y `cacheo` suman.
 */
export const UPGRADES: readonly Upgrade[] = [
  {
    id: 'linterna',
    name: 'Linterna de puerta',
    blurb: 'El bolsillo se ve antes. El escáner afina.',
    cost: 30,
    minReputation: 0,
    requiresId: null,
    effects: [{ kind: 'precision', amount: 0.12 }],
  },
  {
    id: 'mano-rapida',
    name: 'Mano rápida',
    blurb: 'El escáner vuelve antes. Sigue costando puntos.',
    cost: 55,
    minReputation: 8,
    requiresId: 'linterna',
    effects: [{ kind: 'cooldown', amount: 2000 }],
  },
  {
    id: 'cacheo-fino',
    name: 'Cacheo fino',
    blurb: 'La ventana del cacheo se alarga un poco. Sigue siendo un gesto corto.',
    cost: 70,
    minReputation: 12,
    requiresId: null,
    effects: [{ kind: 'cacheo', amount: 250 }],
  },
  {
    id: 'ojo-clinico',
    name: 'Ojo clínico',
    blurb: 'Menos fallos y menos gente enfadada cuando miras de más.',
    cost: 110,
    minReputation: 20,
    requiresId: 'mano-rapida',
    effects: [
      { kind: 'precision', amount: 0.15 },
      { kind: 'fallo', amount: 0.1 },
      { kind: 'enfado', amount: 0.08 },
      { kind: 'cost', amount: 3 },
    ],
  },
]
