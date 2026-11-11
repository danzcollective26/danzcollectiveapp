import assert from 'node:assert/strict'
import { test } from 'node:test'
import { passReminder, tomorrowEvening } from '../src/events/reminder.ts'

test('tomorrow reminder remains at local 18:00 across year and daylight saving changes', () => {
  const previous = process.env.TZ
  process.env.TZ = 'Europe/Madrid'
  try {
    for (const [input, expected] of [['2026-12-31T23:30:00+01:00','2027-01-01T17:00:00.000Z'],['2026-03-28T02:00:00+01:00','2026-03-29T16:00:00.000Z'],['2026-10-24T03:00:00+02:00','2026-10-25T17:00:00.000Z']]) {
      const source = new Date(input)
      assert.equal(tomorrowEvening(source).toISOString(), expected)
      assert.equal(source.toISOString(), new Date(input).toISOString())
    }
  } finally { if (previous===undefined) delete process.env.TZ; else process.env.TZ=previous }
})

test('both calendar formats recover the exact pass into account without an Auth callback parameter', () => {
  const reminder = passReminder('danz-abcd-1234-5678','https://danz.invalid/a?ignored=1',new Date('2026-11-14T17:00:00Z'),new Date('2026-11-13T01:00:00Z'))
  const google = new URL(reminder.google)
  assert.equal(google.origin, 'https://calendar.google.com')
  assert.equal(google.searchParams.get('action'), 'TEMPLATE')
  assert.equal(google.searchParams.get('dates'), '20261114T170000Z/20261114T171000Z')
  const recovered = new URL(google.searchParams.get('details')!.split('Abre tu pase: ')[1])
  assert.equal(recovered.search, '?seccion=cuenta')
  assert.equal(recovered.hash, '#pase=DANZABCD12345678')
  assert.equal(recovered.searchParams.has('code'), false)
  const unfolded = reminder.ics.replace(/\r\n /g,'')
  assert.ok(unfolded.includes(`URL:${recovered.href}\r\n`))
  assert.ok(unfolded.includes('BEGIN:VALARM\r\nTRIGGER:PT0S\r\nACTION:DISPLAY\r\n'))
  assert.ok(unfolded.endsWith('END:VCALENDAR\r\n'))
  assert.ok(!unfolded.includes('ATTENDEE:'))
  for (const line of reminder.ics.split('\r\n')) assert.ok(Buffer.byteLength(line,'utf8')<=75)
})

test('invalid codes, origins and dates cannot become a calendar download', () => {
  const date = new Date('2026-11-14T17:00:00Z')
  for (const code of ['short','ABC123456789\nBEGIN:VEVENT','<script>']) assert.throws(() => passReminder(code,'https://danz.invalid',date))
  assert.throws(() => passReminder('DANZABCD12345678','javascript:alert(1)',date))
  assert.throws(() => passReminder('DANZABCD12345678','https://danz.invalid',new Date('invalid')))
})
