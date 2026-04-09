import { Prisma, PrismaClient } from '@prisma/client'

const START_HOUR = 8
const END_HOUR = 22
const SLOT_INTERVAL_MINUTES = 15

export function getDayBounds(dateInput: Date) {
  const startOfDay = new Date(dateInput)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(dateInput)
  endOfDay.setHours(23, 59, 59, 999)

  return { startOfDay, endOfDay }
}

function slotKey(date: Date, resourceId: number) {
  return `${resourceId}:${date.getHours()}:${date.getMinutes()}`
}

export async function ensureDaySlots(prisma: PrismaClient, dateInput: Date) {
  const { startOfDay, endOfDay } = getDayBounds(dateInput)

  const resources = await prisma.resource.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
  })

  if (resources.length === 0) return

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      date: true,
      resourceId: true,
    },
  })

  const existingKeys = new Set(
    existingAppointments.map((appointment) => slotKey(appointment.date, appointment.resourceId)),
  )

  const pendingCreates: Prisma.AppointmentCreateManyInput[] = []

  for (const resource of resources) {
    const cursor = new Date(startOfDay)
    cursor.setHours(START_HOUR, 0, 0, 0)

    const endTime = new Date(startOfDay)
    endTime.setHours(END_HOUR, 0, 0, 0)

    while (cursor < endTime) {
      const slotDate = new Date(cursor)
      const key = slotKey(slotDate, resource.id)

      if (!existingKeys.has(key)) {
        pendingCreates.push({
          date: slotDate,
          resourceId: resource.id,
          status: 'FREE',
          duration: SLOT_INTERVAL_MINUTES,
        })
        existingKeys.add(key)
      }

      cursor.setMinutes(cursor.getMinutes() + SLOT_INTERVAL_MINUTES)
    }
  }

  if (pendingCreates.length === 0) return

  for (let index = 0; index < pendingCreates.length; index += 500) {
    await prisma.appointment.createMany({
      data: pendingCreates.slice(index, index + 500),
    })
  }
}
