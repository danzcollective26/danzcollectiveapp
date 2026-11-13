import { useEffect, useRef, useState } from 'react'
import { prepareOffline, type OfflinePreparation } from './offline'
import './PwaControls.css'

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
const production = Boolean((import.meta as ImportMeta & { env: { PROD?: boolean } }).env.PROD)
const isPreviewHost = () => window.location.hostname.endsWith('.vercel.app') && window.location.hostname !== 'danzcollectiveapp.vercel.app'
const productionUrl = 'https://danzcollectiveapp.vercel.app/'
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export default function PwaControls({ quiet = false }: { quiet?: boolean }) {
  const [online, setOnline] = useState(navigator.onLine)
  const [installed, setInstalled] = useState(standalone)
  const [canInstall, setCanInstall] = useState(false)
  const [offlineState, setOfflineState] = useState<OfflinePreparation | 'idle' | 'unsupported'>('idle')
  const [offlineAttempt, setOfflineAttempt] = useState(0)
  const [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null)
  const [open, setOpen] = useState<'install' | 'update' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const prompt = useRef<InstallPrompt | null>(null)
  const requestedUpdate = useRef(false)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const connection = () => setOnline(navigator.onLine)
    const beforeInstall = (event: Event) => { event.preventDefault(); prompt.current = event as InstallPrompt; setCanInstall(true) }
    const onInstalled = () => { prompt.current = null; setCanInstall(false); setInstalled(true); setOpen(null) }
    const display = window.matchMedia('(display-mode: standalone)')
    const onDisplay = () => setInstalled(standalone())
    window.addEventListener('online', connection); window.addEventListener('offline', connection)
    window.addEventListener('beforeinstallprompt', beforeInstall); window.addEventListener('appinstalled', onInstalled)
    display.addEventListener('change', onDisplay)
    return () => {
      window.removeEventListener('online', connection); window.removeEventListener('offline', connection)
      window.removeEventListener('beforeinstallprompt', beforeInstall); window.removeEventListener('appinstalled', onInstalled)
      display.removeEventListener('change', onDisplay)
    }
  }, [])

  useEffect(() => {
    if (!production) return
    if (!('serviceWorker' in navigator) || !window.isSecureContext) { setOfflineState('unsupported'); return }
    try {
      const container = navigator.serviceWorker
      const activate = () => { if (requestedUpdate.current) window.location.reload() }
      const stop = prepareOffline(container, { onState: setOfflineState, onUpdate: setUpdate })
      container.addEventListener('controllerchange', activate)
      return () => { stop(); container.removeEventListener('controllerchange', activate) }
    } catch { setOfflineState('unavailable') }
  }, [offlineAttempt])

  useEffect(() => {
    if (offlineState !== 'unavailable') return
    const retry = () => setOfflineAttempt(attempt => attempt + 1)
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [offlineState])

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal()
    if (!open && dialog.current?.open) dialog.current.close()
  }, [open])

  const install = async () => {
    setError('')
    if (isPreviewHost()) { window.location.assign(productionUrl); return }
    const pending = prompt.current
    if (!pending) { setOpen('install'); return }
    setBusy(true)
    try {
      await pending.prompt()
      await pending.userChoice
      // Only appinstalled or standalone display confirms installation.
      prompt.current = null; setCanInstall(false)
    } catch { setError('Abre las instrucciones para instalar DANZ desde el menú de tu navegador.'); setOpen('install') }
    finally { setBusy(false) }
  }
  return <aside className={`content pwa-tools${quiet ? ' pwa-quiet' : ''}`} aria-label="DANZ en tu móvil">
    {!online && <p className="pwa-offline" role="status">Sin conexión. {offlineState === 'ready' ? 'Snake y los álbumes guardados en este navegador siguen disponibles.' : 'Puedes seguir jugando a Snake si ya lo tienes abierto.'} Las cuentas y las galerías privadas necesitan Internet.</p>}
    {!quiet && <div className="pwa-actions">
      {offlineState === 'preparing' && <span role="status">Preparando Snake sin conexión…</span>}
      {offlineState === 'ready' && <span>Snake disponible sin conexión</span>}
      {(offlineState === 'unavailable' || offlineState === 'unsupported') && <div className="pwa-save-status">
        <span role="status">{offlineState === 'unsupported' ? 'Este navegador no permite guardar DANZ sin conexión.' : 'El modo sin conexión aún no está listo. Puedes seguir usando DANZ con Internet.'}</span>
        {offlineState === 'unavailable' && <button className="outline-btn" disabled={!online} onClick={() => setOfflineAttempt(attempt => attempt + 1)}>REINTENTAR GUARDADO</button>}
      </div>}
      {!installed && (isPreviewHost()
        ? <a className="outline-btn" href={productionUrl}>ABRIR DANZ PARA INSTALAR ↗</a>
        : <button className="outline-btn" disabled={busy} title={canInstall ? "Instalar directamente en el móvil" : "Abrir opciones de instalación"} onClick={() => { void install() }}>INSTALAR DANZ</button>)}
      {update && <button className="outline-btn" onClick={() => setOpen('update')}>VERSIÓN NUEVA DISPONIBLE</button>}
    </div>}
    <dialog className="pwa-dialog" ref={dialog} aria-labelledby="pwa-dialog-title" onCancel={() => setOpen(null)} onClose={() => setOpen(null)}>
      <h2 id="pwa-dialog-title">{open === 'update' ? 'Actualiza cuando estés listo.' : 'DANZ en tu pantalla de inicio.'}</h2>
      {open === 'update' ? <><p>La aplicación se recargará. Termina las cargas de fotos y guarda tus cambios antes de continuar.</p><button className="primary-btn" onClick={() => {
        if (!update?.waiting) { setOpen(null); return }
        requestedUpdate.current = true
        update.waiting.postMessage({ type: 'DANZ_ACTIVATE_UPDATE' })
      }}>ACTUALIZAR Y RECARGAR</button></> : <>
        <p>Si Chrome muestra «Esta aplicación no se puede instalar», comprueba que estás en <a href={productionUrl}>danzcollectiveapp.vercel.app</a>, no en una dirección de prueba. Espera a que termine de cargar y vuelve a abrirla desde Chrome.</p>
        <p><strong>Android:</strong> abre esta página en Chrome. Pulsa el menú ⋮ y busca «Instalar y crear acceso directo» o «Añadir a pantalla de inicio». Confirma la instalación.</p>
        <p><strong>iPhone:</strong> abre esta página en Safari. Pulsa Compartir → Añadir a pantalla de inicio y confirma Añadir. Activa «Abrir como app web» si aparece.</p>
        <p>Si estás dentro de la app de correo o de ChatGPT, abre primero el enlace en Chrome o Safari.</p>
        <p>Para volver a abrir Snake sin Internet, espera a ver «Snake disponible sin conexión» antes de cerrar la app. Las fotos privadas necesitan conexión.</p>
        <p>DANZ abre sin una cuenta de ChatGPT. Para tus fotos privadas, vincula el pase del evento a tu cuenta DANZ.</p>
      </>}
      {error && <p role="alert">{error}</p>}
      <button className="outline-btn" onClick={() => setOpen(null)}>CERRAR</button>
    </dialog>
  </aside>
}
