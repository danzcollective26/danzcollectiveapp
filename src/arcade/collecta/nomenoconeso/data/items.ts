import type { HiddenItem } from '../types.ts'

export const HIDDEN_ITEMS: readonly HiddenItem[] = [
  { id: 'botella', name: 'Botella de fuera', blurb: 'Bebida que no ha pasado por la barra.', prohibited: true },
  { id: 'camara', name: 'Cámara de bolsillo', blurb: 'Cabe en la chaqueta. No siempre está grabando.', prohibited: false },
  { id: 'objeto-ligero', name: 'Objeto peligroso', blurb: 'Algo corto y metálico. No entra.', prohibited: true },
  { id: 'entrada-falsa', name: 'Entrada falsa', blurb: 'El sello brilla demasiado.', prohibited: true },
  { id: 'purpurina', name: 'Purpurina', blurb: 'Mancha, no prohíbe. Pista falsa.', prohibited: false },
]
