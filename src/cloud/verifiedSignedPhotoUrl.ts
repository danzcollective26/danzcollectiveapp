import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
/** Check a private Supabase signed link against our configured origin and bucket. */
export function verifiedSignedPhotoUrl(client: SupabaseClient<Database>, value: string | null): string | null {
  if (!value) return null
  try {
    const configured = new URL(client.storage.from('danz-event-photos').getPublicUrl('__origin_check__').data.publicUrl)
    const signed = new URL(value)
    const expectedPath = configured.pathname.replace('/object/public/', '/object/sign/').replace('__origin_check__', '')
    return signed.origin === configured.origin && signed.pathname.startsWith(expectedPath) && signed.searchParams.has('token')
      ? signed.href : null
  } catch { return null }
}
