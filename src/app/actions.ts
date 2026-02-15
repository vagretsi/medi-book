'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function bookAppointment(formData: FormData) {
  // Παίρνουμε τα δεδομένα από τη φόρμα
  const aptId = Number(formData.get('aptId'))
  const patientName = formData.get('patientName') as string
  const patientTel = formData.get('patientTel') as string
  const notes = formData.get('notes') as string

  try {
    // Ενημερώνουμε το ραντεβού στη βάση
    await prisma.appointment.update({
      where: { id: aptId },
      data: {
        patientName,
        patientTel,
        notes,
        status: 'BOOKED'
      }
    })

    // Ανανέωση του Dashboard
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error("Error booking:", error)
    return { success: false }
  }
}