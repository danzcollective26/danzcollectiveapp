import { createClient } from 'npm:@supabase/supabase-js@2.119.0'
import { MUSIC_BUCKET, musicPlaybackHandler } from './handler.ts'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})
Deno.serve(musicPlaybackHandler({
  verify: async token => {
    const { data, error } = await admin.auth.getUser(token)
    return error || !data.user ? null : { id: data.user.id, anonymous: data.user.is_anonymous === true }
  },
  sign: async (path, seconds) => {
    const { data, error } = await admin.storage.from(MUSIC_BUCKET).createSignedUrl(path, seconds)
    return error ? null : data?.signedUrl ?? null
  },
}))
