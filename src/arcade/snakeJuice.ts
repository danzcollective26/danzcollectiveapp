import { gameLevel, type Game } from '../snake.ts'

export type SnakeJuiceEvent = 'eat' | 'level' | 'crash' | 'stage' | 'won'
type JuiceState = Pick<Game, 'score' | 'over' | 'won' | 'levelUp' | 'running' | 'mode' | 'steps'>

/** Which feedback a Snake state change deserves. Pure and replay-neutral. */
export function snakeJuiceEvents(previous: JuiceState | null, next: JuiceState): SnakeJuiceEvent[] {
  if (!previous || next.steps < previous.steps) return []
  const events: SnakeJuiceEvent[] = []
  if (next.score > previous.score) {
    events.push('eat')
    if (next.mode === 'classic' && gameLevel(next.score) > gameLevel(previous.score)) events.push('level')
  }
  if (next.won && !previous.won) events.push('won')
  else if (next.levelUp && !previous.levelUp) events.push('stage')
  if (next.over && !previous.over) events.push('crash')
  return events
}
