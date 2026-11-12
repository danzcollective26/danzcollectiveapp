import './arcadeChooser.css'

type ArcadeChoice = 'snake' | 'groove'
export default function ArcadeChooser({ active, onSelect }: { active: ArcadeChoice; onSelect: (choice: ArcadeChoice) => void }) {
  return <nav className="arcade-chooser" aria-label="Elegir juego de ARCADANZ">
    <button type="button" className="arcade-choice" aria-current={active === 'snake' ? 'page' : undefined} onClick={() => onSelect('snake')}>
      <img src="/arcade/cable-escape-cover.webp" alt="" loading="lazy" />
      <span className="arcade-choice-copy"><small>01 / ARCADE · SERPIENTE</small><strong>LA QUE HAS LIAO, JACK</strong><span>Esquiva, crece y sobrevive <b>{active === 'snake' ? 'JUGANDO' : 'ELEGIR ↗'}</b></span></span>
    </button>
    <button type="button" className="arcade-choice" aria-current={active === 'groove' ? 'page' : undefined} onClick={() => onSelect('groove')}>
      <img src="/arcade/groove-ninja-cover-v1.webp" alt="" loading="lazy" />
      <span className="arcade-choice-copy"><small>02 / ARCADE · MÚSICA</small><strong>GROOVE NINJA</strong><span>Vinyl Cut + Scratch Session <b>{active === 'groove' ? 'JUGANDO' : 'ELEGIR ↗'}</b></span></span>
    </button>
  </nav>
}
