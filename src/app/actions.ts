'use server'

import { Prisma, PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ensureDaySlots, getDayBounds, getBusinessSlotDates } from '@/lib/day-slots'
import { authOptions } from '@/lib/auth'
import { findAppointmentConflict, findNextAvailableSlot } from '@/lib/appointment-conflicts'
import { formatBusinessTime } from '@/lib/business-time'
import type { CalendarResource, AppointmentSlot } from '@/lib/calendar-types'

const prisma = new PrismaClient()

type CurrentUser = {
  id: number
  role: string
  groupId: number | null
  canWrite: boolean
}

async function requireCurrentUser(): Promise<CurrentUser> {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)

  if (!session?.user || !Number.isInteger(userId)) {
    throw new Error('Δεν υπάρχει ενεργή σύνδεση.')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      groupId: true,
      canWrite: true,
    },
  })

  if (!dbUser) {
    throw new Error('Ο χρήστης δεν βρέθηκε.')
  }

  return {
    id: dbUser.id,
    role: dbUser.role,
    groupId: dbUser.groupId,
    canWrite: dbUser.canWrite,
  }
}

function isSuperAdmin(user: CurrentUser) {
  return user.role === 'SUPER_ADMIN'
}

function canWriteGroup(user: CurrentUser) {
  return user.role === 'ADMIN' || user.canWrite
}

async function userCanWriteAnyResource(user: CurrentUser) {
  if (isSuperAdmin(user)) return true
  if (user.groupId) return canWriteGroup(user)
  if (user.role === 'ADMIN') return true

  const access = await prisma.resourceAccess.findFirst({
    where: { userId: user.id, canWrite: true },
    select: { id: true },
  })

  return Boolean(access)
}

async function requireAppointmentWriteAccess(aptId: number) {
  if (!Number.isInteger(aptId)) {
    throw new Error('Μη έγκυρο ραντεβού.')
  }

  const user = await requireCurrentUser()
  if (isSuperAdmin(user)) return

  const appointment = await prisma.appointment.findUnique({
    where: { id: aptId },
    select: {
      resourceId: true,
      resource: {
        select: { groupId: true },
      },
    },
  })

  if (!appointment) {
    throw new Error('Το ραντεβού δεν βρέθηκε.')
  }

  if (user.groupId) {
    if (appointment.resource.groupId === user.groupId && canWriteGroup(user)) return
    throw new Error('Δεν έχεις δικαίωμα επεξεργασίας για αυτό το ημερολόγιο.')
  }

  if (user.role === 'ADMIN' && appointment.resource.groupId === null) return

  const access = await prisma.resourceAccess.findUnique({
    where: {
      userId_resourceId: {
        userId: user.id,
        resourceId: appointment.resourceId,
      },
    },
    select: { canWrite: true },
  })

  if (!access?.canWrite) {
    throw new Error('Δεν έχεις δικαίωμα επεξεργασίας για αυτό το ημερολόγιο.')
  }
}

// 1. FETCH DATA (Για το Refresh)
export async function getDayAppointments(dateStr: string): Promise<CalendarResource[]> {
  const user = await requireCurrentUser()
  const selectedDate = new Date(dateStr)
  const { startOfDay, endOfDay } = getDayBounds(selectedDate)

  await ensureDaySlots(prisma, selectedDate)

  const resources = await prisma.resource.findMany({
    where: isSuperAdmin(user)
      ? {}
      : user.groupId
        ? { groupId: user.groupId }
        : user.role === 'ADMIN'
          ? { groupId: null }
      : {
          accesses: {
            some: { userId: user.id },
          },
        },
    orderBy: { id: 'asc' },
    include: {
      appointments: {
        where: { 
          date: { 
            gte: startOfDay,
            lte: endOfDay
          } 
        },
        orderBy: { date: "asc" },
      },
      accesses: {
        where: { userId: user.id },
        select: { canWrite: true },
      },
      group: {
        select: { name: true },
      },
    },
  })
  
  return resources.map((resource) => {
    const { accesses, group, ...rest } = resource
    return {
      ...rest,
      groupName: group?.name || null,
      canWrite: isSuperAdmin(user) || (user.groupId ? canWriteGroup(user) : user.role === 'ADMIN' || accesses.some((access) => access.canWrite)),
    }
  })
}

// 2. LOGOUT
export async function logout() {
  (await cookies()).delete('admin_auth');
  redirect('/login');
}

// Serialize writes per calendar so simultaneous requests cannot double-book it.
type BookingSaveResult = { error: string | null; suggestion?: AppointmentSlot | null; requestedDuration?: number }

async function saveAppointment(formData: FormData, mode: 'book' | 'edit'): Promise<BookingSaveResult> {
  const aptId = Number(formData.get('aptId'))
  const duration = Number(formData.get('duration'))
  if (!Number.isInteger(aptId) || aptId <= 0) return { error: 'Μη έγκυρο ραντεβού.' }
  if (![15, 30, 45, 60, 90].includes(duration)) return { error: 'Επίλεξε έγκυρη διάρκεια.' }
  const patientName = String(formData.get('patientName') ?? '').trim()
  const patientTel = String(formData.get('patientTel') ?? '').trim()
  if (!patientName || !patientTel) return { error: 'Συμπλήρωσε όνομα και τηλέφωνο.' }

  await requireAppointmentWriteAccess(aptId)
  const result = await prisma.$transaction(async tx => {
    const target = await tx.appointment.findUnique({ where: { id: aptId } })
    if (!target) return { error: 'Το ραντεβού δεν βρέθηκε.' }

    // PostgreSQL row lock, shared by both create and edit operations.
    await tx.$queryRaw`SELECT "id" FROM "Resource" WHERE "id" = ${target.resourceId} FOR UPDATE`
    const appointment = await tx.appointment.findUnique({ where: { id: aptId } })
    if (!appointment) return { error: 'Το ραντεβού δεν βρέθηκε.' }
    async function conflictResult(error: string): Promise<BookingSaveResult> {
      if (mode !== 'book') return { error }
      const { startOfDay } = getDayBounds(target!.date)
      // Bound the search to one year; no speculative slots are written while searching.
      const searchEnd = getDayBounds(new Date(+startOfDay + 365 * 86_400_000)).endOfDay
      const [existingSlots, allBookings] = await Promise.all([
        tx.appointment.findMany({ where: { resourceId: target!.resourceId, date: { gte: startOfDay, lte: searchEnd } } }),
        tx.appointment.findMany({ where: { resourceId: target!.resourceId, status: 'BOOKED', date: { lte: searchEnd } }, select: { id: true, date: true, duration: true } }),
      ])
      const existingByTime = new Map(existingSlots.map(slot => [+slot.date, slot]))
      let day = startOfDay
      while (+day <= +searchEnd) {
        const dates = getBusinessSlotDates(day)
        const slots = dates.map((date, index) => existingByTime.get(+date) ?? {
          id: -(index + 1), date, status: 'FREE', duration: 15, resourceId: target!.resourceId,
          patientName: null, patientTel: null, notes: null,
        })
        const next = findNextAvailableSlot(startOfDay, duration, slots, allBookings)
        if (next) {
          // Materialize only the selected day so the suggested time has a real booking ID.
          await tx.appointment.createMany({
            data: dates.map(date => ({ date, resourceId: target!.resourceId, status: 'FREE', duration: 15 })),
            skipDuplicates: true,
          })
          const saved = await tx.appointment.findUniqueOrThrow({ where: { date_resourceId: { date: new Date(next.date), resourceId: target!.resourceId } } })
          return { error, suggestion: { ...saved, date: saved.date.toISOString() }, requestedDuration: duration }
        }
        day = new Date(+getDayBounds(day).endOfDay + 1)
      }
      return { error, suggestion: null, requestedDuration: duration }
    }
    if (mode === 'book' && appointment.status !== 'FREE') {
      return conflictResult('Η ώρα έχει ήδη κρατηθεί. Επίλεξε άλλη ώρα.')
    }
    if (mode === 'edit' && appointment.status !== 'BOOKED') {
      return { error: 'Το ραντεβού έχει ακυρωθεί. Ανανέωσε το πρόγραμμα.' }
    }

    let destination = appointment
    if (mode === 'edit' && formData.has('targetAptId')) {
      const targetAptId = Number(formData.get('targetAptId'))
      if (!Number.isInteger(targetAptId) || targetAptId <= 0) return { error: 'Επίλεξε έγκυρη ώρα.' }
      if (targetAptId !== aptId) {
        const slot = await tx.appointment.findUnique({ where: { id: targetAptId } })
        if (!slot || slot.resourceId !== appointment.resourceId) {
          return { error: 'Επίλεξε ώρα στο ίδιο ημερολόγιο.' }
        }
        if (slot.status !== 'FREE') return { error: 'Η ώρα έχει ήδη κρατηθεί. Επίλεξε άλλη ώρα.' }
        destination = slot
      }
    }

    const end = new Date(destination.date.getTime() + duration * 60_000)
    // No lower date bound: include bookings that began before this day as well.
    const bookings = await tx.appointment.findMany({
      where: { resourceId: appointment.resourceId, status: 'BOOKED', id: { not: aptId }, date: { lt: end } },
      select: { id: true, date: true, duration: true },
      orderBy: { date: 'asc' },
    })
    const conflict = findAppointmentConflict({ id: aptId, date: destination.date, duration }, bookings)
    if (conflict) {
      return conflictResult(`Υπάρχει ήδη ραντεβού στις ${formatBusinessTime(conflict.date)}. Επίλεξε μικρότερη διάρκεια ή άλλη ώρα.`)
    }
    await tx.appointment.update({
      where: { id: destination.id },
      data: { status: 'BOOKED', patientName, patientTel, notes: String(formData.get('notes') ?? ''), duration },
    })
    if (destination.id !== aptId) {
      await tx.appointment.update({
        where: { id: aptId },
        data: { status: 'FREE', patientName: null, patientTel: null, notes: null, duration: 15 },
      })
    }
    return { error: null }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted })

  if (!result.error) revalidatePath('/')
  return result
}

export async function bookAppointment(formData: FormData) {
  return saveAppointment(formData, 'book')
}

export async function updateAppointment(formData: FormData) {
  return saveAppointment(formData, 'edit')
}

// 5. CANCEL APPOINTMENT
export async function cancelAppointment(formData: FormData) {
  const aptId = parseInt(formData.get('aptId') as string)

  await requireAppointmentWriteAccess(aptId)

  await prisma.appointment.update({
    where: { id: aptId },
    data: {
      status: 'FREE',
      patientName: null,
      patientTel: null,
      notes: null,
      // ΣΗΜΑΝΤΙΚΟ: Το επαναφέρουμε σε 15 για να ταιριάζει με το Grid του timeline
      // Αν ο χρήστης θέλει 30, θα επιλέξει "30 λεπτά" όταν πατήσει "Κράτηση"
      duration: 15 
    }
  })
  revalidatePath('/')
}

// ... υπάρχον κώδικας ...

// 6. GET DAY NOTE
export async function getDayNote(dateStr: string) {
  const user = await requireCurrentUser()
  const canSeeNotes = await userCanWriteAnyResource(user)

  if (!canSeeNotes) return ""

  const date = new Date(dateStr)
  date.setUTCHours(0, 0, 0, 0)

  const note = await prisma.dayNote.findFirst({
    where: {
      date,
      groupId: user.groupId,
    }
  })
  return note?.content || ""
}

// 7. SAVE DAY NOTE (Auto-Save)
export async function saveDayNote(dateStr: string, content: string) {
  const user = await requireCurrentUser()
  const canWriteNotes = await userCanWriteAnyResource(user)

  if (!canWriteNotes) {
    throw new Error('Δεν έχεις δικαίωμα επεξεργασίας σημειώσεων.')
  }

  const date = new Date(dateStr);
  date.setUTCHours(0, 0, 0, 0);

  const existingNote = await prisma.dayNote.findFirst({
    where: {
      date,
      groupId: user.groupId,
    },
    select: { id: true },
  })

  if (existingNote) {
    await prisma.dayNote.update({
      where: { id: existingNote.id },
      data: { content },
    })
  } else {
    await prisma.dayNote.create({
      data: {
        date,
        groupId: user.groupId,
        content,
      },
    })
  }
  
  // Δεν κάνουμε revalidatePath εδώ για να μην αναβοσβήνει η οθόνη καθώς γράφει ο χρήστης
}
