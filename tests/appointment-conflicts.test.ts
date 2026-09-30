import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { findAppointmentConflict } from '../src/lib/appointment-conflicts'
import { getVisibleSlots } from '../src/lib/visible-slots'

const interval = (id: number, time: string, duration: number) => ({ id, date: `2026-09-30T${time}:00+03:00`, duration })
const existing = interval(2, '09:15', 30)

test('08:45 for one hour conflicts with an existing 09:15 appointment', () => {
  assert.equal(findAppointmentConflict(interval(1, '08:45', 60), [existing])?.id, 2)
})
test('exactly adjacent appointments are allowed on either side', () => {
  assert.equal(findAppointmentConflict(interval(1, '08:45', 30), [existing]), undefined)
  assert.equal(findAppointmentConflict(interval(1, '09:45', 30), [existing]), undefined)
})
test('starting inside or enclosing an existing booking is rejected', () => {
  assert.equal(findAppointmentConflict(interval(1, '09:30', 30), [existing])?.id, 2)
  assert.equal(findAppointmentConflict(interval(1, '09:00', 90), [existing])?.id, 2)
})
test('edit ignores itself but rejects extension into the next appointment', () => {
  const original = interval(1, '08:45', 30)
  assert.equal(findAppointmentConflict(original, [original, existing]), undefined)
  assert.equal(findAppointmentConflict({ ...original, duration: 60 }, [original, existing])?.id, 2)
})
test('overlap with an appointment starting on the previous day is rejected', () => {
  assert.equal(findAppointmentConflict(interval(1, '00:15', 30), [{ id: 2, date: '2026-09-29T23:45:00+03:00', duration: 60 }])?.id, 2)
})
test('existing overlapping bookings stay visible; covered free slots are hidden', () => {
  const slot = (id: number, time: string, duration: number, status: string) => ({ ...interval(id, time, duration), status, resourceId: 1, patientName: null, patientTel: null, notes: null })
  const slots = [slot(1, '08:45', 60, 'BOOKED'), slot(2, '09:00', 15, 'FREE'), slot(3, '09:15', 30, 'BOOKED'), slot(4, '09:45', 15, 'FREE')]
  assert.deepEqual(getVisibleSlots(slots).map(s => s.id), [1, 3, 4])
})
