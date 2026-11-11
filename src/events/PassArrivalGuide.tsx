import { useEffect, useState } from 'react'
import DanzFlower from '../content/DanzFlower'
import { passReminder, tomorrowEvening } from './reminder'

function GuideIcon({ kind }: { kind: 'saved' | 'account' | 'photos' }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'saved' ? <><rect x="17" y="5" width="30" height="54" rx="5" /><path d="M27 11h10M28 52h8m-12-21 6 6 13-14" /></> : kind === 'account' ? <><rect x="7" y="11" width="50" height="43" rx="5" /><circle cx="27" cy="26" r="7" /><path d="M15 45c2-11 22-11 24 0m7-20v12m-6-6h12" /></> : <><rect x="7" y="14" width="50" height="38" rx="4" /><path d="m8 44 15-15 12 12 8-8 13 13" /><circle cx="43" cy="25" r="4" /></>}
  </svg>
}

export default function PassArrivalGuide({ code }: { code: string }) {
  const [open, setOpen] = useState(false)
  const [start] = useState(tomorrowEvening)
  const [download, setDownload] = useState('')
  const reminder = passReminder(code, window.location.origin, start)
  useEffect(() => {
    if (!open) return
    const { ics } = passReminder(code, window.location.origin, start)
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    setDownload(url)
    return () => { URL.revokeObjectURL(url); setDownload('') }
  }, [code, open, start])
  return <>
    <section className="pass-visual-guide" aria-labelledby="pass-guide-title">
      <div className="pass-guide-heading"><h2 id="pass-guide-title">Hoy baila. Mañana, así de fácil.</h2><DanzFlower /></div>
      <ol>
        <li><span className="pass-guide-art" data-tone="pink"><GuideIcon kind="saved" /><b>1</b></span><div><strong>Pase guardado.</strong><p>Ya está en este móvil. Sigue con tu noche.</p></div></li>
        <li><span className="pass-guide-art" data-tone="blue"><GuideIcon kind="account" /><b>2</b></span><div><strong>Mañana, entra en DANZ.</strong><p>Pulsa «Canjear mi pase» y entra con Google o tu correo.</p></div></li>
        <li><span className="pass-guide-art" data-tone="lime"><GuideIcon kind="photos" /><b>3</b></span><div><strong>Tu sello, para ti.</strong><p>Se añade solo. Las fotos estarán aquí cuando se publiquen.</p></div></li>
      </ol>
    </section>
    <div className="pass-reminder">
      <button type="button" className="outline-btn" aria-expanded={open} aria-controls="pass-reminder-options" onClick={() => setOpen(value => !value)}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Zm5 3h4M12 2v2" /></svg> RECUÉRDAMELO MAÑANA</button>
      {open && <section id="pass-reminder-options" aria-label="Guardar recordatorio" className="pass-reminder-options">
        <h3>Que mañana no se te pase.</h3>
        <p>Mañana a las {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}, en tu calendario.</p>
        <a className="outline-btn" href={reminder.google} target="_blank" rel="noopener noreferrer">GOOGLE CALENDAR ↗</a>
        {download && <a className="outline-btn" href={download} download="DANZ-recordatorio.ics">IPHONE U OTRO CALENDARIO ↓</a>}
        <p className="passport-receipt-note">Termina pulsando «Guardar» o «Añadir» en tu calendario y revisa que tenga un aviso. Descargar el archivo no activa el recordatorio por sí solo.</p>
      </section>}
    </div>
  </>
}
