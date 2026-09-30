import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { getBusinessSlotDates, getDayBounds } from '../src/lib/day-slots'
import { formatBusinessTime, formatBusinessDate } from '../src/lib/business-time'

test('future unopened dates use the same 08:00–22:00 schedule', () => {
  const slots = getBusinessSlotDates(new Date('2026-10-01T12:00:00Z'))
  assert.equal(slots.length, 56)
  assert.equal(formatBusinessTime(slots[0]), '08:00')
  assert.equal(formatBusinessTime(slots[55]), '21:45')
})
test('advancing the business day stays correct at both daylight-saving transitions', () => {
  for (const date of ['2026-03-29T12:00:00Z', '2026-10-25T12:00:00Z']) {
    const day = new Date(date)
    const nextDay = new Date(+getDayBounds(day).endOfDay + 1)
    const slots = getBusinessSlotDates(nextDay)
    assert.equal(slots.length, 56)
    assert.equal(formatBusinessTime(slots[0]), '08:00')
    assert.notEqual(formatBusinessDate(slots[0]), formatBusinessDate(day))
  }
})
