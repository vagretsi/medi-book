import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { findAppointmentConflict, findNextAvailableSlot } from '../src/lib/appointment-conflicts'
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

const freeSlot = (id: number, time: string) => ({ ...interval(id, time, 15), status: 'FREE' })
const laterSlots = [freeSlot(10, '09:45'), freeSlot(11, '10:00'), freeSlot(12, '10:15'), freeSlot(13, '10:30'), freeSlot(14, '10:45'), freeSlot(15, '11:00')]

test('suggests the earliest later slot fitting the entire requested hour', () => {
  assert.equal(findNextAvailableSlot(interval(1, '08:45', 60).date, 60, laterSlots, [existing])?.id, 10)
})
test('skips free-looking slots covered by another long booking', () => {
  assert.equal(findNextAvailableSlot(interval(1, '08:45', 60).date, 30, laterSlots, [interval(2, '09:30', 60)])?.id, 13)
})
test('does not suggest a gap shorter than the duration or cross closing time', () => {
  assert.equal(findNextAvailableSlot(interval(1, '08:45', 60).date, 60, laterSlots.slice(0, 2), []), undefined)
  assert.equal(findNextAvailableSlot(interval(1, '21:00', 60).date, 60, [freeSlot(9, '21:45')], []), undefined)
})
test('skips gaps and finds the next continuous interval even with unsorted input', () => {
  const slots = [laterSlots[5], laterSlots[3], laterSlots[0], laterSlots[4]]
  assert.equal(findNextAvailableSlot(interval(1, '09:00', 45).date, 45, slots, [])?.id, 13)
})
test('only suggests strictly later starts', () => {
  assert.equal(findNextAvailableSlot(laterSlots[0].date, 15, laterSlots, [])?.id, 11)
})

test('continues to the next day when the selected day is full', () => {
  const nextDay = Array.from({ length: 4 }, (_, i) => ({ id: 100 + i, date: `2026-10-01T08:${String(i * 15).padStart(2, '0')}:00+03:00`, duration: 15, status: 'FREE' }))
  assert.equal(findNextAvailableSlot(interval(1, '21:45', 60).date, 60, nextDay, [])?.id, 100)
})
test('next-day proposal skips an occupied morning', () => {
  const nextDay = Array.from({ length: 8 }, (_, i) => ({ id: 100 + i, date: new Date(Date.parse('2026-10-01T08:00:00+03:00') + i * 15 * 60_000), duration: 15, status: 'FREE' }))
  const morning = { id: 50, date: '2026-10-01T08:00:00+03:00', duration: 60 }
  assert.equal(findNextAvailableSlot(interval(1, '21:45', 60).date, 60, nextDay, [morning])?.id, 104)
})

test('morning-first search proposes an earlier free start on the same day', () => {
  const slots = [freeSlot(10, '08:00'), freeSlot(11, '08:15'), freeSlot(12, '14:00'), freeSlot(13, '14:15')]
  const startOfDay = '2026-09-30T00:00:00+03:00'
  assert.equal(findNextAvailableSlot(startOfDay, 30, slots, [interval(9, '13:00', 60)])?.id, 10)
})
test('moving a booking may overlap its old time but must not overlap another booking', () => {
  const original = interval(1, '08:00', 60)
  const next = interval(2, '09:15', 30)
  assert.equal(findAppointmentConflict({ ...original, date: interval(1, '08:15', 30).date }, [original, next]), undefined)
  assert.equal(findAppointmentConflict({ ...original, date: interval(1, '08:30', 60).date }, [original, next])?.id, 2)
})
test('edit time choices can include slots covered only by the original appointment', () => {
  const slots = [
    { ...interval(1, '08:00', 60), status: 'BOOKED' },
    { ...interval(2, '08:15', 15), status: 'FREE' },
    { ...interval(3, '08:30', 30), status: 'BOOKED' },
    { ...interval(4, '08:45', 15), status: 'FREE' },
  ].map(slot => ({ ...slot, resourceId: 1, patientName: null, patientTel: null, notes: null }))
  const released = slots.map(slot => slot.id === 1 ? { ...slot, status: 'FREE', duration: 15 } : slot)
  assert.deepEqual(getVisibleSlots(released).filter(slot => slot.status === 'FREE').map(slot => slot.id), [1, 2])
})

test('moving to another date checks conflicts on the destination date', () => {
  const original = interval(1, '08:00', 60)
  const destination = { ...original, date: '2026-10-01T08:00:00+03:00' }
  assert.equal(findAppointmentConflict(destination, [original]), undefined)
  assert.equal(findAppointmentConflict(destination, [original, { id: 2, date: '2026-10-01T08:30:00+03:00', duration: 30 }])?.id, 2)
})
