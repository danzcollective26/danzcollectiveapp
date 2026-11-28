import type { Person, PersonDraftInput } from '../types.ts'
import { ARCHETYPES } from '../data/archetypes.ts'
import { CAMEOS } from '../data/cameos.ts'
import { NIGHTS } from '../data/nights.ts'
import { PERSON_SEEDS } from '../data/seeds.ts'

/** 32-bit integer mix of (seed, index, salt). Deterministic, no Math.random. */
export function hashDraw(seed: number, index: number, salt = 0): number {
  let h = (Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(index + 0x7f4a7c15, 0xc2b2ae35) ^ Math.imul(salt + 0x165667b1, 0x27d4eb2f)) >>> 0
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0
  h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0
  h ^= h >>> 15
  return h >>> 0
}

const unit = (value: number) => value / 4294967296

/** Picks an unlocked archetype by weight, then copies one of its seeds (or a cameo). */
export function generatePerson(input: PersonDraftInput): Person {
  const night = NIGHTS.find(item => item.id === input.nightId)
  const nightIndex = night?.index ?? Number.POSITIVE_INFINITY
  const pool = ARCHETYPES.filter(item => input.archetypeIds.includes(item.id) && item.minNight <= nightIndex)
  const archetypes = pool.length ? pool : ARCHETYPES.filter(item => item.id === 'normal')
  const roll = unit(hashDraw(input.seed, input.index, 1))
  const total = archetypes.reduce((sum, item) => sum + Math.max(0, item.weight), 0) || 1
  let cursor = roll * total
  let archetype = archetypes[archetypes.length - 1]
  for (const item of archetypes) {
    cursor -= Math.max(0, item.weight)
    if (cursor < 0) { archetype = item; break }
  }
  const pick = unit(hashDraw(input.seed, input.index, 2))
  const cameo = archetype.id === 'cameo' && CAMEOS.length ? CAMEOS[Math.floor(pick * CAMEOS.length) % CAMEOS.length] : null
  const deck = PERSON_SEEDS.filter(seed => seed.archetypeId === archetype.id)
  const source = cameo ?? (deck.length ? deck[Math.floor(pick * deck.length) % deck.length] : PERSON_SEEDS[0])
  const prohibition = source.age !== null && source.age < 18 ? 'menor' : source.prohibition
  return {
    id: `p-${input.nightId}-${input.index}-${input.seed}`,
    archetypeId: source.archetypeId,
    displayName: source.displayName,
    age: source.age,
    ticket: { ...source.ticket },
    traitIds: [...source.traitIds],
    hiddenItemId: source.hiddenItemId,
    visualCueIds: [...source.visualCueIds],
    dialogueIds: [...source.dialogueIds],
    prohibition,
    cameoId: cameo ? cameo.id : null,
    roll,
  }
}
