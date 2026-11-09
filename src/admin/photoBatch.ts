import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { newId } from './access'

export const PHOTO_BUCKET = 'danz-event-photos'
export const BATCH_LIMIT = 600
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024
export const PREVIEW_MAX_BYTES = 1024 * 1024
export const mb = (bytes: number) => `${(bytes / 1_000_000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`

export function photoFileError(file: Pick<File, 'name' | 'type' | 'size'>): string | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Usa archivos JPG, PNG o WebP.'
  if (!file.size || file.size > MAX_PHOTO_BYTES) return 'Cada foto debe pesar entre 1 byte y 25 MB.'
  return null
}

export async function preparePreview(file: File): Promise<{ blob: Blob; hash: string }> {
  const invalid = photoFileError(file)
  if (invalid) throw new Error(invalid)
  const input = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', input)
  const hash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('')
  // Decode one image at a time. No 600-image canvas or full-size in-memory album.
  const image = await createImageBitmap(file)
  try {
    if (!image.width || !image.height || image.width * image.height > 60_000_000) throw new Error('La foto supera los 60 megapíxeles. Exporta una copia JPG para la galería.')
    const scale = Math.min(1, 960 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo preparar la vista previa.')
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('No se pudo preparar la vista previa.')), 'image/jpeg', 0.78))
    canvas.width = canvas.height = 1
    if (blob.size > PREVIEW_MAX_BYTES) throw new Error('La vista previa es demasiado grande.')
    return { blob, hash }
  } finally { image.close() }
}

// File-level retries preserve the reservation and never overwrite stored files.
// Re-selecting a batch after a reload deduplicates by its original SHA-256.
export async function uploadPhoto(client: SupabaseClient<Database>, eventId: string, file: File, current: () => boolean) {
  const { blob, hash } = await preparePreview(file)
  if (!current()) throw new Error('Carga detenida.')
  const { data, error } = await client.rpc('danz_prepare_photo', { p_event_id: eventId, p_id: newId(), p_name: file.name.slice(0, 180), p_size: file.size, p_preview_size: blob.size, p_mime: file.type, p_sha256: hash })
  if (error || !data?.[0]) throw error ?? new Error('No se pudo reservar espacio.')
  const slot = data[0]
  if (slot.upload_ready) return 'existing' as const
  for (const item of [{ exists: slot.original_exists, path: slot.storage_path, body: file, mime: file.type }, { exists: slot.preview_exists, path: slot.preview_path, body: blob, mime: 'image/jpeg' }]) {
    if (!current()) throw new Error('Carga detenida.')
    if (!item.exists) {
      const response = await client.storage.from(PHOTO_BUCKET).upload(item.path, item.body, { contentType: item.mime, upsert: false, cacheControl: '60' })
      if (response.error) throw response.error
    }
  }
  if (!current()) throw new Error('Carga detenida.')
  const result = await client.rpc('danz_finish_photo', { p_id: slot.id })
  if (result.error) throw result.error
  return 'uploaded' as const
}

export function photoError(error: unknown): string {
  const value = error as { code?: string; statusCode?: string; message?: string }
  if (value?.code === '54000') return 'La tanda supera el espacio disponible. Las fotos guardadas se conservan.'
  if (value?.code === '42501' || value?.statusCode === '403') return 'Hay que volver a verificar la sesión y los permisos.'
  return value?.message?.startsWith('La foto ') || value?.message?.startsWith('Usa archivos') ? value.message : 'No se completó esta foto. Puedes reintentar; las ya guardadas no se duplican.'
}
