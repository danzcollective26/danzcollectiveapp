import { SCANNER_BASE, SCANNER_LIMITS } from '../data/balance.ts'
import { UPGRADES } from '../data/upgrades.ts'
import type { ScanResolution, ScannerState, UpgradeEffect } from '../types.ts'
import { NomeNoConEsoPendiente } from './pending.ts'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function applyEffect(scanner: ScannerState, effect: UpgradeEffect): void {
  switch (effect.kind) {
    case 'precision':
      scanner.precision += effect.amount
      break
    case 'cooldown':
      scanner.cooldownMs -= effect.amount
      break
    case 'cost':
      scanner.cost -= effect.amount
      break
    case 'fallo':
      scanner.failRisk -= effect.amount
      break
    case 'enfado':
      scanner.angerRisk -= effect.amount
      break
    case 'cacheo':
      scanner.friskWindowMs += effect.amount
      break
    default: {
      const unknown: never = effect
      void unknown
    }
  }
}

/** Dobla las mejoras compradas sobre el escáner de serie. No resuelve un vistazo. */
export function scannerFromUpgrades(upgradeIds: readonly string[]): ScannerState {
  const owned = new Set(upgradeIds)
  const scanner: ScannerState = { ...SCANNER_BASE }
  for (const upgrade of UPGRADES) {
    if (!owned.has(upgrade.id)) continue
    for (const effect of upgrade.effects) applyEffect(scanner, effect)
  }
  const [precisionMin, precisionMax] = SCANNER_LIMITS.precision
  const [cooldownMin, cooldownMax] = SCANNER_LIMITS.cooldownMs
  const [costMin, costMax] = SCANNER_LIMITS.cost
  const [riskMin, riskMax] = SCANNER_LIMITS.risk
  const [friskMin, friskMax] = SCANNER_LIMITS.friskWindowMs
  return {
    precision: clamp(scanner.precision, precisionMin, precisionMax),
    cooldownMs: clamp(Math.round(scanner.cooldownMs), cooldownMin, cooldownMax),
    cost: clamp(Math.round(scanner.cost), costMin, costMax),
    failRisk: clamp(scanner.failRisk, riskMin, riskMax),
    angerRisk: clamp(scanner.angerRisk, riskMin, riskMax),
    friskWindowMs: clamp(Math.round(scanner.friskWindowMs), friskMin, friskMax),
    readyAtMs: 0,
  }
}

/**
 * TODO(nomenoconeso): revelar el objeto si la tirada cae dentro de precision.
 * Si falla, no mostrar nada y aplicar SCAN_FAIL. Con angerRisk, marcar angered
 * y aplicar SCAN_ANGER. Cobrar `cost` en puntos. Empujar readyAtMs con cooldownMs.
 * No gastar dinero de puerta aquí.
 */
export function resolveScan(scanner: ScannerState, nowMs: number, roll: number): ScanResolution {
  void scanner
  void nowMs
  void roll
  throw new NomeNoConEsoPendiente('resolveScan')
}
