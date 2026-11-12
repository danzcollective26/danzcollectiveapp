export const GAME_TITLE = 'LA QUE HAS LIAO, JACK'
export const GAME_SHORT_TITLE = 'LIAO, JACK'

export default function GameCover({ className, decorative = false }: { className: string; decorative?: boolean }) {
  return <figure className={className} aria-hidden={decorative || undefined}>
    <img src="/arcade/cable-escape-cover.webp" alt={decorative ? '' : `Carátula de ${GAME_TITLE}: un cable de sonido huye de una mano que intenta atraparlo`} width="1536" height="1024" />
    <figcaption className="game-cover-caption"><span>LA QUE HAS LIAO,</span><strong>JACK</strong></figcaption>
  </figure>
}
