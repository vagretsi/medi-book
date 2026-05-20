'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ensureDaySlots, getDayBounds } from '@/lib/day-slots'
import { authOptions } from '@/lib/auth'
import type { CalendarResource } from '@/lib/calendar-types'

const prisma = new PrismaClient()

type CurrentUser = {
  id: number
  role: string
}

async function requireCurrentUser(): Promise<CurrentUser> {
  const session = await getServerSession(authOptions)
  const userId = Number(session?.user?.id)

  if (!session?.user || !Number.isInteger(userId)) {
    throw new Error('Δεν υπάρχει ενεργή σύνδεση.')
  }

  return {
    id: userId,
    role: session.user.role || 'USER',
  }
}

function isAdmin(user: CurrentUser) {
  return user.role === 'ADMIN'
}

async function userCanSeeAnyResource(user: CurrentUser) {
  if (isAdmin(user)) return true

  const access = await prisma.resourceAccess.findFirst({
    where: { userId: user.id },
    select: { id: true },
  })

  return Boolean(access)
}

async function userCanWriteAnyResource(user: CurrentUser) {
  if (isAdmin(user)) return true

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
  if (isAdmin(user)) return

  const appointment = await prisma.appointment.findUnique({
    where: { id: aptId },
    select: { resourceId: true },
  })

  if (!appointment) {
    throw new Error('Το ραντεβού δεν βρέθηκε.')
  }

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
    where: isAdmin(user)
      ? {}
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
    },
  })
  
  return resources.map((resource) => {
    const { accesses, ...rest } = resource
    return {
      ...rest,
      canWrite: isAdmin(user) || accesses.some((access) => access.canWrite),
    }
  })
}

// 2. LOGOUT
export async function logout() {
  (await cookies()).delete('admin_auth');
  redirect('/login');
}

// 3. BOOK APPOINTMENT
export async function bookAppointment(formData: FormData) {
  const aptId = parseInt(formData.get('aptId') as string)
  const name = formData.get('patientName') as string
  const tel = formData.get('patientTel') as string
  const notes = formData.get('notes') as string
  // Default 30 λεπτά αν δεν επιλεγεί κάτι
  const duration = parseInt(formData.get('duration') as string) || 30 

  await requireAppointmentWriteAccess(aptId)

  await prisma.appointment.update({
    where: { id: aptId },
    data: {
      status: 'BOOKED',
      patientName: name,
      patientTel: tel,
      notes: notes,
      duration: duration
    }
  })
  revalidatePath('/')
}

// 4. UPDATE APPOINTMENT
export async function updateAppointment(formData: FormData) {
  const aptId = parseInt(formData.get('aptId') as string)
  const name = formData.get('patientName') as string
  const tel = formData.get('patientTel') as string
  const notes = formData.get('notes') as string
  const duration = parseInt(formData.get('duration') as string) || 30

  await requireAppointmentWriteAccess(aptId)

  await prisma.appointment.update({
    where: { id: aptId },
    data: {
      patientName: name,
      patientTel: tel,
      notes: notes,
      duration: duration
    }
  })
  revalidatePath('/')
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
  const canSeeNotes = await userCanSeeAnyResource(user)

  if (!canSeeNotes) return ""

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  const note = await prisma.dayNote.findUnique({
    where: { date: date }
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
  date.setHours(0, 0, 0, 0);

  await prisma.dayNote.upsert({
    where: { date: date },
    update: { content },
    create: { date, content }
  });
  
  // Δεν κάνουμε revalidatePath εδώ για να μην αναβοσβήνει η οθόνη καθώς γράφει ο χρήστης
}
