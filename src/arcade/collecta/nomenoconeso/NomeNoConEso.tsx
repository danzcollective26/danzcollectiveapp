import { NIGHTS } from './data/nights.ts'
import { MODE_NAME, PARTY_OVER_LABEL, PAUSE_LABEL } from './copy.ts'
import { NOMENOCONESO_VISIBLE } from './visibility.ts'
import './nomenoconeso.css'

/**
 * Pantalla inerte. No empieza partida, no lee localStorage y no se monta
 * desde App, CollectaHub ni ArcadeChooser. Ver docs/NOMENOCONESO_PLAN.md.
 */
export default function NomeNoConEso({ onBack }: { onBack: () => void }) {
  return (
    <section className="nnc-stub" aria-label="NomeNoConEso, modo en preparación">
      <p className="nnc-kicker">DANZ Collecta · modo oculto</p>
      <h1>{MODE_NAME}</h1>
      <p>La puerta del after. Tú pones la lista, el rollo y el aforo. Todavía no hay partida: esto es el esqueleto.</p>
      <p role="status">{NOMENOCONESO_VISIBLE ? 'La bandera está encendida, pero la partida sigue sin hacerse.' : 'Oculto para quien juega. No está en el hub ni en la biblioteca.'}</p>
      <ol aria-label="Noches previstas">
        {NIGHTS.map((night) => <li key={night.id}><b>Noche {night.index}.</b> {night.name}</li>)}
      </ol>
      <p className="nnc-reserved">Textos reservados, sin usarlos en una partida: «{PAUSE_LABEL}» y «{PARTY_OVER_LABEL}».</p>
      <button type="button" onClick={onBack}>Volver a los modos</button>
    </section>
  )
}
