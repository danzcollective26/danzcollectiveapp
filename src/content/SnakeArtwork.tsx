import { useState } from 'react'

/** Each expression is a square frame in the same transparent head sheet. */
export default function SnakeArtwork({ src, frames = 1, frame = 0 }: { src: string; frames?: 1 | 3; frame?: number }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <span className="snake-art-fallback" aria-hidden="true">✿</span>
  const image = <img src={src} alt="" draggable={false} decoding="async" onError={() => setFailed(true)} style={frames === 3 ? { transform: `translate(${-Math.max(0, Math.min(2, frame)) * 100 / 3}%, -50%)` } : undefined} />
  return frames === 3 ? <span className="snake-face-frame" data-expression={frame}>{image}</span> : image
}
