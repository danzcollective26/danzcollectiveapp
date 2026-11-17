import type { FriskAttempt, InspectionInput, InspectionResolution, Person } from '../types.ts'
import { NomeNoConEsoPendiente } from './pending.ts'

/**
 * TODO(nomenoconeso): el veredicto correcto es pasa si prohibition es null
 * y fuera en cualquier otro caso. Aplicar ADMIT_* o REJECT_* de data/balance.ts.
 * Si archetypeId es vvip y podía entrar, sumar VVIP_ADMIT_BONUS o VVIP_REJECT_PENALTY.
 * Echar a un VVIP prohibido no aplica la penalización de felicidad.
 * La línea sale de los diálogos de la ficha, sin inventar texto aquí.
 * revealedItem y frisked no cambian el veredicto: solo sirven de pista.
 */
export function resolveInspection(input: InspectionInput): InspectionResolution {
  void input
  throw new NomeNoConEsoPendiente('resolveInspection')
}

/**
 * TODO(nomenoconeso): acierto si hitAtMs cae dentro de
 * [startedAtMs, startedAtMs + windowMs]. Un acierto revela hiddenItemId.
 * Un fallo no revela nada. No decidir aquí si la persona entra.
 */
export function resolveFrisk(person: Person, attempt: FriskAttempt): { hit: boolean; itemId: Person['hiddenItemId'] } {
  void person
  void attempt
  throw new NomeNoConEsoPendiente('resolveFrisk')
}
