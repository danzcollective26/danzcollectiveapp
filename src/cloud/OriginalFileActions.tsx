import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { photoFileMime, photoFileName, photoFileType } from './photoFile'
import { decodePhoto, photoDigest, photoFileSize, verifiedPhotoFile } from './originalPhoto'
import { nativePhotosEnabled } from './nativePhoto'
import NativePhotoActions from './NativePhotoActions'

type Props = { client: SupabaseClient<Database>; owner: string; eventId: string; photoId: string; path: string; name: string | null; mime?: string | null; bytes?: number | null; sha256?: string | null }
type Prepared = { scope: string; file: File; digest: string; url: string }
type SavePicker = (options: { suggestedName: string; startIn: 'pictures'; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<FileSystemFileHandle>
const BUCKET = 'danz-event-photos'

async function signedOriginal(client: SupabaseClient<Database>, path: string, filename: string) {
  const signed = await client.storage.from(BUCKET).createSignedUrls([path], 60, { download: filename })
  const raw = !signed.error ? signed.data?.[0]?.signedUrl : null
  const configured = new URL(client.storage.from(BUCKET).getPublicUrl('__origin_check__').data.publicUrl)
  const url = raw ? new URL(raw) : null
  const prefix = configured.pathname.replace('/object/public/', '/object/sign/').replace('__origin_check__', '')
  if (!url || url.origin !== configured.origin || !url.pathname.startsWith(prefix) || !url.searchParams.has('token') || url.searchParams.get('download') !== filename) throw new Error('Download unavailable')
  return url.href
}

/** Every route hands off the complete, decoded original, never a remote link. */
export default function OriginalFileActions({ client, owner, eventId, photoId, path, name, mime, bytes, sha256 }: Props) {
  const filename = photoFileName(name, mime, path)
  const type = photoFileType(filename)
  const key = `${owner}:${eventId}:${photoId}:${path}:${filename}:${bytes}:${sha256}`
  const [retry, setRetry] = useState(0)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState<'save' | 'share' | null>(null)
  const [prepared, setPrepared] = useState<Prepared | null>(null)
  const [message, setMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [help, setHelp] = useState(false)
  const active = useRef({ client, key, alive: true })
  active.current = { client, key, alive: true }
  const pendingAction = useRef(false)
  const handedOff = useRef(new Set<string>())
  const ready = prepared?.scope === key ? prepared : null
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker
  const canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function'

  useEffect(() => {
    const controller = new AbortController()
    let url: string | null = null
    active.current = { client, key, alive: true }
    setPrepared(null); setFailed(false); setMessage(''); setActionError(''); setBusy(null); setHelp(false)
    pendingAction.current = false
    const own = () => !controller.signal.aborted
    void (async () => {
      try {
        const source = await signedOriginal(client, path, filename)
        if (!own()) return
        const response = await fetch(source, { cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal })
        if (response.status !== 200) throw new Error('Download unavailable')
        const verified = await verifiedPhotoFile(await response.blob(), { name: filename, path, mime, bytes, sha256 })
        if (!own()) return
        await decodePhoto(verified.file)
        if (!own()) return
        url = URL.createObjectURL(verified.file)
        setPrepared({ scope: key, ...verified, url })
      } catch { if (own()) setFailed(true) }
    })()
    return () => {
      controller.abort()
      active.current.alive = false
      // Android can consume a download asynchronously, including after Back.
      if (url) {
        const released = url
        if (handedOff.current.delete(released)) setTimeout(() => URL.revokeObjectURL(released), 120_000)
        else URL.revokeObjectURL(released)
      }
    }
  }, [client, key, path, filename, mime, bytes, sha256, retry])

  async function useOriginal(action: 'save' | 'share') {
    if (pendingAction.current || !ready || action === 'save' && !picker || action === 'share' && !canShare) return
    pendingAction.current = true
    const identity = { client, key }
    const own = () => active.current.alive && active.current.client === identity.client && active.current.key === identity.key
    let writer: FileSystemWritableFileStream | null = null
    setActionError(''); setMessage(''); setBusy(action)
    try {
      if (action === 'save') {
        // Receive the complete photo BEFORE creating a file on the device.
        const handle = await picker!.call(window, {
          suggestedName: ready.file.name, startIn: 'pictures',
          types: [{ description: `Foto ${type}`, accept: { [photoFileMime(ready.file.name)]: [`.${ready.file.name.split('.').pop()}`] } }],
        })
        if (!own()) return
        writer = await handle.createWritable()
        if (!own()) { await writer.abort(); writer = null; return }
        await writer.write(ready.file)
        if (!own()) { await writer.abort(); writer = null; return }
        await writer.close(); writer = null
        const saved = await handle.getFile()
        if (saved.size !== ready.file.size || await photoDigest(saved) !== ready.digest) throw new Error('Device did not save the photo')
        if (own()) setMessage(`Archivo guardado y comprobado: ${handle.name} · ${photoFileSize(saved.size)}.`)
      } else {
        if (!navigator.canShare({ files: [ready.file] })) throw new Error('Sharing unavailable')
        // No network await consumes the activation of this tap.
        await navigator.share({ files: [ready.file] })
      }
    } catch (reason) {
      if (writer) { try { await writer.abort() } catch { /* Already closed. */ } }
      if (own() && (reason as { name?: string })?.name !== 'AbortError') setActionError(action === 'save'
        ? 'No se pudo comprobar el archivo guardado. Usa «Descargar» para guardar la foto completa o elige otra carpeta.'
        : 'No se pudo entregar la foto al menú del móvil. Descarga el archivo y selecciónalo desde la aplicación donde quieras usarlo.')
    } finally { if (own()) { pendingAction.current = false; setBusy(null) } }
  }

  const native = nativePhotosEnabled()
  return <div className="original-file-actions">
    {native && ready && <NativePhotoActions client={client} scope={key} path={path} file={ready.file} digest={ready.digest} />}
    <div className="private-gallery-viewer-actions">
      {ready ? <a className={`${native ? 'outline-btn' : 'primary-btn'} external-btn`} href={ready.url} download={ready.file.name} onClick={event => {
        if (busy) { event.preventDefault(); return }
        handedOff.current.add(ready.url)
        setMessage(`Descarga iniciada. Busca el ${type} por su nombre en las descargas del móvil.`); setActionError('')
      }}>DESCARGAR {type}</a> : <button className="primary-btn" disabled={!failed} onClick={() => setRetry(n => n + 1)}>{failed ? 'REINTENTAR DESCARGA' : `COMPROBANDO ${type}…`}</button>}
      {typeof picker === 'function' && <button className="outline-btn" disabled={!!busy || !ready} onClick={() => { void useOriginal('save') }}>{busy === 'save' ? 'GUARDANDO ARCHIVO…' : `GUARDAR ${type} COMO ARCHIVO`}</button>}
      {canShare && <button className="outline-btn" disabled={!!busy || !ready} onClick={() => { void useOriginal('share') }}>{busy === 'share' ? 'COMPARTIENDO…' : `COMPARTIR ARCHIVO ${type}`}</button>}
    </div>
    <p className="original-file-name"><strong>{filename}</strong>{ready ? ` · ${photoFileSize(ready.file.size)} · Archivo comprobado` : ''}</p>
    <p className="original-file-hint">Original con marca de agua. La descarga se guarda donde indique tu navegador. {picker ? 'Con «Guardar como archivo» puedes elegir Imágenes u otra carpeta.' : 'Después puedes moverla a Imágenes desde Archivos.'}</p>
    {message && <p role="status">{message}</p>}
    {failed && <p role="alert">No se ha recibido una imagen completa y válida. Reintenta con conexión; no se descargará un archivo vacío.</p>}
    {actionError && <p role="alert">{actionError}</p>}
    <button className="original-file-help" aria-expanded={help} onClick={() => setHelp(value => !value)}>INSTAGRAM: CÓMO SUBIR LA FOTO</button>
    {help && <div className="original-file-hint"><p>En el menú de compartir, elige Historias de Instagram si aparece. Si Instagram se abre sin la imagen, descarga el JPG. En Instagram pulsa + → Historia → Galería y busca Descargas o la carpeta elegida.</p><p>La versión web no puede elegir el editor de historias ni guardar directamente en la galería de Android.</p><a className="outline-btn external-btn" href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">ABRIR INSTAGRAM ↗</a></div>}
  </div>
}
