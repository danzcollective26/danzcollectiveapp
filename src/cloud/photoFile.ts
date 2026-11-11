const extensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/avif': 'avif', 'image/svg+xml': 'svg',
}

/** A usable image filename, independent of Android's numeric content-provider URI. */
export function photoFileName(name: string | null | undefined, mime: string | null | undefined, path = '') {
  const original = (name || path.split('/').pop() || 'DANZ-foto').normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/^\.+/, '').trim()
  const suffix = original.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase()
  const expected = extensions[(mime || '').split(';')[0].toLowerCase()]
  const valid = suffix && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'svg'].includes(suffix)
  const extension = expected || (valid ? suffix : 'jpg')
  const equivalent = suffix === extension || extension === 'jpg' && suffix === 'jpeg'
  const base = (original.replace(/\.[a-zA-Z0-9]+$/, '') || 'DANZ-foto').slice(0, 150)
  return `${base}.${equivalent && valid ? suffix : extension}`
}

export function photoFileType(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension === 'jpeg' || extension === 'jpg' ? 'JPG' : (extension || 'imagen').toUpperCase()
}
