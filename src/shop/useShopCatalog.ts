import { useEffect, useRef, useState } from 'react'
import type { ShopCatalog } from './catalog'
import { fetchStorefrontCatalog } from './storefront'

export function useShopCatalog(baseline: ShopCatalog) {
  const [state, setState] = useState({ catalog: baseline, checking: true, failed: false })
  const [revision, setRevision] = useState(0)
  const lastAttempt = useRef(0)
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    lastAttempt.current = Date.now()
    setState(previous => ({ ...previous, checking: true, failed: false }))
    void fetchStorefrontCatalog(baseline, controller.signal).then(catalog => {
      if (active) setState({ catalog, checking: false, failed: false })
    }).catch(() => {
      if (active && !controller.signal.aborted) setState(previous => ({ ...previous, checking: false, failed: true }))
    })
    return () => { active = false; controller.abort() }
  }, [baseline, revision])
  useEffect(() => {
    const resume = () => {
      if (!document.hidden && Date.now() - lastAttempt.current >= 5 * 60 * 1000) {
        lastAttempt.current = Date.now()
        setRevision(value => value + 1)
      }
    }
    window.addEventListener('focus', resume)
    document.addEventListener('visibilitychange', resume)
    return () => { window.removeEventListener('focus', resume); document.removeEventListener('visibilitychange', resume) }
  }, [])
  return { ...state, refresh: () => setRevision(value => value + 1) }
}
