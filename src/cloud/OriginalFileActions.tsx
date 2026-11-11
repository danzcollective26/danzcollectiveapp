import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { photoFileName, photoFileType } from './photoFile'

type Props = { client: SupabaseClient<Database>; owner: string; eventId: string; photoId: string; path: string; name: string | null; mime?: string | null }
type Link = { url: string; scope: string; expiresAt: number }
const BUCKET = 'danz-event-photos'

/** Native attachment downloads and file sharing both use the unchanged original. */
export default function OriginalFileActions({ client, owner, eventId, photoId, path, name, mime }: Props) {
  const filename = photoFileName(name, mime, path)
  const type = photoFileType(filename)
  const key = `${owner}:${eventId}:${photoId}:${path}:${filename}`
  const current = useRef({ client, key })
  current.current = { client, key }
  const [link, setLink] = useState<Link | null>(null)
  const [retry, setRetry] = useState(0)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [prepared, setPrepared] = useState<{ scope: string; file: File } | null>(null)
  const [message, setMessage] = useState('')
  const [shareError, setShareError] = useState('')
  const abort = useRef<AbortController | null>(null)
  const canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function'
  const available = link?.scope === key && Date.now() < link.expiresAt ? link : null

  useEffect(() => {
    let alive = true, signing = false
    let refresh: ReturnType<typeof setTimeout>, expiry: ReturnType<typeof setTimeout>
    setLink(null); setFailed(false); setPrepared(null); setMessage(''); setShareError(''); setBusy(false)
    async function sign() {
      if (!alive || signing) return
      signing = true
      try {
        const at = Date.now()
        const signed = await client.storage.from(BUCKET).createSignedUrls([path], 60, { download: filename })
        if (!alive) return
        const raw = !signed.error ? signed.data?.[0]?.signedUrl : null
        // The filename option is delivered by Storage as Content-Disposition:
        // attachment. This avoids Android treating a transient blob as a page.
        const configured = new URL(client.storage.from(BUCKET).getPublicUrl('__origin_check__').data.publicUrl)
        const url = raw ? new URL(raw) : null
        const prefix = configured.pathname.replace('/object/public/', '/object/sign/').replace('__origin_check__', '')
        if (!url || url.origin !== configured.origin || !url.pathname.startsWith(prefix) || !url.searchParams.has('token') || url.searchParams.get('download') !== filename) throw new Error('Download unavailable')
        setLink({ scope: key, url: url.href, expiresAt: at + 60_000 }); setFailed(false)
        clearTimeout(expiry)
        expiry = setTimeout(() => { if (alive) { setLink(null); setFailed(true) } }, Math.max(0, at + 60_000 - Date.now()))
      } catch { if (alive) setFailed(true) }
      finally { signing = false; if (alive) refresh = setTimeout(() => { void sign() }, 45_000) }
    }
    const focus = () => { clearTimeout(refresh); void sign() }
    void sign(); window.addEventListener('focus', focus)
    return () => { alive = false; clearTimeout(refresh); clearTimeout(expiry); window.removeEventListener('focus', focus); abort.current?.abort() }
  }, [client, key, path, filename, retry])

  async function shareFile() {
    if (!canShare || busy) return
    const identity = { client, key }
    const own = () => current.current.client === identity.client && current.current.key === identity.key
    setShareError(''); setMessage('')
    let file = prepared?.scope === key ? prepared.file : null
    const controller = new AbortController(); abort.current?.abort(); abort.current = controller
    setBusy(true)
    try {
      if (!file) {
        if (!available) throw new Error('Download unavailable')
        const response = await fetch(available.url, { cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal })
        if (!response.ok) throw new Error('Download unavailable')
        const blob = await response.blob()
        if (!own() || controller.signal.aborted) return
        if (!blob.size || !blob.type.startsWith('image/')) throw new Error('Invalid image')
        file = new File([blob], photoFileName(filename, blob.type, path), { type: blob.type })
        if (!navigator.canShare({ files: [file] })) throw new Error('Sharing unavailable')
        setPrepared({ scope: key, file })
        // A slow transfer can consume the first tap's activation. Keep the File
        // ready for another explicit tap rather than failing or opening a URL.
        if (!navigator.userActivation?.isActive) { setMessage(`Archivo ${type} listo. Pulsa otra vez «Guardar o compartir ${type}».`); return }
      }
      if (!own() || controller.signal.aborted) return
      await navigator.share({ files: [file], title: file.name })
    } catch (reason) {
      if (own() && !controller.signal.aborted && (reason as { name?: string })?.name !== 'AbortError') {
        if ((reason as { name?: string })?.name === 'NotAllowedError' && file) setMessage(`Archivo ${type} listo. Pulsa otra vez «Guardar o compartir ${type}».`)
        else setShareError('No se pudo abrir la opción del móvil. Puedes usar «Descargar» para guardar el archivo.')
      }
    } finally { if (own() && !controller.signal.aborted) setBusy(false) }
  }

  return <div className="original-file-actions">
    <div className="private-gallery-viewer-actions">
      {available ? <a className="primary-btn external-btn" href={available.url} download={filename} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">DESCARGAR {type}</a> : <button className="primary-btn" disabled={!failed} onClick={() => setRetry(n => n + 1)}>{failed ? 'REINTENTAR DESCARGA' : `PREPARANDO ${type}…`}</button>}
      {canShare && <button className="outline-btn" disabled={busy || !available && prepared?.scope !== key} onClick={() => { void shareFile() }}>{busy ? 'PREPARANDO ARCHIVO…' : `GUARDAR O COMPARTIR ${type}`}</button>}
    </div>
    <p className="original-file-name">Archivo: <strong>{filename}</strong> · Original con marca de agua.</p>
    <p className="original-file-hint">Encontrarás el archivo descargado en Archivos → Descargas.</p>
    {message && <p role="status">{message}</p>}
    {failed && !available && <p role="alert">No se pudo preparar la descarga del original.</p>}
    {shareError && <p role="alert">{shareError}</p>}
  </div>
}
