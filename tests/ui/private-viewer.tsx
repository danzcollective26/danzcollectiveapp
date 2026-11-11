import { createRoot } from 'react-dom/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/types/database'
import PrivateGallery from '../../src/cloud/PrivateGallery'
import '../../src/index.css'
import '../../src/App.css'

// Isolated visual QA. No session, real account, API request or private image.
// This entry is not included in Vite's production index or deployment archive.
const origin = window.location.origin
const waiting = new URLSearchParams(window.location.search).has('espera')
const client = {
  from(table: string) {
    const query = {
      select: () => query, in: () => query, eq: () => query, order: () => query, range: () => query,
      abortSignal: async () => ({ data: table === 'danz_events'
        ? [{ id: 'local-qa', title: 'Visor de prueba · Sin fotos reales', starts_at: null }]
        : waiting ? [] : [1, 2, 3].map(n => ({ id: `local-${n}`, storage_path: `sample-${n}.svg`, preview_path: `sample-${n}.svg`, original_name: `prueba-${n}.svg` })), error: null }),
    }
    return query
  },
  storage: { from: () => ({
    getPublicUrl: (path: string) => ({ data: { publicUrl: `${origin}/tests/ui/object/public/danz-event-photos/${path}` } }),
    createSignedUrls: async (paths: string[], _ttl?: number, options?: { download?: string | boolean }) => ({ data: paths.map(path => ({ path, signedUrl: `${origin}/tests/ui/object/sign/danz-event-photos/${path}?token=synthetic-local-qa${options?.download ? `&download=${encodeURIComponent(String(options.download))}` : ''}` })), error: null }),
  }) },
} as unknown as SupabaseClient<Database>
createRoot(document.getElementById('root')!).render(<div className="site-shell"><p className="content" style={{ paddingTop: 30, color: 'var(--acid)', fontSize: 12 }}>PRUEBA LOCAL DEL VISOR · SIN DATOS NI FOTOS REALES</p><PrivateGallery client={client} userId="synthetic-local-qa" authLoading={false} onSignIn={() => {}} /></div>)
