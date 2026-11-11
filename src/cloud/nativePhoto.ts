const PACKAGE = 'com.danzcollective.photos'
const DANZ_ORIGIN = 'https://danz-collective-demo.right-vine-9666.chatgpt.site'
const STORAGE_ORIGIN = 'https://ttgehdknhnrxtddxpknc.supabase.co'
const PREFERENCE = 'danz-native-photos-v1'
export function rememberNativePhotoLaunch() {
  const url = new URL(window.location.href)
  if (url.searchParams.get('androidFotos') !== 'activado') return
  try { localStorage.setItem(PREFERENCE, 'installed') } catch { /* Preference may be unavailable. */ }
  url.searchParams.delete('androidFotos')
  window.history.replaceState(window.history.state, '', url)
}
export function nativePhotosEnabled() {
  try { return /Android/i.test(navigator.userAgent) && localStorage.getItem(PREFERENCE) === 'installed' } catch { return false }
}
export function disableNativePhotos() { try { localStorage.removeItem(PREFERENCE) } catch { /* Optional preference. */ } }
export function nativePhotoIntent(input: { url: string; name: string; mime: string; bytes: number; sha256: string }) {
  const source = new URL(input.url)
  if (source.origin !== STORAGE_ORIGIN || source.username || source.password || source.hash
    || !/^\/storage\/v1\/object\/sign\/danz-event-photos\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_.-]+)+$/.test(source.pathname)
    || source.pathname.includes('..') || !source.searchParams.get('token')
    || !['image/jpeg', 'image/png', 'image/webp'].includes(input.mime)
    || !/^[A-Za-z0-9][A-Za-z0-9._ -]{0,159}$/.test(input.name)
    || !Number.isInteger(input.bytes) || input.bytes < 1 || input.bytes > 25 * 1024 * 1024
    || !/^[a-f0-9]{64}$/.test(input.sha256)) throw new Error('Invalid native photo request')
  const params = new URLSearchParams({ url: source.href, name: input.name, mime: input.mime, bytes: input.bytes.toString(), sha256: input.sha256 })
  const fallback = `${DANZ_ORIGIN}/?seccion=fotos&androidFotos=instalar`
  return `intent://photo/save?${params}#Intent;scheme=danzphotos;package=${PACKAGE};S.browser_fallback_url=${encodeURIComponent(fallback)};end`
}
