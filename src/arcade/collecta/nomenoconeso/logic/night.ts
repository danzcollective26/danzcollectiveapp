import type { NightAction, NightConfig, NightState } from '../types.ts'
import { scannerFromUpgrades } from './scanner.ts'
import { NomeNoConEsoPendiente } from './pending.ts'

/** Estado en blanco, en la lista, sin cola y sin resultado. */
export function createInitialNightState(night: NightConfig, reducedMotion = false): NightState {
  return {
    phase: 'lista',
    resumePhase: null,
    pauseReason: null,
    nightId: night.id,
    elapsedMs: 0,
    metrics: { ...night.start },
    queue: [],
    current: null,
    scanner: scannerFromUpgrades([]),
    activeEventId: null,
    reducedMotion,
    result: null,
  }
}

/**
 * TODO(nomenoconeso): máquina de la noche. No mutar el estado recibido.
 * lista --empezar--> puerta.
 * puerta|cacheo|escaner --pausar--> pausa. Guardar la fase en resumePhase,
 * guardar pauseReason y congelar elapsedMs. No aceptar decidir, cachear ni escanear.
 * Motivos: boton, pestana, foco, giro.
 * pausa --reanudar--> resumePhase y limpiar pauseReason.
 * puerta --cachear--> cacheo. puerta --escanear--> escaner si ya pasó readyAtMs
 * y la puntuación cubre el coste.
 * tick solo avanza fuera de lista, pausa, cierre y game-over. dt inválido no mueve el reloj.
 * Al decidir, resolver la inspección, actualizar métricas y pasar a la siguiente persona.
 * vibe <= 0 → game-over, reason vibe-cero, hard.
 * capacity > capacityMax → game-over, reason aforo-reventado, hard.
 * elapsed >= duración con objetivos → cierre, objetivos-cumplidos.
 * elapsed >= duración sin objetivos → cierre, objetivos-fallidos, hard false.
 * salir → cierre, abandonada, sin récord.
 * reducedMotion no cambia reglas: solo lo leerá la vista para no sacudir.
 */
export function reduceNight(state: NightState, action: NightAction): NightState {
  void state
  void action
  throw new NomeNoConEsoPendiente('reduceNight')
}
