import { useEffect, useState } from 'react'
import DanzFlower from '../content/DanzFlower'
import './MobileBottomNav.css'

export type DanzSection = 'inicio' | 'pasaporte' | 'fotos' | 'arcade' | 'danzers' | 'danzin' | 'danzflor' | 'danzpoints' | 'cuenta' | 'admin'

type Props = {
  page: DanzSection
  navigate: (page: DanzSection) => void
  adminAvailable: boolean
}

type MainTab = 'inicio' | 'fotos' | 'arcade' | 'danzers'
const TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'inicio', label: 'INICIO', icon: 'home' },
  { id: 'fotos', label: 'FOTOS', icon: 'photos' },
  { id: 'arcade', label: 'ARCADANZ', icon: 'arcade' },
  { id: 'danzers', label: 'EVENTOS', icon: 'ticket' },
]

function NavIcon({ name }: { name: string }) {
  const base = { viewBox: '0 0 24 24', width: 24, height: 24, stroke: 'currentColor', strokeWidth: 1.75, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  if (name === 'home') return <svg {...base}><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>
  if (name === 'photos') return <svg {...base}><rect x="3" y="5" width="16" height="15" rx="2"/><path d="M8 5V3h12a2 2 0 0 1 2 2v12h-3M3 16l5-5 4 4 2-2 5 5"/><circle cx="14" cy="9" r="1"/></svg>
  if (name === 'arcade') return <svg {...base}><path d="M7.5 8h9a5 5 0 0 1 4.8 3.6l1.1 5.1a2.6 2.6 0 0 1-4 2.7l-3-2.4h-6l-3 2.4a2.6 2.6 0 0 1-4-2.7l1.1-5.1A5 5 0 0 1 7.5 8Z"/><path d="M8 11v5m-2.5-2.5h5M16.5 12h.01m2 2h.01"/></svg>
  return <svg {...base}><path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a3 3 0 0 0 0-6Z"/><path d="M13 4v3m0 3v4m0 3v3" strokeDasharray="2 2"/></svg>
}

const MORE_ITEMS: {id: DanzSection; title: string; subtitle: string}[] = [
  {id: 'pasaporte', title:'MI PASAPORTE', subtitle:'Wallet, sellos y galerías'},
  {id: 'danzpoints', title:'DANZPOINTS', subtitle:'Puntos y recompensas'},
  {id: 'danzin', title:'DANZ IN', subtitle:'DJs y música'},
  {id: 'danzflor', title:'DANZFLOR', subtitle:'Moda y colecciones'},
  {id: 'cuenta', title:'MI CUENTA', subtitle:'Perfil y preferencias'},
]

export default function MobileBottomNav({ page, navigate, adminAvailable }: Props) {
  const [moreOpen, setMoreOpen] = useState(false)
  useEffect(() => setMoreOpen(false), [page])
  useEffect(() => {
    if (!moreOpen) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMoreOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [moreOpen])
  const inMore = moreOpen || (!TABS.some(tab => tab.id === page) && page !== 'inicio')
  const choose = (id: DanzSection) => { setMoreOpen(false); navigate(id) }
  return <>
    {moreOpen && <div className="danz-more-backdrop" onClick={() => setMoreOpen(false)} aria-hidden="true"/>}
    {moreOpen && <section id="danz-more-panel" className="danz-more-sheet" aria-label="Más secciones de DANZ">
      <div className="danz-more-sheet-top"><span>EXPLORA DANZ</span><button type="button" onClick={() => setMoreOpen(false)} aria-label="Cerrar menú">✕</button></div>
      <div className="danz-more-links">
        {[...MORE_ITEMS, ...(adminAvailable ? [{id: 'admin' as const, title: 'ADMINISTRACIÓN', subtitle: 'Gestión del colectivo'}] : [])].map(item =>
          <button type="button" key={item.id} onClick={() => choose(item.id)} aria-current={page === item.id ? 'page' : undefined}>
            <span><strong>{item.title}</strong><small>{item.subtitle}</small></span><span aria-hidden="true">↗</span>
          </button>
        )}
      </div>
    </section>}
    <nav className="danz-bottom-nav" aria-label="Navegación principal móvil">
      {TABS.map(tab => <button type="button" key={tab.id} className={page === tab.id ? 'is-active' : ''} onClick={() => choose(tab.id)} aria-current={page === tab.id ? 'page' : undefined}>
        <NavIcon name={tab.icon}/><span>{tab.label}</span>
      </button>)}
      <button type="button" className={inMore ? 'is-active' : ''} onClick={() => setMoreOpen(open => !open)} aria-expanded={moreOpen} aria-controls="danz-more-panel" aria-label="Más secciones">
        <DanzFlower className="danz-more-flower"/><span>MÁS</span>
      </button>
    </nav>
  </>
}
