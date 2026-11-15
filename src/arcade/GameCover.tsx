export const GAME_TITLE = 'LA QUE HAS LIAO, JACK'
export const GAME_SHORT_TITLE = 'LIAO, JACK'

export default function GameCover({ className, decorative = false }: { className: string; decorative?: boolean }) {
  return <figure className={className} aria-hidden={decorative || undefined}>
    <img src="/arcade/jack-approved-mobile.webp" alt={decorative ? '' : `Carátula de ${GAME_TITLE}: un chico de camiseta roja persigue a un cable jack con vida`} width="1086" height="1448" decoding="async" />
    <figcaption className="game-cover-caption"><span>LA QUE HAS LIAO,</span><strong>JACK</strong></figcaption>
  </figure>
}
