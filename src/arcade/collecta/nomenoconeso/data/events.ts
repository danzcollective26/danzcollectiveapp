import type { NightEvent } from '../types.ts'

/** Un evento por clase. spawnMsDelta negativo acelera la cola. */
export const EVENTS: readonly NightEvent[] = [
  {
    id: 'ev-avalancha',
    kind: 'avalancha',
    name: 'Avalancha de cola',
    blurb: 'Se corre la voz y la puerta se llena de golpe.',
    minNight: 4,
    effects: [
      { kind: 'cola', extraPeople: 4 },
      { kind: 'ritmo', spawnMsDelta: -1500 },
    ],
  },
  {
    id: 'ev-cortejo',
    kind: 'vvip-cortejo',
    name: 'VVIP con séquito',
    blurb: 'Entra la lista y detrás vienen tres que «van conmigo».',
    minNight: 3,
    effects: [
      { kind: 'obligatorio', archetypeId: 'vvip' },
      { kind: 'cola', extraPeople: 3 },
    ],
  },
  {
    id: 'ev-drop',
    kind: 'drop',
    name: 'Momento drop',
    blurb: 'El tema cae y la cola deja de esperar.',
    minNight: 2,
    effects: [{ kind: 'ritmo', spawnMsDelta: -2000 }],
  },
  {
    id: 'ev-hater',
    kind: 'hater-famoso',
    name: 'Hater de cartel',
    blurb: 'Alguien conocido intenta colarse para enfriar la sala.',
    minNight: 5,
    effects: [
      { kind: 'obligatorio', archetypeId: 'hater' },
      { kind: 'vibe', delta: -4 },
    ],
  },
  {
    id: 'ev-pelea',
    kind: 'pelea',
    name: 'Lío en la cola',
    blurb: 'Un empujón, un cable o las dos cosas. La puerta para un momento.',
    minNight: 4,
    effects: [{ kind: 'vibe', delta: -8 }],
  },
  {
    id: 'ev-inspeccion',
    kind: 'inspeccion',
    name: 'Inspección',
    blurb: 'Pasan a mirar la puerta. Conviene ir más despacio y no inventar.',
    minNight: 5,
    effects: [
      { kind: 'ritmo', spawnMsDelta: 1000 },
      { kind: 'vibe', delta: -4 },
    ],
  },
  {
    id: 'ev-celebrity',
    kind: 'celebrity',
    name: 'Artista de la casa',
    blurb: 'Llega una cara del cartel. La cola se gira entera.',
    minNight: 5,
    effects: [
      { kind: 'obligatorio', archetypeId: 'cameo' },
      { kind: 'cola', extraPeople: 2 },
    ],
  },
]
