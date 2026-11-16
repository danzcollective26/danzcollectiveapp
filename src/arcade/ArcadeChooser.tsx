import { useState } from 'react'
import './arcadeChooser.css'

type ArcadeChoice = 'snake' | 'groove' | 'collecta' | 'kart' | 'seis'
const YEPPO_DARES: Record<ArcadeChoice, string[]> = {
  seis: ['Di SEIS con una carta y cierra la mano antes de que Yeppo te cobre las dos.', 'Gana una mesa en difícil sin callarte el grito.'],
  kart: ['Carga un derrape y suéltalo al salir de la curva. Que la crew te vea la matrícula.', 'Completa tres vueltas en Contrarreloj y guarda tu primera marca.'],
  collecta: ['Gana una ronda de Arena creando una cadena de discos. Pero sal de la onda, figura.', 'En Persecución, pilla al rival y escapa antes de que te la devuelva. Así, con cariño.'],
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
    <button type="button" className="arcade-choice" onClick={() => onSelect('collecta')}>
      <img src="/arcade/collecta-mobile-v1.webp" alt="" width="600" height="800" decoding="async" />
      <span className="arcade-choice-copy"><small>03 / SEGURIDAD · BETA LOCAL</small><strong>DANZ COLLECTA</strong><span>Arena + Persecución <b>ELEGIR MODO ↗</b></span></span>
    </button>
    <button type="button" className="arcade-choice" onClick={() => onSelect('kart')}>
      <img src="/arcade/danzporter-cover-v1.webp" alt="" width="600" height="800" decoding="async"/>
      <span className="arcade-choice-copy"><small>04 / RACING · TRES MODOS</small><strong>DANZPORTER</strong><span>Derrapa. Suelta. Desaparece. <b>SALIR A PISTA ↗</b></span></span>
    </button>
    <button type="button" className="arcade-choice" onClick={() => onSelect('seis')}>
      <img src="/arcade/seis-mark.svg" alt="" width="600" height="800" decoding="async"/>
      <span className="arcade-choice-copy"><small>05 / ARCADE · CARTAS</small><strong>SEIS</strong><span>(de la mañana, qué jaleo) <b>JUGAR ↗</b></span></span>
    </button>
    <div className="arcade-yeppo-challenge">
      <div><strong>🌸 YEPPO CHALLENGE</strong><span>Un reto extra para darle salsa a la partida. No modifica puntos ni rankings.</span></div>
      <button type="button" aria-expanded={challengeOpen} onClick={() => setChallengeOpen(value => !value)}>{challengeOpen ? 'OCULTAR' : 'PONME UN RETO ↗'}</button>
      {challengeOpen && <div className="arcade-yeppo-dare"><div className="arcade-challenge-games" role="group" aria-label="Juego del reto de Yeppo"><button type="button" aria-pressed={active==='snake'} onClick={()=>setActive('snake')}>JACK</button><button type="button" aria-pressed={active==='groove'} onClick={()=>setActive('groove')}>GROOVE NINJA</button><button type="button" aria-pressed={active==='collecta'} onClick={()=>setActive('collecta')}>DANZ COLLECTA</button><button type="button" aria-pressed={active==='seis'} onClick={()=>setActive('seis')}>SEIS</button></div><p role="status">{challenge}</p><button type="button" onClick={() => setChallengeIndex(index => index + 1)}>OTRO RETO ↻</button><small>Reto voluntario de Yeppo: todavía no registra cumplimiento ni concede premios.</small></div>}
    </div>
  </div>
}
