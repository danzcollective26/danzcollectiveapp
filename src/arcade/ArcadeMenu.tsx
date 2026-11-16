import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { menuIndex } from './menuNavigation'
import { requestArcadeFullscreen } from './arcadeFullscreen'
import './arcadeMenu.css'

export type ArcadeMenuTab = { id: string; label: string }
export function MenuTabs({ label, tabs, value, onChange }: { label: string; tabs: readonly ArcadeMenuTab[]; value: string; onChange: (id: string) => void }) {
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  return <nav className="arcade-menu-tabs" aria-label={label}>{tabs.map((tab, i) => <button key={tab.id} ref={el => { if (el) buttons.current.set(tab.id, el); else buttons.current.delete(tab.id) }} type="button" aria-pressed={value === tab.id} onClick={() => onChange(tab.id)} onFocus={e => e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest' })} onKeyDown={e => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault(); const next = tabs[e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : menuIndex(i, step, tabs.length)]
    onChange(next.id); buttons.current.get(next.id)?.focus({ preventScroll: true })
  }}><i aria-hidden="true">›</i>{tab.label}</button>)}</nav>
}

export default function ArcadeMenu({ title, eyebrow = 'ARCADANZ', art, accent = '#d9fa69', tabs, page, onPage, onBack, backLabel = 'Volver a la biblioteca ARCADANZ', action, children, footer }: {
  title: string; eyebrow?: string; art: string; accent?: string; tabs: readonly ArcadeMenuTab[]; page: string; onPage: (id: string) => void; onBack: () => void; backLabel?: string;
  action?: { label: string; onClick: () => void; disabled?: boolean }; children: ReactNode; footer?: string
}) {
  const scroller = useRef<HTMLDivElement>(null), menu = useRef<HTMLElement>(null)
  useEffect(() => { const frame=requestAnimationFrame(()=>{if(menu.current&&!menu.current.contains(document.activeElement))menu.current.querySelector<HTMLButtonElement>('.arcade-menu-body>.arcade-menu-tabs button[aria-pressed=true]')?.focus({preventScroll:true})});return()=>cancelAnimationFrame(frame) },[])
  useEffect(() => {
    // Keep the active console page as the only interactive surface; restore
    // every sibling's previous state when starting play or returning.
    const saved: [HTMLElement, boolean][] = []
    let node: HTMLElement | null = menu.current
    while (node && node !== document.body) {
      const parent: HTMLElement | null = node.parentElement
      if (!parent) break
      for (const sibling of parent.children) if (sibling !== node && sibling instanceof HTMLElement) { saved.push([sibling, sibling.inert]); sibling.inert = true }
      node = parent
    }
    return () => { for (const [element, inert] of saved) element.inert = inert }
  }, [])
  useEffect(() => { scroller.current?.scrollTo({ top: 0, left: 0 }) }, [page])
  return <section ref={menu} role="dialog" aria-modal="true" className="arcade-console-menu" style={{ '--menu-art': `url("${art}")`, '--menu-accent': accent } as CSSProperties} aria-label={`Menú de ${title}`} data-menu-page={page} onKeyDown={e => { e.stopPropagation(); if(e.key==='Tab'){const nodes=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]')).filter(el=>el.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}} if (e.key === 'Escape') { e.preventDefault(); onBack() } }}>
    <header className="arcade-menu-header"><button type="button" className="arcade-menu-back" aria-label={backLabel} onClick={onBack}>←</button><div><small>{eyebrow}</small><h1>{title}</h1></div><button type="button" className="arcade-menu-fullscreen" aria-label="Pantalla completa" onClick={requestArcadeFullscreen}>⛶</button></header>
    <div className="arcade-menu-body"><MenuTabs label={`Secciones de ${title}`} tabs={tabs} value={page} onChange={onPage}/><div className="arcade-menu-page" ref={scroller}>{children}</div></div>
    <footer className="arcade-menu-footer">{footer && <small>{footer}</small>}{action && <button type="button" className="arcade-menu-start" disabled={action.disabled} onClick={action.onClick}>{action.label}<b aria-hidden="true">→</b></button>}</footer>
  </section>
}
