import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { APPOINTMENT_DURATIONS, getAppointmentTimeError } from '../src/lib/appointment-duration'
import { findNextAvailableSlot, findAppointmentConflict } from '../src/lib/appointment-conflicts'
import { getBusinessSlotDates } from '../src/lib/day-slots'

for (const [duration, hour] of [[240, 18], [480, 14]]) {
  test(`${duration} minutes is allowed at ${hour}:00 but rejected at ${hour}:15`, () => {
    assert.equal(getAppointmentTimeError(`2026-09-30T${hour}:00:00+03:00`, duration), null)
    assert.match(getAppointmentTimeError(`2026-09-30T${hour}:15:00+03:00`, duration)!, new RegExp(`${duration / 60} ωρών μετά τις ${hour}:00`))
  })
  test(`${duration} minute limit follows Athens time during winter`, () => {
    assert.equal(getAppointmentTimeError(`2026-12-30T${hour - 2}:00:00Z`, duration), null)
    assert.ok(getAppointmentTimeError(`2026-12-30T${hour - 2}:15:00Z`, duration))
  })
}
test('4 and 8 hours are allowed durations, not arbitrary values', () => {
  assert.deepEqual([...APPOINTMENT_DURATIONS], [15, 30, 45, 60, 90, 240, 480])
})
test('long appointments reject overlapping bookings across their entire duration', () => {
  const candidate = { id: 1, date: '2026-09-30T14:00:00+03:00', duration: 480 }
  assert.equal(findAppointmentConflict(candidate, [{ id: 2, date: '2026-09-30T21:45:00+03:00', duration: 15 }])?.id, 2)
})
test('suggestions accept exact closing boundaries and reject later starts', () => {
  const slots = getBusinessSlotDates(new Date('2026-09-30T12:00:00Z')).map((date, id) => ({ id, date, duration: 15, status: 'FREE' }))
  for (const [duration, hour] of [[240, 18], [480, 14]]) {
    const next = findNextAvailableSlot(`2026-09-30T${hour - 1}:45:00+03:00`, duration, slots, [])
    assert.equal(+new Date(next!.date), +new Date(`2026-09-30T${hour}:00:00+03:00`))
    assert.equal(findNextAvailableSlot(`2026-09-30T${hour}:00:00+03:00`, duration, slots, []), undefined)
  }
})
