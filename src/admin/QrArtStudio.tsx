import { useEffect, useRef, useState, type FormEvent } from 'react'
import QRCode from 'qrcode'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import './qrArtStudio.css'

type Result = { image: string; content: string; kind: 'classic' | 'art' }
export default function QrArtStudio({ client }: { client: SupabaseClient<Database> }) {
  const [content, setContent] = useState(() => new URL('/', window.location.origin).href)
  const [prompt, setPrompt] = useState('Flor de seis pétalos y discos de vinilo, blanco y negro con acentos amarillo cálido, mosaico gráfico, alto contraste')
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const active = useRef<AbortController | null>(null)
  useEffect(() => () => { const pending = active.current; active.current = null; pending?.abort() }, [])
  const generate = async (art: boolean) => {
    if (active.current) return
    const text = content.trim(), style = prompt.trim()
    if (!text || new TextEncoder().encode(text).length > 600 || (art && style.length < 3)) { setError('Introduce un enlace o texto breve y describe el estilo para la versión con IA.'); return }
    const abort = new AbortController()
    active.current = abort; setBusy(true); setError(''); setResult(null)
    const timer = window.setTimeout(() => abort.abort(), 135_000)
    try {
      let image: string
      if (art) {
        const session = await client.auth.getSession()
        if (session.error || !session.data.session) throw new Error('Inicia sesión de nuevo para generar el diseño con IA.')
        const response = await fetch('/api/qr-art', { method: 'POST', signal: abort.signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.data.session.access_token}` },
          body: JSON.stringify({ content: text, prompt: style }),
        })
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'El generador IA no está disponible aquí. Puedes crear el QR clásico.')
        if (!data?.verified || data.content !== text || typeof data.image !== 'string' || !data.image.startsWith('data:image/png;base64,')) throw new Error('No se ha podido comprobar el QR. Usa el QR clásico o vuelve a intentarlo.')
        image = data.image
      } else image = await QRCode.toDataURL(text, { errorCorrectionLevel: 'H', width: 768, margin: 4 })
      if (!abort.signal.aborted) setResult({ image, content: text, kind: art ? 'art' : 'classic' })
    } catch (reason) {
      if (active.current !== abort) return
      if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : 'No se ha podido crear el QR.')
      else setError('Generación cancelada. Puedes volver a intentarlo.')
    } finally { clearTimeout(timer); if (active.current === abort) { active.current = null; setBusy(false) } }
  }
  const submit = (event: FormEvent) => { event.preventDefault(); void generate(true) }
  return <section className="account-card qr-art-studio" aria-labelledby="qr-studio-title">
    <header className="qr-art-heading"><div><span className="eyebrow">DANZ / HERRAMIENTAS</span><h2 id="qr-studio-title">QR STUDIO</h2></div><span className="qr-art-free">USO GRATUITO</span></header>
    <p>Crea el QR de un cartel, una colección o la entrada general a DANZ.</p>
    <form className="account-form" onSubmit={submit}>
      <label htmlFor="qr-studio-content">Enlace o texto del QR</label>
      <textarea id="qr-studio-content" required maxLength={600} value={content} disabled={busy} onChange={event => { setContent(event.target.value); setResult(null); setError('') }} rows={2}/>
      <label htmlFor="qr-studio-prompt">Estilo visual</label>
      <textarea id="qr-studio-prompt" maxLength={700} value={prompt} disabled={busy} onChange={event => { setPrompt(event.target.value); setResult(null) }} rows={3}/>
      <p className="account-note">Al generar con IA, el contenido y el estilo se envían a Hugging Face. Usa información pública. Puede haber cola o límites de uso.</p>
      <div className="admin-actions"><button className="primary-btn" disabled={busy || !content.trim() || prompt.trim().length < 3}>GENERAR CON IA ↗</button><button type="button" className="outline-btn" disabled={busy || !content.trim()} onClick={() => { void generate(false) }}>CREAR QR CLÁSICO</button></div>
    </form>
    {busy && <div className="qr-art-progress" role="status"><span>Preparando tu QR… La versión con IA puede tardar hasta dos minutos.</span><button type="button" className="outline-btn" onClick={() => active.current?.abort()}>CANCELAR</button></div>}
    {error && <p className="account-error" role="alert">{error}</p>}
    {result && <figure className="qr-art-result"><img src={result.image} alt={`QR ${result.kind === 'art' ? 'artístico' : 'clásico'} de ${result.content}`} width={768} height={768}/><figcaption><strong>{result.kind === 'art' ? 'DISEÑO IA · LECTURA VERIFICADA' : 'QR CLÁSICO'}</strong><span>{result.content}</span><a href={result.image} download={`danz-qr-${result.kind}.png`} className="primary-btn external-btn">DESCARGAR PNG ↗</a></figcaption></figure>}
  </section>
}
