import type { CSSProperties, ReactNode } from 'react'
import './gameSurface.css'

/** The layout slot may be tall or wide; only the actual playfield gets a rim. */
export default function GameSurface({ ratio, className, children, enabled = true }: {
  ratio: number; className: string; children: ReactNode; enabled?: boolean
}) {
  return <div className={`${className} arcade-fit-slot${enabled ? ' is-fitted' : ''}`} style={{ '--arcade-aspect': ratio } as CSSProperties}>
    <div className="arcade-fit-surface">{children}</div>
  </div>
}
