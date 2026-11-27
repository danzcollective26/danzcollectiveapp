/**
 * Superficie del modo. El componente de pantalla no se reexporta
 * para que las pruebas de nodo no carguen JSX.
 * Pantalla inerte: ./NomeNoConEso.tsx. No montarla desde App.tsx.
 */
export { MODE_NAME, PARTY_OVER_LABEL, PAUSE_LABEL } from './copy.ts'
export { NOMENOCONESO_VISIBLE } from './visibility.ts'
export {
  ADMIT_CORRECT,
  ADMIT_WRONG,
  ARCHETYPES,
  BANK_LIMIT,
  CAMEOS,
  DIALOGUES,
  EVENTS,
  HIDDEN_ITEMS,
  NIGHTS,
  PERSON_SEEDS,
  REJECT_CORRECT,
  REJECT_WRONG,
  SCANNER_BASE,
  SCANNER_LIMITS,
  SCAN_ANGER,
  SCAN_FAIL,
  SCORE_LIMIT,
  TRAITS,
  UPGRADES,
  VIBE_MAX,
  VISUAL_CUES,
  VVIP_ADMIT_BONUS,
  VVIP_MAX,
  VVIP_REJECT_PENALTY,
} from './data/index.ts'
export { nightDifficulty } from './logic/difficulty.ts'
export { applyNightResult, readEndCondition } from './logic/end.ts'
export { resolveFrisk, resolveInspection } from './logic/inspection.ts'
export { updateMetrics } from './logic/metrics.ts'
export { createInitialNightState, reduceNight } from './logic/night.ts'
export { NomeNoConEsoPendiente } from './logic/pending.ts'
export { generatePerson } from './logic/people.ts'
export { buildPointsIntent } from './logic/points.ts'
export {
  NOMENOCONESO_STORAGE_KEY,
  createProgression,
  loadProgression,
  orderedUpgrades,
  parseProgression,
  recomputeProgression,
  rememberRecord,
  saveProgression,
} from './logic/progression.ts'
export { resolveScan, scannerFromUpgrades } from './logic/scanner.ts'
export {
  CAMEO_CATALOG_IDS,
  DIALOGUE_SPEAKERS,
  HIDDEN_ITEM_IDS,
  NIGHT_EVENT_KINDS,
  NIGHT_PHASES,
  NOMENOCONESO_SCHEMA_VERSION,
  PAUSE_REASONS,
  PERSON_ARCHETYPE_IDS,
  PROHIBITION_REASONS,
  TICKET_KINDS,
} from './types.ts'
export type {
  Cameo,
  CameoCatalogId,
  DanzPointsIntent,
  DialogueLine,
  DoorChoice,
  EventEffect,
  FriskAttempt,
  HiddenItem,
  HiddenItemId,
  InspectionInput,
  InspectionResolution,
  MetricDelta,
  Metrics,
  NightAction,
  NightConfig,
  NightEndReason,
  NightEvent,
  NightEventKind,
  NightObjectives,
  NightPhase,
  NightResult,
  NightState,
  PauseReason,
  Person,
  PersonArchetype,
  PersonArchetypeId,
  PersonDraftInput,
  PersonSeed,
  ProhibitionReason,
  ProgressionState,
  ScanResolution,
  ScannerState,
  Ticket,
  TicketKind,
  Trait,
  Upgrade,
  UpgradeEffect,
  VisualCue,
} from './types.ts'
