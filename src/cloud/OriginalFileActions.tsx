import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { photoFileMime, photoFileName, photoFileType } from './photoFile'

type Props = { client: SupabaseClient<Database>; owner: string; eventId: string; photoId: string; path: string; name: string | null; mime?: string | null }
type Link = { url: string; scope: string; expiresAt: number }
type SavePicker = (options: { suggestedName: string; startIn: 'pictures'; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<FileSystemFileHandle>
const BUCKET = 'danz-event-photos'

async function signedOriginal(client: SupabaseClient<Database>, path: string, filename: string) {
  const at = Date.now()
  const signed = await client.storage.from(BUCKET).createSignedUrls([path], 60, { download: filename })
  const raw = !signed.error ? signed.data?.[0]?.signedUrl : null
  const configured = new URL(client.storage.from(BUCKET).getPublicUrl('__origin_check__').data.publicUrl)
  const url = raw ? new URL(raw) : null
  const prefix = configured.pathname.replace('/object/public/', '/object/sign/').replace('__origin_check__', '')
  if (!url || url.origin !== configured.origin || !url.pathname.startsWith(prefix) || !url.searchParams.has('token') || url.searchParams.get('download') !== filename) throw new Error('Download unavailable')
  return { url: url.href, expiresAt: at + 60_000 }
}

/** Save As, attachment download and sharing always use the unchanged original. */
export default function OriginalFileActions({ client, owner, eventId, photoId, path, name, mime }: Props) {
  const filename = photoFileName(name, mime, path)
  const type = photoFileType(filename)
  const key = `${owner}:${eventId}:${photoId}:${path}:${filename}`
  const [link, setLink] = useState<Link | null>(null)
  const [retry, setRetry] = useState(0)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState<'save' | 'share' | null>(null)
  const [prepared, setPrepared] = useState<{ scope: string; file: File } | null>(null)
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [help, setHelp] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const available = link?.scope === key && Date.now() < link.expiresAt ? link : null
  const current = useRef({ client, key, link: available })
  current.current = { client, key, link: available }
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker
  const canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function'

  useEffect(() => {
    let alive = true, signing = false
    let refresh: ReturnType<typeof setTimeout>, expiry: ReturnType<typeof setTimeout>
    setLink(null); setFailed(false); setPrepared(null); setMessage(''); setActionError(''); setBusy(null); setHelp(false)
    async function sign() {
      if (!alive || signing) return
      signing = true
      try {
        const signed = await signedOriginal(client, path, filename)
        if (!alive) return
        setLink({ scope: key, ...signed }); setFailed(false)
        clearTimeout(expiry)
        expiry = setTimeout(() => { if (alive) { setLink(null); setFailed(true) } }, Math.max(0, signed.expiresAt - Date.now()))
      } catch { if (alive) setFailed(true) }
      finally { signing = false; if (alive) refresh = setTimeout(() => { void sign() }, 45_000) }
    }
    const focus = () => { clearTimeout(refresh); void sign() }
    void sign(); window.addEventListener('focus', focus)
    return () => { alive = false; clearTimeout(refresh); clearTimeout(expiry); window.removeEventListener('focus', focus); abort.current?.abort() }
  }, [client, key, path, filename, retry])

  async function useOriginal(action: 'save' | 'share') {
    if (busy || action === 'save' && !picker || action === 'share' && !canShare) return
    const identity = { client, key }
    const controller = new AbortController(); abort.current?.abort(); abort.current = controller
    const own = () => !controller.signal.aborted && current.current.client === identity.client && current.current.key === identity.key
    let file = prepared?.scope === key ? prepared.file : null
    const wasPrepared = !!file
    let writer: FileSystemWritableFileStream | null = null
    setActionError(''); setMessage(''); setBusy(action)
    try {
      // Open the picker during the tap, BEFORE awaiting any network work.
      const handle = action === 'save' ? await picker!.call(window, {
        suggestedName: filename, startIn: 'pictures',
        types: [{ description: `Foto ${type}`, accept: { [photoFileMime(filename)]: [`.${filename.split('.').pop()}`] } }],
      }) : null
      if (!own()) return
      if (!file) {
        const latest = current.current.link
        const source = latest && Date.now() < latest.expiresAt ? latest : await signedOriginal(client, path, filename)
        if (!own()) return
        const response = await fetch(source.url, { cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal })
        if (!response.ok) throw new Error('Download unavailable')
        const blob = await response.blob()
        if (!own()) return
        if (!blob.size || !blob.type.startsWith('image/')) throw new Error('Invalid image')
        file = new File([blob], photoFileName(filename, blob.type, path), { type: blob.type })
        setPrepared({ scope: key, file })
      }
      if (!own()) return
      if (handle) {
        writer = await handle.createWritable()
        if (!own()) { await writer.abort(); writer = null; return }
        await writer.write(file)
        if (!own()) { await writer.abort(); writer = null; return }
        await writer.close(); writer = null
        if (own()) setMessage(`Archivo guardado: ${handle.name}. Ya puedes seleccionarlo desde otra aplicación.`)
      } else {
        if (!navigator.canShare({ files: [file] })) throw new Error('Sharing unavailable')
        if (!wasPrepared && !navigator.userActivation?.isActive) { setMessage(`Archivo ${type} listo. Pulsa otra vez «Compartir archivo ${type}».`); return }
        // Files only: do not turn this into a URL/text share on the receiver.
        // Resolution means handoff to the OS, not publication to a story.
        await navigator.share({ files: [file] })
      }
    } catch (reason) {
      if (writer) { try { await writer.abort() } catch { /* Already closed or aborted. */ } }
      if (own() && (reason as { name?: string })?.name !== 'AbortError') {
        if (action === 'share' && (reason as { name?: string })?.name === 'NotAllowedError' && file) setMessage(`Archivo ${type} listo. Pulsa otra vez «Compartir archivo ${type}».`)
        else setActionError(action === 'save' ? 'No se pudo guardar el archivo. Prueba «Descargar» o elige otra carpeta con «Guardar como archivo».' : 'No se pudo entregar la foto al menú del móvil. Guarda el archivo y selecciónalo desde la aplicación donde quieras usarlo.')
      }
    } finally { if (own()) setBusy(null) }
  }

  return <div className="original-file-actions">
    <div className="private-gallery-viewer-actions">
      {typeof picker === 'function' && <button className="primary-btn" disabled={!!busy} onClick={() => { void useOriginal('save') }}>{busy === 'save' ? 'GUARDANDO ARCHIVO…' : `GUARDAR ${type} COMO ARCHIVO`}</button>}
      {available ? <a className={`${picker ? 'outline-btn' : 'primary-btn'} external-btn`} href={available.url} download={filename} referrerPolicy="no-referrer" onClick={event => { if (Date.now() >= available.expiresAt) { event.preventDefault(); setRetry(n => n + 1) } }}>DESCARGAR {type}</a> : <button className="outline-btn" disabled={!failed} onClick={() => setRetry(n => n + 1)}>{failed ? 'REINTENTAR DESCARGA' : `PREPARANDO ${type}…`}</button>}
      {canShare && <button className="outline-btn" disabled={!!busy} onClick={() => { void useOriginal('share') }}>{busy === 'share' ? 'PREPARANDO ARCHIVO…' : `COMPARTIR ARCHIVO ${type}`}</button>}
    </div>
    <p className="original-file-name">Archivo: <strong>{filename}</strong> · Original con marca de agua.</p>
    <p className="original-file-hint">{picker ? 'Guardar como archivo permite elegir carpeta y nombre. Puedes guardarlo en Imágenes o Descargas.' : 'Busca la descarga por su nombre en Archivos → Descargas. Abrirla en el navegador no la añade a la galería del móvil.'}</p>
    {message && <p role="status">{message}</p>}
    {failed && !available && <p role="alert">No se pudo preparar el enlace de descarga.</p>}
    {actionError && <p role="alert">{actionError}</p>}
    <button className="original-file-help" aria-expanded={help} onClick={() => setHelp(value => !value)}>INSTAGRAM: CÓMO SUBIR LA FOTO</button>
    {help && <p className="original-file-hint">Guarda el archivo JPG en el móvil. En Instagram pulsa + → Historia → Galería y selecciona la carpeta donde lo guardaste. Si Instagram se abre sin la foto desde «Compartir», usa este recorrido: abrir Instagram no confirma que la foto esté en una historia.</p>}
  </div>
}
