'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

// 1. FETCH DATA (Για το Refresh)
export async function getDayAppointments(dateStr: string) {
  const selectedDate = new Date(dateStr);
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const resources = await prisma.resource.findMany({
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
    },
  });
  
  return resources;
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