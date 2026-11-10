import { useState } from 'react'

/** A missing image leaves the original coloured tile playable. */
export default function SnakeArtwork({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  return failed ? null : <img src={src} alt="" draggable={false} onError={() => setFailed(true)} />
}
