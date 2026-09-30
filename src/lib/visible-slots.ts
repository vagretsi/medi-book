import type { AppointmentSlot } from './calendar-types'

/** Exclude intervals occupied by the continuation of a longer appointment. */
export function getVisibleSlots(appointments: AppointmentSlot[]) {
  const bookings = appointments.filter(a => a.status === 'BOOKED')
  return appointments.filter(slot => !bookings.some(booking => {
    const start = +new Date(booking.date)
    const time = +new Date(slot.date)
    return slot.id !== booking.id && time > start && time < start + booking.duration * 60_000
  }))
}
