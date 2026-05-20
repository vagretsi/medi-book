export type AppointmentSlot = {
  id: number
  date: Date | string
  status: string
  patientName: string | null
  patientTel: string | null
  notes: string | null
  duration: number
  resourceId: number
}

export type CalendarResource = {
  id: number
  name: string
  type: string
  appointments: AppointmentSlot[]
  canWrite: boolean
}
