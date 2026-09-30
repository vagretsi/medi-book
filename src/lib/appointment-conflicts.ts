type Interval = { id: number; date: Date | string; duration: number }

export function findAppointmentConflict(candidate: Interval, bookings: Interval[]) {
  const start = +new Date(candidate.date)
  const end = start + candidate.duration * 60_000
  return bookings.find(booking => booking.id !== candidate.id &&
    +new Date(booking.date) < end &&
    +new Date(booking.date) + booking.duration * 60_000 > start)
}
