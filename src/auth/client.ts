import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { clientConfiguration, consumeCallbackError } from './config'

const env = (import.meta as ImportMeta & { env: Record<string, string | boolean | undefined> }).env
const checked = clientConfiguration(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, Boolean(env.DEV))
export const configIssue = checked.issue

const callback = consumeCallbackError(window.location.href)
export const authCallbackIssue = callback.message
if (callback.url !== window.location.href) window.history.replaceState(window.history.state, '', callback.url)

// This singleton belongs to this browser tab; it contains only a publishable key.
export const supabase: SupabaseClient<Database> | null = checked.config
  ? createClient<Database>(checked.config.url, checked.config.key, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  })
  : null
