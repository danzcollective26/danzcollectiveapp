import { memo } from 'react'
import { GRID, type Game } from '../snake'
import { snakeExpression, snakeFace, type Collective } from '../content/collective'
import SnakeArtwork from '../content/SnakeArtwork'

const Cell = memo(function Cell({ kind, face, src, frames, expression, direction }: {
  kind: string; face?: string; src?: string | null; frames?: 3; expression: number; direction?: string
}) {
  return <span data-face={face} data-direction={direction} className={`cell${kind ? ` ${kind}` : ''}`}>
    {src && <SnakeArtwork key={src} src={src} frames={frames} frame={expression}/>} 
  </span>
})

/** Constant-time cell lookups; unchanged cells retain their rendered artwork. */
export default memo(function SnakeCells({ game, artwork }: { game: Game; artwork: Collective['snake'] }) {
  const segments = new Map(game.snake.map((p, i) => [p.y * GRID + p.x, i]))
  const foods = new Map(game.foods.map(p => [p.y * GRID + p.x, p]))
  const walls = new Set(game.walls.map(p => p.y * GRID + p.x))
  return Array.from({ length: GRID * GRID }, (_, i) => {
    const segment = segments.get(i), target = foods.get(i), head = segment === 0
    const collected = segment === undefined ? undefined : game.eatenFaces[segment - 1]
    const face = target ? snakeFace(artwork.faces, target.face * 10) : !head && collected !== undefined ? snakeFace(artwork.faces, collected * 10) : null
    return <Cell key={i} kind={head ? 'head' : segment !== undefined ? 'snake' : target ? 'apple' : walls.has(i) ? 'wall' : ''}
      face={face?.id} src={head ? artwork.headImage : face?.image} frames={face?.frames}
      expression={face ? snakeExpression(face, target?.face ?? collected!, artwork.faces.length) : 0} direction={head ? game.direction : undefined}/>
  })
})
