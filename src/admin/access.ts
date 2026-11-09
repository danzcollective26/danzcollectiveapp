import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

export type AdminAccess = { member: boolean; permissions: string[]; loading: boolean; error: boolean }
export function useAdminAccess(client: SupabaseClient<Database> | null, userId: string | null, authLoading: boolean): AdminAccess {
  const [state, setState] = useState<{ owner: string | null; client: typeof client; member: boolean; permissions: string[]; loading: boolean; error: boolean }>({ owner: null, client: null, member: false, permissions: [], loading: true, error: false })
  useEffect(() => {
    if (!client || !userId || authLoading) return
    const abort = new AbortController()
    let current = true
    setState({ owner: userId, client, member: false, permissions: [], loading: true, error: false })
    void (async () => {
      try {
        const { data, error } = await client.rpc('danz_admin_context').abortSignal(abort.signal)
        if (error) throw error
        if (current) setState({ owner: userId, client, member: data?.[0]?.is_admin === true, permissions: data?.[0]?.permissions ?? [], loading: false, error: false })
      } catch { if (current) setState({ owner: userId, client, member: false, permissions: [], loading: false, error: true }) }
    })()
    return () => { current = false; abort.abort() }
  }, [client, userId, authLoading])
  if (!client || !userId) return { member: false, permissions: [], loading: authLoading, error: false }
  if (authLoading || state.owner !== userId || state.client !== client) return { member: false, permissions: [], loading: true, error: false }
  return state
}

export function localDateTime(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.valueOf())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 15) | 64
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}
export async function createCodeMaterial() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const code = Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('').toUpperCase()
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
  const hash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('')
  return { id: newId(), code, hash }
}
