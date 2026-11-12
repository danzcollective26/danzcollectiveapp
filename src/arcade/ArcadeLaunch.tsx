import './arcadeChooser.css'
export default function ArcadeLaunch({ game, mode }: { game: 'snake' | 'groove'; mode?: string }) {
  const snake = game === 'snake'
  return <div aria-hidden="true" className={`arcade-launch ${game}`}>
    <img src={snake ? '/arcade/cable-escape-cover.webp' : '/arcade/groove-ninja-cover-v1.webp'} alt="" />
    <span><small>ARCADANZ PRESENTA</small><strong>{snake ? 'LA QUE HAS LIAO, JACK' : 'GROOVE NINJA'}</strong><em>{snake ? 'PREPÁRATE PARA ESCAPAR' : mode === 'scratch' ? 'SCRATCH SESSION' : 'VINYL CUT'}</em></span>
  </div>
}
