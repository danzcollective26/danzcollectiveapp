import type { Trait } from '../types.ts'

export const TRAITS: readonly Trait[] = [
  { id: 'buen-rollo', name: 'Buen rollo', blurb: 'Viene a bailar y se le nota.', visible: true },
  { id: 'mal-rollo', name: 'Mal rollo', blurb: 'La cola se tensa cuando habla.', visible: true },
  { id: 'drama', name: 'Drama', blurb: 'Trae una historia y quiere público.', visible: true },
  { id: 'hater', name: 'Hater', blurb: 'Ha venido a opinar, no a quedarse.', visible: false },
  { id: 'expulsado-antes', name: 'Ya expulsado', blurb: 'La puerta lo recuerda de otra noche.', visible: false },
  { id: 'grabando', name: 'Grabando', blurb: 'El móvil no es un recuerdo: es un directo.', visible: true },
  { id: 'lista-vvip', name: 'Lista de cristal', blurb: 'Está en la lista. El séquito, ya veremos.', visible: true },
  { id: 'crew-de-casa', name: 'Crew de casa', blurb: 'Curran dentro. El sello puede ir torcido.', visible: true },
  { id: 'esconde-algo', name: 'Esconde algo', blurb: 'El bolsillo pesa más que la excusa.', visible: false },
  { id: 'conocido-danz', name: 'Cara de casa', blurb: 'Sale en el cartel. La puerta igual mira.', visible: true },
]
