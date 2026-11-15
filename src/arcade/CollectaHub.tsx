import './collecta.css'

export default function CollectaHub({ onArena, onChase, onBack }: { onArena: () => void; onChase: () => void; onBack: () => void }) {
  return <section className="content inner-page collecta-hub" aria-label="Modos de DANZ Collecta">
    <button type="button" className="back" onClick={onBack}>← BIBLIOTECA ARCADANZ</button>
    <header className="collecta-hero">
      <figure className="collecta-cover"><img src="/arcade/collecta-mobile-v1.webp" alt="Portada de DANZ Collecta: el guardián de la pista, una factura pagada y discos entre las luces del club" width="600" height="800" decoding="async" fetchPriority="high"/></figure>
      <div className="collecta-intro"><span className="eyebrow">DANZ COLLECTIVE / SEGURIDAD EN LA PISTA</span><h1>DANZ<br/><em>COLLECTA.</em></h1><span className="collecta-tagline">DÍA DE COBRO</span><p>Orden en la pista. Cuentas al día.<br/>Elige cómo empieza tu turno.</p><small>BETA LOCAL · DOS JUGADORES EN EL MISMO MÓVIL</small></div>
    </header>
    <div className="collecta-modes">
      <button type="button" onClick={onArena}><span>01 / ESTRATEGIA · DOS JUGADORES</span><strong>ARENA</strong><p>Suelta discos, abre caminos y escapa de las cadenas. Primero en ganar tres rondas.</p><b>JUGAR ARENA 1 VS 1 ↗</b></button>
      <button type="button" onClick={onChase}><span>02 / PILLA-PILLA · DOS JUGADORES</span><strong>PERSECUCIÓN</strong><p>Pilla al rival, cambia de papel y escapa. Un minuto, dos mandos y un sprint para sorprender.</p><b>JUGAR PERSECUCIÓN ↗</b></button>
      <article><span>03 / PRÓXIMO MODO</span><h2>CONTRA LA MÁQUINA</h2><p>Rival automático para jugar a Arena en solitario.</p><small>PENDIENTE DE DESARROLLO</small></article>
    </div><p className="collecta-note">Una persona en cada extremo del móvil. Cada mando y sus flechas siguen el punto de vista de su jugador. La versión actual es práctica local, sin premios competitivos ni salas online.</p>
  </section>
}
