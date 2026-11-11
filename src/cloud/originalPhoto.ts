import { photoFileName } from './photoFile.ts'

export type OriginalMetadata = { name: string; path: string; mime?: string | null; bytes?: number | null; sha256?: string | null }

export async function photoDigest(blob: Blob) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())), byte => byte.toString(16).padStart(2, '0')).join('')
}

/** Check the original bytes before handing anything to Android's file provider. */
export async function verifiedPhotoFile(blob: Blob, metadata: OriginalMetadata) {
  if (!blob.size || metadata.bytes && metadata.bytes > 0 && blob.size !== metadata.bytes) throw new Error('Incomplete photo')
  const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer())
  const detected = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff ? 'image/jpeg'
    : [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => header[i] === n) ? 'image/png'
      : String.fromCharCode(...header.slice(0, 4)) === 'RIFF' && String.fromCharCode(...header.slice(8, 12)) === 'WEBP' ? 'image/webp' : null
  const declared = blob.type.split(';')[0].toLowerCase()
  if (!detected || declared && declared !== 'application/octet-stream' && declared !== detected || metadata.mime && metadata.mime !== detected) throw new Error('Invalid photo format')
  const digest = await photoDigest(blob)
  if (metadata.sha256 && digest !== metadata.sha256.toLowerCase()) throw new Error('Photo integrity mismatch')
  return { file: new File([blob], photoFileName(metadata.name, detected, metadata.path), { type: detected }), digest }
}

/** An image header alone is insufficient: the browser must be able to open it. */
export async function decodePhoto(file: File) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Unreadable photo')
  } finally { URL.revokeObjectURL(url) }
}

export function photoFileSize(bytes: number) {
  return bytes < 1024 ? `${bytes} bytes` : bytes < 1024 * 1024
    ? `${(bytes / 1024).toLocaleString('es-ES', { maximumFractionDigits: 1 })} KB`
    : `${(bytes / (1024 * 1024)).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`
}
