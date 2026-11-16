import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabaseOrigin } from '../auth/client'
import { cachedMusic, forgetMusicGrants, requestMusicGrant, type ProtectedMusicId } from './protectedMusic'

type Access = { track: ProtectedMusicId | undefined; owner: string | undefined; status: 'idle' | 'loading' | 'signin' | 'ready' | 'error'; src?: string }
export function useMusicAccess(track?: ProtectedMusicId) {
  const { client, user, loading } = useAuth()
  const [access, setAccess] = useState<Access>({ track, owner: undefined, status: 'idle' })
  const request = useRef<AbortController | null>(null)
  const owner = user?.id
  const prepare = useCallback(() => {
    request.current?.abort()
    if (!track) { setAccess({ track, owner, status: 'idle' }); return }
    if (loading) { setAccess({ track, owner, status: 'loading' }); return }
    if (!client || !owner || !supabaseOrigin) { setAccess({ track, owner, status: 'signin' }); return }
    const cached = cachedMusic(owner, track)
    if (cached) { setAccess({ track, owner, status: 'ready', src: cached }); return }
    const controller = new AbortController(); request.current = controller
    setAccess({ track, owner, status: 'loading' })
    void requestMusicGrant(client.functions.invoke.bind(client.functions), owner, track, supabaseOrigin, controller.signal)
      .then(src => { if (!controller.signal.aborted) setAccess({ track, owner, status: 'ready', src }) })
      .catch(() => { if (!controller.signal.aborted) setAccess({ track, owner, status: 'error' }) })
  }, [client, owner, loading, track])
  useEffect(() => {
    if (!owner) forgetMusicGrants()
    prepare()
    return () => { request.current?.abort() }
  }, [prepare, owner])
  const current = access.track === track && access.owner === owner ? access : { track, owner, status: loading ? 'loading' as const : owner ? 'loading' as const : 'signin' as const }
  return { ...current, owner, prepare, freshSource: () => owner && track ? cachedMusic(owner, track) : null }
}
