import { createRoot } from 'react-dom/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/types/database'
import QrArtStudio from '../../src/admin/QrArtStudio'
import '../../src/index.css'
import '../../src/App.css'
import '../../src/auth/Account.css'
import '../../src/admin/AdminPanel.css'

// Visual fixture only; no real account and no production auth bypass.
const client = { auth: { getSession: async () => ({ data: { session: null }, error: null }) } } as unknown as SupabaseClient<Database>
createRoot(document.getElementById('root')!).render(<main className="content inner-page" style={{ maxWidth: 880, margin: 'auto' }}><p>PRUEBA VISUAL · DATOS SINTÉTICOS</p><QrArtStudio client={client}/></main>)
