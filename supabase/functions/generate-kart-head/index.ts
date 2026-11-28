import { createClient } from 'npm:@supabase/supabase-js@2.119.0'
import { kartHeadHandler, type HeadProvider } from './handler.ts'

const MAX_IMAGE = 1_400_000

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}
function base64ToBytes(value: string): Uint8Array | null {
  const payload = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value
  if (payload.length > MAX_IMAGE * 2) return null
  try {
    const binary = atob(payload.replace(/\s/g, ''))
    if (binary.length < 32 || binary.length > MAX_IMAGE) return null
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch { return null }
}

/**
 * Enabled only when both secrets exist. The URL is whatever HTTPS endpoint the
 * owner configures; this file does not choose a paid vendor.
 * Expected request: POST { prompt, images: base64[] } → { image: base64 }.
 */
function provider(): HeadProvider | null {
  const key = Deno.env.get('KART_HEAD_API_KEY')
  const url = Deno.env.get('KART_HEAD_API_URL')
  if (!key || !url || !/^https:\/\//.test(url)) return null
  return {
    async edit(images, prompt) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, images: images.map(bytesToBase64) }),
        signal: AbortSignal.timeout(25_000),
      })
      if (!response.ok) return null
      const body = await response.json() as { image?: unknown }
      return typeof body.image === 'string' ? base64ToBytes(body.image) : null
    },
  }
}

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

Deno.serve(kartHeadHandler({
  provider: provider(),
  verify: async token => {
    const { data, error } = await admin.auth.getUser(token)
    return error || !data.user ? null : { id: data.user.id, anonymous: data.user.is_anonymous === true }
  },
}))
