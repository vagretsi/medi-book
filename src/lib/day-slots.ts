import { Prisma, PrismaClient } from '@prisma/client'

const START_HOUR = 8
const END_HOUR = 22
const SLOT_INTERVAL_MINUTES = 15
const BUSINESS_TIME_ZONE = 'Europe/Athens'

function getDatePartsInBusinessZone(dateInput: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(dateInput)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  }
}

function getBusinessZoneOffsetMinutes(dateInput: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(dateInput)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const businessTimeAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  )

  return (businessTimeAsUtc - dateInput.getTime()) / 60000
}

function businessTimeToUtc(year: number, month: number, day: number, hour: number, minute = 0) {
  const initialUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0))
  const offsetMinutes = getBusinessZoneOffsetMinutes(initialUtc)
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0) - offsetMinutes * 60000)
}

export function getDayBounds(dateInput: Date) {
  const { year, month, day } = getDatePartsInBusinessZone(dateInput)
  const startOfDay = businessTimeToUtc(year, month, day, 0)

  const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0, 0))
  const nextDayParts = getDatePartsInBusinessZone(nextDay)
  const endOfDay = new Date(businessTimeToUtc(nextDayParts.year, nextDayParts.month, nextDayParts.day, 0).getTime() - 1)

  return { startOfDay, endOfDay }
}

function slotKey(date: Date, resourceId: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${resourceId}:${values.hour}:${values.minute}`
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
  const { year, month, day } = getDatePartsInBusinessZone(dateInput)

  for (const resource of resources) {
    const cursor = businessTimeToUtc(year, month, day, START_HOUR)
    const endTime = businessTimeToUtc(year, month, day, END_HOUR)

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

      cursor.setUTCMinutes(cursor.getUTCMinutes() + SLOT_INTERVAL_MINUTES)
    }
  }

  if (pendingCreates.length === 0) return

  for (let index = 0; index < pendingCreates.length; index += 500) {
    await prisma.appointment.createMany({
      data: pendingCreates.slice(index, index + 500),
    })
  }
}
