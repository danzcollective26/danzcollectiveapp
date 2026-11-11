import { createRoot } from 'react-dom/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/types/database'
import AdminPanel from '../../src/admin/AdminPanel'
import '../../src/index.css'
import '../../src/App.css'

// Visual QA only: synthetic artwork and an in-memory client. No real session or API.
// Vite does not include this entry or these fixtures in the production build.
const origin = window.location.origin
const events = [{ id: 'qa-album', title: 'Álbum de prueba visual', status: 'published', starts_at: null, ends_at: null }, { id: 'qa-empty', title: 'Otro álbum de prueba', status: 'published', starts_at: null, ends_at: null }]
const rows = [1, 2, 3].map(n => ({ id: `qa-${n}`, event_id: 'qa-album', storage_path: `sample-${n}.svg`, preview_path: `sample-${n}.svg`, original_name: `prueba-${n}.svg`, status: n === 3 ? 'published' : 'draft', upload_ready: true }))
const client = {
  auth: { mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: 'aal2' }, error: null }) } },
  rpc(name: string, args?: Record<string, unknown>) {
    if (name === 'danz_photo_state') rows.forEach(p => { if ((args?.p_ids as string[]).includes(p.id)) p.status = String(args?.p_status) })
    const result = { data: name === 'danz_admin_events' ? events : name === 'danz_admin_photos' ? rows.filter(p => p.event_id === args?.p_event_id) : name === 'danz_gallery_usage' ? [{ used_bytes: 140000, limit_bytes: 900000000, photo_count: 3 }] : name === 'danz_photo_state' ? (args?.p_ids as string[]).length : [], error: null }
    return { abortSignal: async () => result, then: (resolve: (value: unknown) => void) => resolve(result) }
  },
  storage: { from: () => ({
    getPublicUrl: (path: string) => ({ data: { publicUrl: `${origin}/tests/ui/object/public/danz-event-photos/${path}` } }),
    createSignedUrls: async (paths: string[]) => ({ data: paths.map(path => ({ path, signedUrl: `${origin}/tests/ui/object/sign/danz-event-photos/${path}?token=synthetic-local-qa` })), error: null }),
  }) },
} as unknown as SupabaseClient<Database>
createRoot(document.getElementById('root')!).render(<div className="site-shell"><div className="content"><p style={{ paddingTop: 24, color: 'var(--acid)', fontSize: 12 }}>PRUEBA VISUAL · SIN DATOS NI FOTOS REALES</p><AdminPanel client={client} userId="qa-owner" authLoading={false} access={{ loading: false, member: true, permissions: ['events.manage'], error: false }} setup={{ current: null }} onSignIn={() => {}} albumsOnly /></div></div>)
