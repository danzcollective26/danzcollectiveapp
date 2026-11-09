import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { clientConfiguration, consumeCallbackError, consumeCompletedCallback, consumeEmailCallback } from './config'

const env = (import.meta as ImportMeta & { env: Record<string, string | boolean | undefined> }).env
const checked = clientConfiguration(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, Boolean(env.DEV))
export const configIssue = checked.issue

const callback = consumeCallbackError(window.location.href)
if (callback.url !== window.location.href) window.history.replaceState(window.history.state, '', callback.url)
const emailCallback = consumeEmailCallback(window.location.href)
export const emailCallbackPresent = emailCallback.present
export const authCallbackIssue = callback.message ?? emailCallback.issue
if (emailCallback.url !== window.location.href) window.history.replaceState(window.history.state, '', emailCallback.url)

// This singleton belongs to this browser tab; it contains only a publishable key.
export const supabase: SupabaseClient<Database> | null = checked.config
  ? createClient<Database>(checked.config.url, checked.config.key, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  })
  : null

let initialization: Promise<{ error: unknown }> | null = null
export function completeAuthInitialization(): Promise<{ error: unknown }> {
  initialization ??= (async () => {
    if (!supabase) return { error: null }
    const initialized = await supabase.auth.initialize()
    if (initialized.error) return { error: initialized.error }
    if (emailCallback.tokenHash) {
      const tokenHash = emailCallback.tokenHash
      emailCallback.tokenHash = null
      const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
      return { error: result.error }
    }
    if (emailCallback.issue) return { error: { code: 'invalid_email_callback' } }
    const finished = consumeCompletedCallback(window.location.href)
    if (finished.url !== window.location.href) window.history.replaceState(window.history.state, '', finished.url)
    return { error: finished.message ? { code: 'pkce_verifier_not_found' } : null }
  })()
  return initialization
}
