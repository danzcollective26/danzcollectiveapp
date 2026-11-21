import type { YeppoDemoRequest } from '../yeppo/Yeppo'
import './testLab.css'

export default function TestLab({ onCollecta, onJack, onGroove, onKart, onLibrary, onYeppo }: {
  onCollecta: () => void; onJack: () => void; onGroove: () => void; onKart: () => void; onLibrary: () => void
  onYeppo: (move: YeppoDemoRequest['move']) => void
}) {
  return <section className="content inner-page test-lab" aria-label="Zona de pruebas DANZ">
    <header className="test-lab-heading"><div><span className="eyebrow">DANZ COLLECTIVE / PLAYGROUND</span><h1>PRUEBA<br/><em>EL SIGUIENTE PASO.</em></h1><p>Zona técnica de ensayo. La portada normal de DANZ está en el enlace «VOLVER A DANZ».</p></div><a className="outline-btn external-btn" href="/">VOLVER A DANZ ↗</a></header>

    <button className="test-lab-arena module" type="button" onClick={onCollecta}><img src="/arcade/collecta-mobile-v1.webp" alt="" width="600" height="800" decoding="async"/><span><small>BETA LOCAL · SOLO O DOS JUGADORES</small><strong>DANZ COLLECTA</strong><p>Cierra la pista contra la crew automática, reta a alguien en Arena o pasa el marrón en Persecución.</p><b>PROBAR LOS MODOS · SOLO Y 1 VS 1 ↗</b></span></button>
    <section aria-labelledby="test-games-title"><div className="test-lab-games-heading"><div><span className="eyebrow">02 / ENTRA A JUGAR</span><h2 id="test-games-title">La pista está lista.</h2></div><button type="button" className="outline-btn" onClick={onLibrary}>VER BIBLIOTECA ↗</button></div><div className="test-lab-games">
      <button className="test-lab-game module" type="button" onClick={onJack}><img src="/arcade/jack-approved-mobile.webp" alt="" width={1086} height={1448} decoding="async"/><span><small>CLÁSICO + 12 LABERINTOS</small><strong>LA QUE HAS LIAO, JACK</strong><b>PROBAR JUEGO ↗</b></span></button>
      <button className="test-lab-game module" type="button" onClick={onGroove}><img src="/arcade/groove-ninja-approved-mobile.webp" alt="" width={1086} height={1448} decoding="async"/><span><small>VINYL CUT + SCRATCH SESSION</small><strong>GROOVE NINJA</strong><b>PROBAR JUEGO ↗</b></span></button>
    </div><p className="test-lab-note">Novedades: en Vinyl Cut, corta hacia la flecha y sigue las secuencias numeradas (+300). Prueba Persecución dentro de DANZ Collecta. En Groove, abre AJUSTES para suavizar los efectos y desbloquea Trazo Club con 20 cortes en una sesión.</p></section>
    <button className="test-lab-arena module" type="button" onClick={onKart}><img src="/arcade/danzporter-cover-v1.webp" alt="" width="600" height="800" decoding="async"/><span><small>04 / NUEVO · RACING LOCAL</small><strong>DANZPORTER</strong><p>Circuitos 3D, derrapes e impulso. Corre contra la crew, guarda tu contrarreloj o comparte el móvil en duelo.</p><b>SALIR A PISTA ↗</b></span></button>
    <p className="test-lab-note">Prueba también al girar el móvil. MODOS vuelve a DANZ Collecta; desde allí puedes volver a la biblioteca. Los permisos de cuentas, galerías y administración son los habituales de DANZ.</p>
    <details className="test-lab-yeppo" aria-labelledby="test-yeppo-title"><summary id="test-yeppo-title">LABORATORIO OPCIONAL · YEPPO (EN DESARROLLO)</summary><p>Estas animaciones son solo pruebas; no forman parte de la pantalla inicial de DANZ.</p><div className="test-lab-walks"><button type="button" onClick={() => onYeppo('stroll')}>PASEO TRANQUILO</button><button type="button" onClick={() => onYeppo('sneak')}>DE PUNTILLAS</button><button type="button" onClick={() => onYeppo('dash')}>A LA CARRERA</button></div></details>
  </section>
}
