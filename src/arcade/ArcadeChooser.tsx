import { useState } from 'react'
import './arcadeChooser.css'

type ArcadeChoice = 'snake' | 'groove'
const YEPPO_DARES: Record<ArcadeChoice, string[]> = {
  snake: [
    'Sobrevive hasta recoger 5 objetivos sin parar. ¡Que no te coman los nervios!',
    'Intenta superar tu propio récord en modo Clásico. Yo pongo los pétalos de la suerte.',
    'Atrévete con Laberinto y llega al siguiente nivel. Ni un choque tonto, ¿eh?',
  ],
  groove: [
    'Encadena 5 cortes seguidos en Vinyl Cut sin perder una vida.',
    'Consigue un multicorte y termina la sesión con al menos 3 vidas.',
    'Prueba Scratch Session y clava 3 gestos PERFECTO en una sesión.',
  ],
}
function dayNumber() {
  const today = new Date()
  return Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000)
}

export default function ArcadeChooser({ onSelect }: { onSelect: (choice: ArcadeChoice) => void }) {
  const [active, setActive] = useState<ArcadeChoice>('snake')
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [challengeIndex, setChallengeIndex] = useState(0)
  const challenge = YEPPO_DARES[active][(dayNumber() + challengeIndex) % YEPPO_DARES[active].length]
  return <div className="arcade-chooser" role="group" aria-label="Elegir juego de ARCADANZ">
    <button type="button" className="arcade-choice" onClick={() => onSelect('snake')}>
      <img src="/arcade/jack-approved-mobile.webp" alt="" width="1086" height="1448" decoding="async" />
      <span className="arcade-choice-copy"><small>01 / ARCADE · SERPIENTE</small><strong>LA QUE HAS LIAO, JACK</strong><span>Esquiva, crece y sobrevive <b>JUGAR ↗</b></span></span>
    </button>
    <button type="button" className="arcade-choice" onClick={() => onSelect('groove')}>
      <img src="/arcade/groove-ninja-approved-mobile.webp" alt="" width="1086" height="1448" decoding="async" />
      <span className="arcade-choice-copy"><small>02 / ARCADE · MÚSICA</small><strong>GROOVE NINJA</strong><span>Vinyl Cut + Scratch Session <b>JUGAR ↗</b></span></span>
    </button>
    <div className="arcade-yeppo-challenge">
      <div><strong>🌸 YEPPO CHALLENGE</strong><span>Un reto extra para darle salsa a la partida. No modifica puntos ni rankings.</span></div>
      <button type="button" aria-expanded={challengeOpen} onClick={() => setChallengeOpen(value => !value)}>{challengeOpen ? 'OCULTAR' : 'PONME UN RETO ↗'}</button>
      {challengeOpen && <div className="arcade-yeppo-dare"><div className="arcade-challenge-games" role="group" aria-label="Juego del reto de Yeppo"><button type="button" aria-pressed={active==='snake'} onClick={()=>setActive('snake')}>JACK</button><button type="button" aria-pressed={active==='groove'} onClick={()=>setActive('groove')}>GROOVE NINJA</button></div><p role="status">{challenge}</p><button type="button" onClick={() => setChallengeIndex(index => index + 1)}>OTRO RETO ↻</button><small>Reto voluntario de Yeppo: todavía no registra cumplimiento ni concede premios.</small></div>}
    </div>
  </div>
}
