import type { Person, PersonDraftInput } from '../types.ts'
import { NomeNoConEsoPendiente } from './pending.ts'

/**
 * TODO(nomenoconeso): elegir arquetipo desbloqueado con peso y semilla.
 * Mezclar PERSON_SEEDS de ese arquetipo con CAMEOS cuando el id sea cameo.
 * Copiar la ficha, no mutarla. Edad menor de 18 fuerza prohibition menor.
 * La misma semilla y el mismo índice devuelven la misma persona.
 * No usar Math.random.
 */
export function generatePerson(input: PersonDraftInput): Person {
  void input
  throw new NomeNoConEsoPendiente('generatePerson')
}
