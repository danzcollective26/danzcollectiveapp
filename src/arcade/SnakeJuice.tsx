import { useEffect, useRef } from 'react'
import type { Game } from '../snake'
import { snakeJuiceEvents } from './snakeJuice'
import { burst, buzz, flash, shake } from './feel/juice'
import './feel/juice.css'

/** Visual and haptic feedback for Jack. Renders nothing and never changes the game. */
export default function SnakeJuice({ game }: { game: Game }) {
  const anchor = useRef<HTMLSpanElement>(null)
  const previous = useRef<Game | null>(null)
  useEffect(() => {
    const events = snakeJuiceEvents(previous.current, game)
    previous.current = game
    if (!events.length) return
    const board = anchor.current?.closest('.game-board') ?? null
    const head = board?.querySelector('.cell.head') ?? board
    for (const event of events) {
      if (event === 'eat') { burst(head, { count: 10, spread: 30 }); buzz('hit') }
      if (event === 'level') { flash(board); burst(head, { count: 18, spread: 54, size: 7 }); buzz('level') }
      if (event === 'stage' || event === 'won') { flash(board); burst(board, { count: 24, spread: 90, size: 8 }); buzz('level') }
      if (event === 'crash') { shake(board, 7); buzz('crash') }
    }
  }, [game])
  return <span ref={anchor} hidden aria-hidden="true"/>
}
