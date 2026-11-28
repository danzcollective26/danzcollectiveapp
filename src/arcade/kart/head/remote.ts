export type HeadInvoke = (name: string, body: unknown) => Promise<{ data: unknown; error: unknown }>

export function caricatureFromPayload(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const image = (data as { available?: unknown; image?: unknown }).image
  const available = (data as { available?: unknown }).available
  return available === true && typeof image === 'string' && image.startsWith('data:image/') ? image : null
}

/** Null means the on-device balloon stays. Photos are not kept by this function. */
export async function requestCaricature(invoke: HeadInvoke, images: string[]): Promise<string | null> {
  if (!images.length || images.length > 3) return null
  try {
    const result = await invoke('generate-kart-head', { images })
    if (result.error) return null
    return caricatureFromPayload(result.data)
  } catch { return null }
}

export async function remoteHeadReady(invoke: HeadInvoke): Promise<boolean> {
  try {
    const result = await invoke('generate-kart-head', { probe: true })
    return !result.error && !!result.data && (result.data as { available?: boolean }).available === true
  } catch { return false }
}
