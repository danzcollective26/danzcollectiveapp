import { normalizeEventCode } from './pass.ts'

export const PASS_REMINDER_TITLE = 'Ey, canjea tu pase DANZ'
const DESCRIPTION = 'Tu noche sigue aquí. Entra con Google o correo para guardar tu sello y acceder a las fotos cuando se publiquen.'

/** Tomorrow at 18:00 in the visitor's local time, including month/year/DST changes. */
export function tomorrowEvening(now = new Date()): Date {
  const start = new Date(now)
  start.setDate(start.getDate() + 1)
  start.setHours(18, 0, 0, 0)
  return start
}

function timestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
}

/** RFC 5545 folds by UTF-8 octets, without splitting a code point. */
function fold(line: string): string {
  let current = ''
  let size = 0
  const lines: string[] = []
  const encoder = new TextEncoder()
  for (const char of line) {
    const bytes = encoder.encode(char).length
    if (size + bytes > 75) { lines.push(current); current = ' '; size = 1 }
    current += char
    size += bytes
  }
  lines.push(current)
  return lines.join('\r\n')
}

export function passReminder(code: string, origin: string, start: Date, now = new Date()) {
  const normalized = normalizeEventCode(code)
  if (!normalized || !Number.isFinite(start.valueOf()) || !Number.isFinite(now.valueOf())) throw new Error('Invalid reminder')
  const base = new URL(origin)
  if (!['https:', 'http:'].includes(base.protocol)) throw new Error('Invalid origin')
  const link = new URL('/', base.origin)
  link.searchParams.set('seccion', 'cuenta')
  link.hash = new URLSearchParams({ pase: normalized }).toString()
  const end = new Date(start.valueOf() + 10 * 60_000)
  const details = `${DESCRIPTION}\n\nAbre tu pase: ${link.href}`
  const google = new URL('https://calendar.google.com/calendar/r/eventedit')
  google.search = new URLSearchParams({ action: 'TEMPLATE', text: PASS_REMINDER_TITLE, dates: `${timestamp(start)}/${timestamp(end)}`, details }).toString()
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DANZ Collective//Pass reminder//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:pass-${normalized}-${timestamp(start)}@${base.hostname}`,
    `DTSTAMP:${timestamp(now)}`, `DTSTART:${timestamp(start)}`, `DTEND:${timestamp(end)}`,
    `SUMMARY:${escapeText(PASS_REMINDER_TITLE)}`, `DESCRIPTION:${escapeText(details)}`, `URL:${link.href}`,
    'TRANSP:TRANSPARENT', 'BEGIN:VALARM', 'TRIGGER:PT0S', 'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(PASS_REMINDER_TITLE)}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR',
  ].map(fold).join('\r\n') + '\r\n'
  return { google: google.href, ics }
}
