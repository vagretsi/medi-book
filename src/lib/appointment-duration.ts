export const APPOINTMENT_DURATIONS = [15, 30, 45, 60, 90, 240, 480] as const

const timeParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Athens', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

/** Appointments must finish by 22:00 in the clinic's timezone. */
export function getAppointmentTimeError(date: Date | string, duration: number): string | null {
  const parts = Object.fromEntries(timeParts.formatToParts(new Date(date)).map(part => [part.type, part.value]))
  const startMinutes = Number(parts.hour) * 60 + Number(parts.minute) + Number(parts.second) / 60
  if (startMinutes + duration <= 22 * 60) return null
  if (duration === 240) return 'Δεν είναι δυνατό να κλείσετε ραντεβού 4 ωρών μετά τις 18:00.'
  if (duration === 480) return 'Δεν είναι δυνατό να κλείσετε ραντεβού 8 ωρών μετά τις 14:00.'
  return 'Το ραντεβού πρέπει να ολοκληρώνεται έως τις 22:00. Επιλέξτε νωρίτερη ώρα ή μικρότερη διάρκεια.'
}
