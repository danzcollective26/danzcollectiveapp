import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { nativePhotoIntent } from './nativePhoto'
import { verifiedSignedUrl } from './PrivateGallery'
export default function NativePhotoActions({ client, scope, path, file, digest }: { client: SupabaseClient<Database>; scope: string; path: string; file: File; digest: string }) {
  const [link, setLink] = useState<{ scope: string; href: string; expiresAt: number } | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const current = link?.scope === scope && Date.now() < link.expiresAt ? link : null
  useEffect(() => {
    let active = true, signing = false
    let refresh: ReturnType<typeof setTimeout>, expiry: ReturnType<typeof setTimeout>
    setLink(null); setFailed(false)
    async function renew() {
      if (signing || !active) return
      signing = true
      try {
        const at = Date.now()
        const result = await client.storage.from('danz-event-photos').createSignedUrls([path], 60, { download: file.name })
        const url = !result.error ? verifiedSignedUrl(client, result.data?.[0]?.signedUrl ?? null) : null
        if (!url) throw new Error('Native photo unavailable')
        const href = nativePhotoIntent({ url, name: file.name, mime: file.type, bytes: file.size, sha256: digest })
        if (!active) return
        setLink({ scope, href, expiresAt: at + 60000 }); setFailed(false)
        clearTimeout(expiry)
        expiry = setTimeout(() => { if (active) { setLink(null); setFailed(true) } }, Math.max(0, at + 60000 - Date.now()))
      } catch { if (active) setFailed(true) }
      finally { signing = false; if (active) refresh = setTimeout(() => { void renew() }, 45000) }
    }
    const focus = () => { clearTimeout(refresh); void renew() }
    void renew(); window.addEventListener('focus', focus)
    return () => { active = false; clearTimeout(refresh); clearTimeout(expiry); window.removeEventListener('focus', focus) }
  }, [client, scope, path, file, digest, retry])
  return <div className="native-photo-actions">
    {current ? <a className="primary-btn external-btn" href={current.href} onClick={event => { if (Date.now() >= current.expiresAt) { event.preventDefault(); setRetry(n => n + 1) } }}>GUARDAR EN FOTOS · ANDROID</a> : <button className="primary-btn" disabled={!failed} onClick={() => setRetry(n => n + 1)}>{failed ? 'RENOVAR GUARDADO EN FOTOS' : 'PREPARANDO GUARDADO EN FOTOS…'}</button>}
    <p className="original-file-hint">Se abrirá DANZ Fotos para guardar la imagen en el álbum DANZ de tu galería. Puedes elegir otra carpeta con las opciones de abajo.</p>
  </div>
}
