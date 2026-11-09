import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { supabase, authCallbackIssue, completeAuthInitialization } from './client'
import { authErrorMessage } from './config'

type AuthState = {
  client: SupabaseClient<Database> | null
  user: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  clearError: () => void
}
const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState<string | null>(authCallbackIssue)
  const generation = useRef(0)
  const sessionActivity = useRef(0)
  const initialCheck = useRef<Promise<{ error: unknown }> | null>(null)

  useEffect(() => {
    const client = supabase
    if (!client) return
    let mounted = true
    const pending = new Set<ReturnType<typeof setTimeout>>()
    const validate = async (version: number, checkInitialization: boolean) => {
      let timeout: ReturnType<typeof setTimeout> | undefined
      try {
        const result = await Promise.race([
          (async () => {
            if (checkInitialization) {
              // Share this outcome across StrictMode effects and INITIAL_SESSION
              // validations, so URL cleanup cannot erase a still-relevant warning.
              initialCheck.current ??= completeAuthInitialization()
              const initialized = await initialCheck.current
              if (initialized.error) throw initialized.error
            }
            return client.auth.getUser()
          })(),
          new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('timeout')), 15000) }),
        ])
        if (!mounted || generation.current !== version) return
        if (result.error) {
          setUser(null)
          if (result.error.name !== 'AuthSessionMissingError') setError(authErrorMessage(result.error))
        } else {
          setUser(result.data.user)
          setError(null)
        }
      } catch (reason) {
        if (mounted && generation.current === version) {
          setUser(null)
          setError(authErrorMessage(reason))
        }
      } finally {
        if (timeout) clearTimeout(timeout)
        if (mounted && generation.current === version) setLoading(false)
      }
    }
    const scheduleValidation = (checkInitialization = false) => {
      const version = ++generation.current
      setUser(null)
      setLoading(true)
      // Calling Auth methods inside onAuthStateChange can deadlock its session lock.
      const timer = setTimeout(() => { pending.delete(timer); void validate(version, checkInitialization) }, 0)
      pending.add(timer)
    }
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (session) sessionActivity.current += 1
      if (event === 'INITIAL_SESSION') { scheduleValidation(true); return }
      if (!session || event === 'SIGNED_OUT') {
        generation.current += 1
        setUser(null)
        setLoading(false)
        if (event === 'SIGNED_OUT') setError(null)
      } else scheduleValidation()
    })
    scheduleValidation(true)
    return () => {
      mounted = false
      generation.current += 1
      pending.forEach(clearTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (!supabase) return
    const activity = sessionActivity.current
    generation.current += 1
    // Hide private data immediately. Supabase scope=local also removes its stored
    // session before making the revocation request, including when that request fails.
    setUser(null)
    setLoading(true)
    setError(null)
    try {
      const { error: reason } = await supabase.auth.signOut({ scope: 'local' })
      if (reason) throw reason
      // Another tab may already have signed in while revocation was in flight.
      if (sessionActivity.current !== activity) return
      generation.current += 1
      setUser(null)
      setLoading(false)
      setError(null)
    } catch {
      if (sessionActivity.current !== activity) return
      // Presence is checked only to describe the local cleanup; it never grants
      // access or replaces getUser() validation. Do not resurrect previousUser.
      let localSessionMissing = false
      try {
        const local = await supabase.auth.getSession()
        localSessionMissing = !local.error && !local.data.session
      } catch { /* Keep the wording conservative if storage cannot be read. */ }
      if (sessionActivity.current !== activity) return
      const message = localSessionMissing
        ? 'Has salido de este navegador, pero no hemos podido confirmar el cierre en el servidor.'
        : 'No hemos podido confirmar el cierre de sesión. Comprueba la conexión y vuelve a intentarlo.'
      generation.current += 1
      setUser(null)
      setLoading(false)
      setError(message)
      throw new Error(message)
    }
  }

  return <AuthContext.Provider value={{ client: supabase, user, loading, error, signOut, clearError: () => setError(null) }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth requiere AuthProvider')
  return context
}
