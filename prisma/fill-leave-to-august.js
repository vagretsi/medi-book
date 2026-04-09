const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const SOURCE_YEAR = parseInt(process.env.LEAVE_SOURCE_YEAR || `${new Date().getFullYear()}`, 10)
const SOURCE_MONTH_INDEX = 2
const TARGET_START = new Date(SOURCE_YEAR, 3, 1, 0, 0, 0, 0)
const TARGET_END = new Date(SOURCE_YEAR, 7, 31, 23, 59, 59, 999)
const SLOT_INTERVAL_MINUTES = 15
const START_HOUR = parseInt(process.env.LEAVE_START_HOUR || '8', 10)
const END_HOUR = parseInt(process.env.LEAVE_END_HOUR || '22', 10)
const LEAVE_KEYWORDS = (process.env.LEAVE_KEYWORDS || 'ADEIA,ΑΔΕΙΑ,adeia,άδεια,leave,vacation')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean)

function isLeaveAppointment(appointment) {
  const haystack = `${appointment.patientName || ''} ${appointment.notes || ''}`.toLowerCase()
  return LEAVE_KEYWORDS.some((keyword) => haystack.includes(keyword))
}

function slotKey(date, resourceId) {
  return `${resourceId}:${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}:${date.getMinutes()}`
}

function createDateAtTime(baseDate, hour, minute) {
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hour,
    minute,
    0,
    0,
  )
}

function* eachDay(start, end) {
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)

  while (current <= end) {
    yield new Date(current)
    current.setDate(current.getDate() + 1)
  }
}

function* eachSlotForDay(day) {
  const cursor = new Date(day)
  cursor.setHours(START_HOUR, 0, 0, 0)
  const end = new Date(day)
  end.setHours(END_HOUR, 0, 0, 0)

  while (cursor < end) {
    yield new Date(cursor)
    cursor.setMinutes(cursor.getMinutes() + SLOT_INTERVAL_MINUTES)
  }
}

function buildPatterns(appointments) {
  const uniquePatterns = new Map()

  for (const appointment of appointments) {
    if (!isLeaveAppointment(appointment)) continue

    const pattern = {
      resourceId: appointment.resourceId,
      weekday: appointment.date.getDay(),
      hour: appointment.date.getHours(),
      minute: appointment.date.getMinutes(),
      duration: appointment.duration,
      patientName: appointment.patientName,
      patientTel: appointment.patientTel,
      notes: appointment.notes,
    }

    const key = [
      pattern.resourceId,
      pattern.weekday,
      pattern.hour,
      pattern.minute,
      pattern.duration,
      pattern.patientName || '',
      pattern.patientTel || '',
      pattern.notes || '',
    ].join('|')

    uniquePatterns.set(key, pattern)
  }

  return Array.from(uniquePatterns.values())
}

async function ensureSlotsExist(resourceIds) {
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: TARGET_START,
        lte: TARGET_END,
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

  const pendingCreates = []

  for (const day of eachDay(TARGET_START, TARGET_END)) {
    for (const resourceId of resourceIds) {
      for (const date of eachSlotForDay(day)) {
        const key = slotKey(date, resourceId)
        if (existingKeys.has(key)) continue

        pendingCreates.push({
          date,
          resourceId,
          status: 'FREE',
          duration: SLOT_INTERVAL_MINUTES,
        })
        existingKeys.add(key)
      }
    }
  }

  for (let index = 0; index < pendingCreates.length; index += 1000) {
    await prisma.appointment.createMany({
      data: pendingCreates.slice(index, index + 1000),
    })
  }

  return pendingCreates.length
}

function canApplyPattern(pattern, day, appointmentsByKey) {
  const blockSlots = Math.max(1, Math.ceil(pattern.duration / SLOT_INTERVAL_MINUTES))

  for (let offset = 0; offset < blockSlots; offset += 1) {
    const slotDate = createDateAtTime(day, pattern.hour, pattern.minute)
    slotDate.setMinutes(slotDate.getMinutes() + offset * SLOT_INTERVAL_MINUTES)
    const existing = appointmentsByKey.get(slotKey(slotDate, pattern.resourceId))
    if (!existing) return false

    if (existing.status === 'BOOKED' && !isLeaveAppointment(existing)) {
      return false
    }
  }

  return true
}

async function applyPatterns(patterns) {
  const targetAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: TARGET_START,
        lte: TARGET_END,
      },
    },
    select: {
      id: true,
      resourceId: true,
      date: true,
      status: true,
      patientName: true,
      patientTel: true,
      notes: true,
      duration: true,
    },
  })

  const appointmentsByKey = new Map(
    targetAppointments.map((appointment) => [slotKey(appointment.date, appointment.resourceId), appointment]),
  )

  let updatedCount = 0
  let skippedConflicts = 0

  for (const day of eachDay(TARGET_START, TARGET_END)) {
    const weekdayPatterns = patterns.filter((pattern) => pattern.weekday === day.getDay())

    for (const pattern of weekdayPatterns) {
      if (!canApplyPattern(pattern, day, appointmentsByKey)) {
        skippedConflicts += 1
        continue
      }

      const startDate = createDateAtTime(day, pattern.hour, pattern.minute)
      const existing = appointmentsByKey.get(slotKey(startDate, pattern.resourceId))
      if (!existing) {
        skippedConflicts += 1
        continue
      }

      const alreadyMatching =
        existing.status === 'BOOKED' &&
        isLeaveAppointment(existing) &&
        existing.duration === pattern.duration &&
        existing.patientName === pattern.patientName &&
        existing.patientTel === pattern.patientTel &&
        existing.notes === pattern.notes

      if (alreadyMatching) continue

      await prisma.appointment.update({
        where: { id: existing.id },
        data: {
          status: 'BOOKED',
          patientName: pattern.patientName,
          patientTel: pattern.patientTel,
          notes: pattern.notes,
          duration: pattern.duration,
        },
      })

      appointmentsByKey.set(slotKey(startDate, pattern.resourceId), {
        ...existing,
        status: 'BOOKED',
        patientName: pattern.patientName,
        patientTel: pattern.patientTel,
        notes: pattern.notes,
        duration: pattern.duration,
      })
      updatedCount += 1
    }
  }

  return { updatedCount, skippedConflicts }
}

async function main() {
  const resources = await prisma.resource.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  })

  if (resources.length === 0) {
    throw new Error('Δεν βρέθηκαν resources στη βάση.')
  }

  const marchStart = new Date(SOURCE_YEAR, SOURCE_MONTH_INDEX, 1, 0, 0, 0, 0)
  const marchEnd = new Date(SOURCE_YEAR, SOURCE_MONTH_INDEX + 1, 0, 23, 59, 59, 999)

  const marchAppointments = await prisma.appointment.findMany({
    where: {
      status: 'BOOKED',
      date: {
        gte: marchStart,
        lte: marchEnd,
      },
    },
    select: {
      id: true,
      resourceId: true,
      date: true,
      status: true,
      patientName: true,
      patientTel: true,
      notes: true,
      duration: true,
    },
    orderBy: [{ date: 'asc' }, { resourceId: 'asc' }],
  })

  const leavePatterns = buildPatterns(marchAppointments)

  if (leavePatterns.length === 0) {
    throw new Error(
      `Δεν βρήκα leave blocks στον Μάρτιο ${SOURCE_YEAR}. Έλεγξε τα LEAVE_KEYWORDS ή τα patientName/notes των blocks.`,
    )
  }

  console.log(`Βρέθηκαν ${leavePatterns.length} μοναδικά leave patterns από τον Μάρτιο ${SOURCE_YEAR}.`)

  const createdSlots = await ensureSlotsExist(resources.map((resource) => resource.id))
  console.log(`Δημιουργήθηκαν ${createdSlots} νέα FREE slots μέχρι 31 Αυγούστου ${SOURCE_YEAR}.`)

  const { updatedCount, skippedConflicts } = await applyPatterns(leavePatterns)
  console.log(`Ενημερώθηκαν ${updatedCount} blocks ως leave.`)

  if (skippedConflicts > 0) {
    console.log(`Παραλείφθηκαν ${skippedConflicts} blocks λόγω σύγκρουσης με υπάρχον BOOKED ραντεβού.`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
