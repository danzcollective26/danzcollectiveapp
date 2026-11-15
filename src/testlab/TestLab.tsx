import type { YeppoDemoRequest } from '../yeppo/Yeppo'
import './testLab.css'

export default function TestLab({ onCollecta, onJack, onGroove, onLibrary, onYeppo }: {
  onCollecta: () => void; onJack: () => void; onGroove: () => void; onLibrary: () => void
  onYeppo: (move: YeppoDemoRequest['move']) => void
}) {
  return <section className="content inner-page test-lab" aria-label="Zona de pruebas DANZ">
    <header className="test-lab-heading"><div><span className="eyebrow">DANZ COLLECTIVE / PLAYGROUND</span><h1>PRUEBA<br/><em>EL SIGUIENTE PASO.</em></h1><p>Yeppo y los juegos reales de la app, a un toque desde tu móvil.</p></div><a className="outline-btn external-btn" href="/">VOLVER A DANZ ↗</a></header>
    <section className="test-lab-yeppo" aria-labelledby="test-yeppo-title"><div><span className="eyebrow">01 / YEPPO EN ACCIÓN</span><h2 id="test-yeppo-title">Dale una vuelta.</h2><p>Elige su paseo. Tócalo cuando aparezca para ver cómo reacciona.</p></div><div className="test-lab-walks"><button type="button" onClick={() => onYeppo('stroll')}>PASEO TRANQUILO</button><button type="button" onClick={() => onYeppo('sneak')}>DE PUNTILLAS</button><button type="button" onClick={() => onYeppo('dash')}>A LA CARRERA</button></div><small>Si has activado reducir movimiento en tu dispositivo, Yeppo te saluda sin cruzar la pantalla.</small></section>
    <button className="test-lab-arena module" type="button" onClick={onCollecta}><img src="/arcade/collecta-mobile-v1.webp" alt="" width="600" height="800" decoding="async"/><span><small>BETA LOCAL · SOLO O DOS JUGADORES</small><strong>DANZ COLLECTA</strong><p>Cierra la pista contra la crew automática, reta a alguien en Arena o pasa el marrón en Persecución.</p><b>PROBAR LOS MODOS · SOLO Y 1 VS 1 ↗</b></span></button>
    <section aria-labelledby="test-games-title"><div className="test-lab-games-heading"><div><span className="eyebrow">02 / ENTRA A JUGAR</span><h2 id="test-games-title">La pista está lista.</h2></div><button type="button" className="outline-btn" onClick={onLibrary}>VER BIBLIOTECA ↗</button></div><div className="test-lab-games">
      <button className="test-lab-game module" type="button" onClick={onJack}><img src="/arcade/jack-approved-mobile.webp" alt="" width={1086} height={1448} decoding="async"/><span><small>CLÁSICO + 12 LABERINTOS</small><strong>LA QUE HAS LIAO, JACK</strong><b>PROBAR JUEGO ↗</b></span></button>
      <button className="test-lab-game module" type="button" onClick={onGroove}><img src="/arcade/groove-ninja-approved-mobile.webp" alt="" width={1086} height={1448} decoding="async"/><span><small>VINYL CUT + SCRATCH SESSION</small><strong>GROOVE NINJA</strong><b>PROBAR JUEGO ↗</b></span></button>
    </div><p className="test-lab-note">Novedades: prueba Persecución dentro de DANZ Collecta. En Groove, abre AJUSTES para suavizar los efectos y desbloquea Trazo Club con 20 cortes en una sesión.</p></section>
    <aside className="test-lab-next"><span className="eyebrow">03 / EL PRÓXIMO DUELO</span><h2>En la parrilla.</h2><ul><li><strong>DANZ KART MINI</strong><span>Derrapes y carreras cortas</span></li></ul><p>Aprobado para desarrollar. Todavía no está jugable. Las salas online siguen pendientes; Arena y Pilla-Pilla son duelos locales.</p></aside>
    <p className="test-lab-note">Prueba también al girar el móvil. MODOS vuelve a DANZ Collecta; desde allí puedes volver a la biblioteca. Los permisos de cuentas, galerías y administración son los habituales de DANZ.</p>
  </section>
}
