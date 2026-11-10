import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { clearPendingPass } from './pass'

export type PassRedemption = {
  busy: boolean
  message: string | null
  retry: () => void
  revision: number
}

type PendingOperation = {
  owner: string
  code: string
  abort: AbortController
  start?: ReturnType<typeof setTimeout>
  deadline?: ReturnType<typeof setTimeout>
  finished: boolean
}

/** Only a server-validated account can turn a locally saved QR into a stamp. */
export function usePendingPassRedemption(client: SupabaseClient<Database> | null, userId: string | null, authLoading: boolean, codes: string[]): PassRedemption {
  const [revision, setRevision] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [online, setOnline] = useState(navigator.onLine)
  const [state, setState] = useState({ owner: userId, busy: false, message: null as string | null })
  const tried = useRef({ owner: userId, codes: new Set<string>() })
  const operation = useRef<PendingOperation | null>(null)
  const scope = useRef({ client, userId, authLoading })
  scope.current = { client, userId, authLoading }
  const codeKey = codes.join(',')

  useEffect(() => {
    const changed = () => {
      setOnline(navigator.onLine)
      if (navigator.onLine) { tried.current.codes.clear(); setAttempt(value => value + 1) }
    }
    window.addEventListener('online', changed)
    window.addEventListener('offline', changed)
    return () => { window.removeEventListener('online', changed); window.removeEventListener('offline', changed) }
  }, [])

  // A new QR wakes the queue without cancelling the request already in flight.
  // Only a session, client or connection change owns that request's lifetime.
  useEffect(() => () => {
    const pending = operation.current
    if (!pending) return
    operation.current = null
    clearTimeout(pending.start)
    clearTimeout(pending.deadline)
    pending.abort.abort()
    if (!pending.finished && tried.current.owner === pending.owner) tried.current.codes.delete(pending.code)
  }, [client, userId, authLoading, online])

  useEffect(() => {
    if (tried.current.owner !== userId) tried.current = { owner: userId, codes: new Set() }
    if (!client || !userId || authLoading) return
    if (!online) {
      if (codeKey) setState({ owner: userId, busy: false, message: 'Tu pase sigue guardado. Lo vincularemos cuando vuelva la conexión.' })
      return
    }
    if (operation.current) return
    const code = codeKey.split(',').find(value => value && !tried.current.codes.has(value))
    if (!code) return
    const pending: PendingOperation = { owner: userId, code, abort: new AbortController(), finished: false }
    operation.current = pending
    const stillCurrent = () => operation.current === pending && scope.current.client === client && scope.current.userId === userId && !scope.current.authLoading
    // StrictMode cleanup cancels the scheduled task before any request is made.
    pending.start = setTimeout(() => {
      if (!stillCurrent()) return
      tried.current.codes.add(code)
      setState({ owner: userId, busy: true, message: 'Añadiendo tu pase al pasaporte…' })
      pending.deadline = setTimeout(() => pending.abort.abort(), 12_000)
      let advance = false
      void (async () => {
        try {
          const { data, error } = await client.rpc('danz_redeem_event_code', { p_code: code }).abortSignal(pending.abort.signal)
          if (!stillCurrent()) return
          if (error) throw error
          pending.finished = true
          const status = data?.[0]?.status
          if (status === 'granted' || status === 'already_attended') {
            setState({ owner: userId, busy: false, message: status === 'granted' ? '¡Sello guardado! Ya tienes acceso a la galería de este evento.' : 'Ya tienes este sello. Puedes abrir su galería desde tu pasaporte.' })
            setRevision(value => value + 1)
            clearPendingPass(code)
            advance = true
          } else if (status === 'rate_limited') {
            setState({ owner: userId, busy: false, message: 'Has hecho varios intentos seguidos. Espera diez minutos antes de volver a probar. Tu pase sigue guardado.' })
          } else {
            setState({ owner: userId, busy: false, message: 'Este código no está disponible. Revisa que sea correcto y que siga vigente. El pase se conserva.' })
            // An unavailable QR must not block other nights in the queue.
            advance = true
          }
        } catch {
          if (stillCurrent()) {
            pending.finished = true
            setState({ owner: userId, busy: false, message: 'No hemos podido confirmar el canje. Tu pase sigue guardado. Reintentaremos al recuperar la conexión; también puedes pulsar «Reintentar pases».' })
          }
        } finally {
          clearTimeout(pending.deadline)
          if (operation.current === pending) {
            operation.current = null
            if (advance) setAttempt(value => value + 1)
          }
        }
      })()
    }, 0)
  }, [client, userId, authLoading, codeKey, attempt, online])

  return {
    busy: !authLoading && state.owner === userId && state.busy,
    message: !authLoading && state.owner === userId ? state.message : null,
    retry: () => { if (!operation.current) { tried.current.codes.clear(); setAttempt(value => value + 1) } },
    revision,
  }
}
