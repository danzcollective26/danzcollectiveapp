import { useEffect, useRef, useState } from 'react'

export function useVersusView(onRotate: () => void) {
  const [landscape, setLandscape] = useState(() => window.matchMedia('(orientation: landscape)').matches)
  const rotated = useRef(onRotate); rotated.current = onRotate
  useEffect(() => {
    const media = window.matchMedia('(orientation: landscape)')
    const change = () => { rotated.current(); setLandscape(media.matches) }
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  return landscape
}
