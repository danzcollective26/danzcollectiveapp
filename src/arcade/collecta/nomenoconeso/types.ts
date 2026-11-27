/**
 * Contrato de NomeNoConEso, el modo de puerta de DANZ Collecta.
 * Aquí solo viven tipos y listas cerradas. La partida todavía no se juega.
 */

export const NOMENOCONESO_SCHEMA_VERSION = 1 as const

/** Clave única de este modo. No guarda audio, pases ni datos de otras partidas. */
export const NOMENOCONESO_STORAGE_KEY = 'danz-collecta-nomenoconeso-v1'

export const PERSON_ARCHETYPE_IDS = [
  'vvip',
  'hater',
  'crew',
  'normal',
  'escondite',
  'influencer',
  'cameo',
] as const
export type PersonArchetypeId = (typeof PERSON_ARCHETYPE_IDS)[number]

export const PROHIBITION_REASONS = [
  'sin-entrada',
  'hater',
  'mal-rollo',
  'botella-exterior',
  'objeto-peligroso',
  'expulsado',
  'energia-negativa',
  'menor',
] as const
export type ProhibitionReason = (typeof PROHIBITION_REASONS)[number]

export const HIDDEN_ITEM_IDS = [
  'botella',
  'camara',
  'objeto-ligero',
  'entrada-falsa',
  'purpurina',
] as const
export type HiddenItemId = (typeof HIDDEN_ITEM_IDS)[number]

export const NIGHT_EVENT_KINDS = [
  'avalancha',
  'vvip-cortejo',
  'drop',
  'hater-famoso',
  'pelea',
  'inspeccion',
  'celebrity',
] as const
export type NightEventKind = (typeof NIGHT_EVENT_KINDS)[number]

export const NIGHT_PHASES = [
  'lista',
  'puerta',
  'pausa',
  'cacheo',
  'escaner',
  'cierre',
  'game-over',
] as const
export type NightPhase = (typeof NIGHT_PHASES)[number]

export const PAUSE_REASONS = ['boton', 'pestana', 'foco', 'giro'] as const
export type PauseReason = (typeof PAUSE_REASONS)[number]

export const TICKET_KINDS = ['noche', 'lista', 'invitacion', 'ninguno'] as const
export type TicketKind = (typeof TICKET_KINDS)[number]

export const DIALOGUE_SPEAKERS = ['puerta', 'persona', 'yeppo'] as const
export type DialogueSpeaker = (typeof DIALOGUE_SPEAKERS)[number]

export type Ticket = {
  valid: boolean
  kind: TicketKind
  /** Nombre que figura en la entrada. Puede no coincidir con quien habla. */
  holder: string
}

export type Trait = {
  id: string
  name: string
  blurb: string
  /** Si es false, la tarjeta no lo enseña: hace falta pista, cacheo o escáner. */
  visible: boolean
}

export type HiddenItem = {
  id: HiddenItemId
  name: string
  blurb: string
  /** true cuando el objeto, por sí solo, obliga a echar a la persona. */
  prohibited: boolean
}

export type VisualCue = {
  id: string
  label: string
  /** Pista corta. No nombra el veredicto. */
  hint: string
}

export type DialogueLine = {
  id: string
  speaker: DialogueSpeaker
  text: string
}

export type PersonArchetype = {
  id: PersonArchetypeId
  name: string
  blurb: string
  /** Primera noche (1..N) en la que este grupo puede salir. */
  minNight: number
  /** Peso relativo dentro de la noche. El generador todavía no lo usa. */
  weight: number
  traitIds: readonly string[]
  itemIds: readonly (HiddenItemId | null)[]
  cueIds: readonly string[]
  dialogueIds: readonly string[]
}

/** Ficha de autor para la cola. El generador, cuando exista, partirá de aquí. */
export type PersonSeed = {
  id: string
  archetypeId: PersonArchetypeId
  displayName: string
  /** null solo si no procede pedir la edad, como con Yeppo. */
  age: number | null
  ticket: Ticket
  traitIds: readonly string[]
  hiddenItemId: HiddenItemId | null
  visualCueIds: readonly string[]
  dialogueIds: readonly string[]
  prohibition: ProhibitionReason | null
}

export const CAMEO_CATALOG_IDS = ['yeppo', 'chicharro-es', 'tonydawgs', 'wizme', 'leon'] as const
export type CameoCatalogId = (typeof CAMEO_CATALOG_IDS)[number]

export type Cameo = PersonSeed & {
  catalogId: CameoCatalogId
}

/** Persona ya colocada en la cola. La construirá el generador. */
export type Person = PersonSeed & {
  cameoId: string | null
  /** Tirada 0..1 reservada al generador para desempates. */
  roll: number
}

export type EventEffect =
  | { kind: 'ritmo'; spawnMsDelta: number }
  | { kind: 'cola'; extraPeople: number }
  | { kind: 'vibe'; delta: number }
  | { kind: 'obligatorio'; archetypeId: PersonArchetypeId }

export type NightEvent = {
  id: string
  kind: NightEventKind
  name: string
  blurb: string
  minNight: number
  effects: readonly EventEffect[]
}

export type UpgradeEffect =
  | { kind: 'precision'; amount: number }
  | { kind: 'cooldown'; amount: number }
  | { kind: 'cost'; amount: number }
  | { kind: 'fallo'; amount: number }
  | { kind: 'enfado'; amount: number }
  | { kind: 'cacheo'; amount: number }

export type Upgrade = {
  id: string
  name: string
  blurb: string
  /** Precio en dinero de puerta, entre noches. */
  cost: number
  minReputation: number
  requiresId: string | null
  effects: readonly UpgradeEffect[]
}

export type ScannerState = {
  /** Probabilidad de revelar el objeto. Entre 0.05 y 0.95. */
  precision: number
  cooldownMs: number
  /** Coste en puntos de la noche, no en dinero de puerta. */
  cost: number
  failRisk: number
  angerRisk: number
  friskWindowMs: number
  readyAtMs: number
}

export type MetricDelta = {
  vibe: number
  score: number
  capacity: number
  reputation: number
  vvip: number
  money: number
}

/** Cifras de la noche en curso. reputation y doorMoney son el delta de esa noche. */
export type Metrics = {
  capacity: number
  capacityMax: number
  vibe: number
  score: number
  reputation: number
  doorMoney: number
  vvipHappiness: number
}

export type NightObjectives = {
  minVibe: number
  minScore: number
  /** Igual que Metrics.capacityMax: pasarse es cierre duro. */
  maxCapacity: number
}

export type NightConfig = {
  id: string
  index: number
  name: string
  briefing: string
  durationMs: number
  queueSize: number
  spawnEveryMs: number
  start: Metrics
  objectives: NightObjectives
  archetypeIds: readonly PersonArchetypeId[]
  eventIds: readonly string[]
}

export type NightEndReason =
  | 'vibe-cero'
  | 'aforo-reventado'
  | 'objetivos-cumplidos'
  | 'objetivos-fallidos'
  | 'abandonada'

export type NightResult = {
  nightId: string
  passed: boolean
  /** true solo en vibe a cero o aforo reventado. */
  hard: boolean
  reason: NightEndReason
  metrics: Metrics
  score: number
  doorMoneyEarned: number
  reputationDelta: number
}

export type NightState = {
  phase: NightPhase
  /** Fase a la que vuelve «reanudar». null fuera de pausa. */
  resumePhase: NightPhase | null
  pauseReason: PauseReason | null
  nightId: string
  elapsedMs: number
  metrics: Metrics
  queue: Person[]
  current: Person | null
  scanner: ScannerState
  activeEventId: string | null
  reducedMotion: boolean
  result: NightResult | null
}

export type NightAction =
  | { type: 'empezar' }
  | { type: 'pausar'; reason: PauseReason }
  | { type: 'reanudar' }
  | { type: 'tick'; dtMs: number }
  | { type: 'decidir'; choice: 'pasa' | 'fuera' }
  | { type: 'cachear' }
  | { type: 'resolver-cacheo'; hit: boolean }
  | { type: 'escanear'; nowMs: number }
  | { type: 'cerrar-escaner' }
  | { type: 'salir' }

export type DoorChoice = 'pasa' | 'fuera'

export type InspectionInput = {
  person: Person
  choice: DoorChoice
  /** true si el escáner llegó a mostrar el objeto, o confirmó que no hay. */
  revealedItem: boolean
  frisked: boolean
}

export type InspectionResolution = MetricDelta & {
  correct: boolean
  prohibition: ProhibitionReason | null
  angered: boolean
  line: string
}

export type FriskAttempt = {
  startedAtMs: number
  windowMs: number
  hitAtMs: number | null
}

export type ScanResolution = {
  revealed: boolean
  itemId: HiddenItemId | null
  failed: boolean
  angered: boolean
  scoreCost: number
}

/**
 * Aviso local para un futuro enlace con DANZPOINTS.
 * claim es siempre false: el cliente no concede puntos.
 */
export type DanzPointsIntent = {
  schemaVersion: 1
  gameId: 'collecta-nomenoconeso'
  claim: false
  status: 'no-implementado'
  nightId: string
  localScore: number
}

export type ProgressionState = {
  schemaVersion: typeof NOMENOCONESO_SCHEMA_VERSION
  /** Prefijo de noches superadas, en orden. */
  nightsCleared: string[]
  /** Récord local de puntuación por noche. También cuenta un cierre fallido. */
  bestScoreByNight: Record<string, number>
  doorMoney: number
  reputation: number
  upgradeIds: string[]
  unlockedArchetypeIds: PersonArchetypeId[]
  unlockedEventIds: string[]
  pointsIntent: DanzPointsIntent | null
}

export type PersonDraftInput = {
  nightId: string
  index: number
  /** Semilla entera. El generador deberá ser determinista con ella. */
  seed: number
  archetypeIds: readonly PersonArchetypeId[]
}
