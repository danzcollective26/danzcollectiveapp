import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../types/database'
import type { StoredHead } from './store.ts'

type HeadWrite = { upsert: (row: object) => Promise<{ error: { message?: string } | null }>; delete: () => { eq: (column: string, value: string) => Promise<{ error: { message?: string } | null }> } }

function table(client: SupabaseClient<Database>) {
  return (client as unknown as { from: (name: string) => HeadWrite }).from('kart_heads')
}

function pngBlob(dataUrl: string): Blob {
  const encoded = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const binary = atob(encoded)
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([buffer], { type: 'image/png' })
}

/** Optional account copy of the drawing. Source photos never reach this call. */
export async function uploadGeneratedHead(client: SupabaseClient<Database>, head: StoredHead): Promise<string | null> {
  const auth = await client.auth.getUser()
  const user = auth.data.user
  if (!user || user.is_anonymous) return null
  const path = `${user.id}/${head.id}.png`
  const row = await table(client).upsert({ id: head.id, user_id: user.id, name: head.name, storage_path: path })
  if (row.error) return null
  const uploaded = await client.storage.from('kart-heads').upload(path, pngBlob(head.png), { upsert: true, contentType: 'image/png', cacheControl: '3600' })
  if (uploaded.error) {
    await table(client).delete().eq('id', head.id)
    return null
  }
  return path
}

export async function deleteGeneratedHead(client: SupabaseClient<Database>, id: string, cloudPath: string): Promise<void> {
  await client.storage.from('kart-heads').remove([cloudPath])
  await table(client).delete().eq('id', id)
}
