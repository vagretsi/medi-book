'use server'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function bookAppointment(formData: FormData) {
  const aptId = Number(formData.get('aptId'))
  const patientName = formData.get('patientName') as string
  const patientTel = formData.get('patientTel') as string
  const notes = formData.get('notes') as string

  try {
    await prisma.appointment.update({
      where: { id: aptId },
      data: { patientName, patientTel, notes, status: 'BOOKED' }
    })
    revalidatePath('/')
    return { success: true }
  } catch (e) {
    return { success: false }
  }
}
export async function logout() {
  (await cookies()).delete('admin_auth');
  redirect('/login');
}

//  (without any changes in the url)

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

// ... (υπάρχον κώδικας)

// ΕΝΗΜΕΡΩΣΗ ΡΑΝΤΕΒΟΥ
export async function updateAppointment(formData: FormData) {
  'use server'
  const aptId = parseInt(formData.get('aptId') as string)
  const name = formData.get('patientName') as string
  const tel = formData.get('patientTel') as string
  const notes = formData.get('notes') as string
  const duration = parseInt(formData.get('duration') as string)

  await prisma.appointment.update({
    where: { id: aptId },
    data: {
      patientName: name,
      patientTel: tel,
      notes: notes,
      duration: duration
    }
  })
}

// ΑΚΥΡΩΣΗ ΡΑΝΤΕΒΟΥ (Επιστροφή σε FREE)
export async function cancelAppointment(formData: FormData) {
  'use server'
  const aptId = parseInt(formData.get('aptId') as string)

  await prisma.appointment.update({
    where: { id: aptId },
    data: {
      status: 'FREE',
      patientName: null,
      patientTel: null,
      notes: null,
      duration: 30 // Reset duration
    }
  })
}