import { getAppointmentTimeError } from './appointment-duration'

type Interval = { id: number; date: Date | string; duration: number }

export function findAppointmentConflict(candidate: Interval, bookings: Interval[]) {
  const start = +new Date(candidate.date)
  const end = start + candidate.duration * 60_000
  return bookings.find(booking => booking.id !== candidate.id &&
    +new Date(booking.date) < end &&
    +new Date(booking.date) + booking.duration * 60_000 > start)
}

/** Find a later start with enough consecutive 15-minute slots on the supplied day. */
export function findNextAvailableSlot<T extends Interval & { status: string }>(after: Date | string, duration: number, slots: T[], bookings: Interval[]) {
  const free = slots.filter(slot => slot.status === 'FREE').sort((a, b) => +new Date(a.date) - +new Date(b.date))
  const times = new Set(free.map(slot => +new Date(slot.date)))
  return free.find(slot => {
    const start = +new Date(slot.date)
    if (start <= +new Date(after) || getAppointmentTimeError(slot.date, duration) || findAppointmentConflict({ ...slot, duration }, bookings)) return false
    for (let minute = 0; minute < duration; minute += 15) {
      if (!times.has(start + minute * 60_000)) return false
    }
    return true
  })
}
