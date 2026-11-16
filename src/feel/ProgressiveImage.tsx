import { useLayoutEffect, useState } from 'react'

type Props = {
  src: string
  alt: string
  width?: number
  height?: number
  eager?: boolean
  fit?: 'cover' | 'contain'
  className?: string
  style?: { transform?: string }
  referrerPolicy?: 'no-referrer'
}

/** Reserved frame, shimmer, then a short blur-up once the same file has decoded. */
export default function ProgressiveImage({ src, alt, width = 4, height = 5, eager = false, fit = 'cover', className, style, referrerPolicy }: Props) {
  const [node, setNode] = useState<HTMLImageElement | null>(null)
  const [ready, setReady] = useState(false)
  useLayoutEffect(() => {
    setReady(Boolean(node?.complete && node.naturalWidth > 0))
  }, [src, node])
  return (
    <span className={`progressive-photo${fit === 'contain' ? ' is-contain' : ''}${ready ? ' is-ready' : ''}`}>
      <img
        ref={setNode}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        referrerPolicy={referrerPolicy}
        sizes={fit === 'cover' ? '(max-width: 700px) 50vw, 25vw' : undefined}
        onLoad={() => setReady(true)}
        onError={() => setReady(true)}
      />
    </span>
  )
}
