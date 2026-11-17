import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../auth/client'
import { drawSnapshot, stylizeBlob, blobToDataUrl } from './capture'
import { uploadGeneratedHead } from './cloud'
import { remoteHeadReady, requestCaricature, type HeadInvoke } from './remote'
import { saveHead, type StoredHead } from './store'
import './head.css'

const SIDES = [
  { title: 'DE FRENTE', hint: 'Centra tu cara en el óvalo. Esta foto es la que manda.' },
  { title: 'UN LADO', hint: 'Gira un poco la cara. Si no quieres, se salta.' },
  { title: 'EL OTRO LADO', hint: 'El cierre del escaneo. También se puede saltar.' },
] as const

type Shot = { blob: Blob; url: string }

async function invoke(name: string, body: unknown) {
  if (!supabase) return { data: null, error: new Error('sin estudio') }
  const result = await supabase.functions.invoke(name, { body: body as Record<string, unknown> })
  return { data: result.data, error: result.error }
}

export default function HeadStudio({ onClose, onSaved }: { onClose: () => void; onSaved: (head: StoredHead) => void }) {
  const [step, setStep] = useState<'consent' | 'capture' | 'generating' | 'reveal'>('consent')
  const [accepted, setAccepted] = useState(false)
  const [side, setSide] = useState(0)
  const [shots, setShots] = useState<(Shot | null)[]>([null, null, null])
  const [cameraOn, setCameraOn] = useState(false)
  const [result, setResult] = useState('')
  const [name, setName] = useState('MI CABEZÓN')
  const [cloud, setCloud] = useState(false)
  const [canCloud, setCanCloud] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const shotsRef = useRef(shots)
  const alive = useRef(true)
  shotsRef.current = shots
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => () => { shotsRef.current.forEach(shot => { if (shot) URL.revokeObjectURL(shot.url) }) }, [])
  useEffect(() => {
    if (step !== 'capture') return
    let stream: MediaStream | null = null
    let gone = false
    const stop = () => { stream?.getTracks().forEach(track => track.stop()); stream = null }
    const video = videoRef.current
    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('sin cámara')
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } } })
        if (gone) { stop(); return }
        if (video) { video.srcObject = stream; await video.play().catch(() => undefined) }
        if (!gone) setCameraOn(true)
      } catch { if (!gone) setCameraOn(false) }
    })()
    const hidden = () => { if (document.hidden) { stop(); setCameraOn(false) } }
    document.addEventListener('visibilitychange', hidden)
    return () => { gone = true; document.removeEventListener('visibilitychange', hidden); stop(); setCameraOn(false) }
  }, [step])

  function keep(index: number, blob: Blob) {
    const url = URL.createObjectURL(blob)
    setShots(current => {
      const next = [...current]
      if (next[index]) URL.revokeObjectURL(next[index].url)
      next[index] = { blob, url }
      return next
    })
    setError('')
  }
  async function shoot() {
    const video = videoRef.current
    if (!video || video.readyState < 2) { setError('La cámara todavía no está lista.'); return }
    keep(side, await drawSnapshot(video, video.videoWidth || 640, video.videoHeight || 800, true))
    if (side < 2) setSide(side + 1)
  }
  async function upload(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) { setError('Ese archivo no es una foto.'); return }
    const bitmap = await createImageBitmap(file)
    try { keep(side, await drawSnapshot(bitmap, bitmap.width, bitmap.height)); if (side < 2) setSide(side + 1) }
    catch { setError('No se ha podido leer la foto.') }
    finally { bitmap.close() }
  }
  function dropShots() {
    setShots(current => { current.forEach(shot => { if (shot) URL.revokeObjectURL(shot.url) }); return [null, null, null] })
  }
  async function inflate() {
    const front = shots[0]
    if (!front) { setError('Hace falta la foto de frente.'); setSide(0); return }
    const taken = shots.filter((shot): shot is Shot => shot !== null)
    setStep('generating'); setError(''); setBusy(true)
    const started = performance.now()
    try {
      const call = invoke as HeadInvoke
      const urls = Promise.all(taken.map(shot => blobToDataUrl(shot.blob)))
      const local = stylizeBlob(front.blob)
      const remote = (async () => {
        if (!supabase || !await remoteHeadReady(call)) return null
        return requestCaricature(call, await urls)
      })()
      const [png, ai] = await Promise.all([local, remote])
      const wait = reduced ? 0 : 1100 - (performance.now() - started)
      if (wait > 0) await new Promise(resolve => window.setTimeout(resolve, wait))
      if (!alive.current) { taken.forEach(shot => URL.revokeObjectURL(shot.url)); return }
      dropShots()
      setResult(ai ?? png)
      if (supabase) {
        const session = await supabase.auth.getSession()
        const user = session.data.session?.user
        setCanCloud(Boolean(user && !user.is_anonymous))
      }
      setStep('reveal')
    } catch { dropShots(); setError('No ha salido el dibujo. Prueba con otra foto.'); setStep('capture') }
    finally { setBusy(false) }
  }
  async function save() {
    setBusy(true); setError('')
    try {
      const id = crypto.randomUUID()
      let head = await saveHead({ id, name, png: result })
      if (cloud && supabase) {
        const path = await uploadGeneratedHead(supabase, head)
        if (path) head = await saveHead({ ...head, cloudPath: path })
        else setError('El dibujo se queda en este dispositivo. La cuenta no lo ha guardado.')
      }
      onSaved(head)
    } catch { setError('No se ha podido guardar el cabezón.') }
    finally { setBusy(false) }
  }

  const guide = SIDES[side]
  return <section className="cabezon-studio" aria-label="Crea tu cabezón">
    {step === 'consent' && <>
      <h2>TU CARA, UN MOMENTO</h2>
      <p>Hacemos el cabezón con una, dos o tres fotos y las tiramos al momento. No guardamos la foto. Solo se queda el dibujo, en este dispositivo. No subas a nadie más: tiene que ser tu cara.</p>
      <label className="cabezon-consent"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)}/>Entiendo: las fotos se usan y se descartan. Puedo borrar el personaje cuando quiera.</label>
      <div className="cabezon-actions"><button type="button" onClick={onClose}>AHORA NO</button><button type="button" className="cabezon-primary" disabled={!accepted} onClick={() => setStep('capture')}>SIGO YO</button></div>
    </>}
    {step === 'capture' && <>
      <h2>{guide.title}</h2>
      <div className="cabezon-pips" role="group" aria-label="Lados del escaneo">{SIDES.map((item, index) => <button key={item.title} type="button" aria-pressed={side === index} onClick={() => setSide(index)}>{index === 0 ? 'FRENTE' : index === 1 ? 'LADO' : 'OTRO'}{shots[index] ? ' · LISTA' : ''}</button>)}</div>
      <div className="cabezon-frame"><video ref={videoRef} autoPlay muted playsInline aria-hidden="true" style={{ visibility: cameraOn ? 'visible' : 'hidden' }}/><svg className="cabezon-guide" viewBox="0 0 100 130" aria-hidden="true"><ellipse cx="50" cy="58" rx="28" ry="36" fill="none" stroke="#d9fa69" strokeWidth="1.4" strokeDasharray="3 2"/></svg><p>{cameraOn ? guide.hint : 'Sin cámara en este aparato. Puedes subir la foto.'}</p></div>
      <div className="cabezon-thumbs">{shots.map((shot, index) => shot ? <img key={shot.url} src={shot.url} alt="" width={54} height={54}/> : <span key={index}/>)}</div>
      <div className="cabezon-actions">
        <button type="button" className="cabezon-primary" disabled={!cameraOn} onClick={() => void shoot()}>DISPARAR</button>
        <label className="cabezon-upload">SUBIR UNA FOTO<input type="file" accept="image/*" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void upload(file) }}/></label>
      </div>
      <div className="cabezon-actions">
        {side > 0 && <button type="button" onClick={() => setSide(side - 1)}>LADO ANTERIOR</button>}
        {side > 0 && <button type="button" onClick={() => side < 2 ? setSide(side + 1) : void inflate()}>SALTAR ESTE LADO</button>}
        <button type="button" disabled={!shots[0] || busy} onClick={() => void inflate()}>INFLAR CABEZÓN</button>
        <button type="button" onClick={onClose}>CERRAR</button>
      </div>
    </>}
    {step === 'generating' && <div role="status"><h2>{reduced ? 'DIBUJANDO TU CABEZÓN' : 'INFLANDO…'}</h2><p>Las fotos se quedan en esta pantalla un momento y luego desaparecen.</p><div className={reduced ? 'cabezon-balloon' : 'cabezon-balloon cabezon-inflate'} aria-hidden="true"/></div>}
    {step === 'reveal' && <>
      <h2>ESTE ERES TÚ, EN GRANDE</h2>
      <img className="cabezon-balloon" src={result} alt="Tu cabezón generado" width={220} height={220}/>
      <label className="cabezon-name">NOMBRE DEL PILOTO<input value={name} maxLength={24} onChange={event => setName(event.target.value)}/></label>
      {canCloud && <label className="cabezon-consent"><input type="checkbox" checked={cloud} onChange={event => setCloud(event.target.checked)}/>Guardar también el dibujo en mi cuenta. La foto no se sube.</label>}
      <div className="cabezon-actions"><button type="button" onClick={() => { setResult(''); setSide(0); setStep('capture') }}>OTRA VEZ</button><button type="button" className="cabezon-primary" disabled={busy || !result} onClick={() => void save()}>GUARDAR Y CORRER</button></div>
    </>}
    {error && <p role="alert">{error}</p>}
  </section>
}
