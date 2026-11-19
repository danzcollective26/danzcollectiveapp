/** Only a scoped photograph identifier is saved; never store private image bytes or signed URLs. */
export type PassportCoverChoice = { eventId: string; photoId: string }
const prefix = 'danz-passport-cover-v1:'
export const PASSPORT_COVER_CHANGED = 'danz-passport-cover-changed'
const uuid = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i

export function readPassportCover(userId: string): PassportCoverChoice | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(prefix + userId) || 'null')
    if (!parsed || typeof parsed !== 'object') return null
    const choice = parsed as Partial<PassportCoverChoice>
    return uuid.test(choice.eventId || '') && uuid.test(choice.photoId || '')
      ? { eventId: choice.eventId!, photoId: choice.photoId! } : null
  } catch { return null }
}

export function selectPassportCover(userId: string, choice: PassportCoverChoice | null): boolean {
  if (!uuid.test(userId) || (choice && (!uuid.test(choice.eventId) || !uuid.test(choice.photoId)))) return false
  try {
    if (choice) localStorage.setItem(prefix + userId, JSON.stringify(choice))
    else localStorage.removeItem(prefix + userId)
    window.dispatchEvent(new Event(PASSPORT_COVER_CHANGED))
    return true
  } catch { return false }
}
