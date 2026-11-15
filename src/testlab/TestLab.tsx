import type { YeppoDemoRequest } from '../yeppo/Yeppo'
import './testLab.css'

export default function TestLab({ onJack, onGroove, onLibrary, onYeppo }: {
  onJack: () => void; onGroove: () => void; onLibrary: () => void
  onYeppo: (move: YeppoDemoRequest['move']) => void
}) {
  return <section className="content inner-page test-lab" aria-label="Zona de pruebas DANZ">
    <header className="test-lab-heading"><div><span className="eyebrow">DANZ COLLECTIVE / PLAYGROUND</span><h1>PRUEBA<br/><em>EL SIGUIENTE PASO.</em></h1><p>Yeppo y los juegos reales de la app, a un toque desde tu móvil.</p></div><a className="outline-btn external-btn" href="/">VOLVER A DANZ ↗</a></header>
    <section className="test-lab-yeppo" aria-labelledby="test-yeppo-title"><div><span className="eyebrow">01 / YEPPO EN ACCIÓN</span><h2 id="test-yeppo-title">Dale una vuelta.</h2><p>Elige su paseo. Tócalo cuando aparezca para ver cómo reacciona.</p></div><div className="test-lab-walks"><button type="button" onClick={() => onYeppo('stroll')}>PASEO TRANQUILO</button><button type="button" onClick={() => onYeppo('sneak')}>DE PUNTILLAS</button><button type="button" onClick={() => onYeppo('dash')}>A LA CARRERA</button></div><small>Si has activado reducir movimiento en tu dispositivo, Yeppo te saluda sin cruzar la pantalla.</small></section>
    <section aria-labelledby="test-games-title"><div className="test-lab-games-heading"><div><span className="eyebrow">02 / ENTRA A JUGAR</span><h2 id="test-games-title">La pista está lista.</h2></div><button type="button" className="outline-btn" onClick={onLibrary}>VER BIBLIOTECA ↗</button></div><div className="test-lab-games">
      <button className="test-lab-game module" type="button" onClick={onJack}><img src="/arcade/jack-approved-mobile.webp" alt="" width={1086} height={1448} decoding="async"/><span><small>CLÁSICO + 12 LABERINTOS</small><strong>LA QUE HAS LIAO, JACK</strong><b>PROBAR JUEGO ↗</b></span></button>
      <button className="test-lab-game module" type="button" onClick={onGroove}><img src="/arcade/groove-ninja-approved-mobile.webp" alt="" width={1086} height={1448} decoding="async"/><span><small>VINYL CUT + SCRATCH SESSION</small><strong>GROOVE NINJA</strong><b>PROBAR JUEGO ↗</b></span></button>
    </div></section>
    <aside className="test-lab-next"><span className="eyebrow">03 / LOS TRES SIGUIENTES</span><h2>Duelo pendiente.</h2><ul><li><strong>ARENA DANZ</strong><span>Inspirado en Bomberman · nombre provisional</span></li><li><strong>YEPPO PILLA-PILLA</strong><span>Persecución y cambio de papeles</span></li><li><strong>DANZ KART MINI</strong><span>Derrapes y carreras cortas</span></li></ul><p>Aprobados para desarrollar. Todavía no están jugables. Primero duelo en el mismo móvil; después, salas online.</p></aside>
    <p className="test-lab-note">Prueba también al girar el móvil. Puedes salir de cada juego con BIBLIOTECA o SALIR DEL JUEGO. Los permisos de cuentas, galerías y administración son los habituales de DANZ.</p>
  </section>
}
