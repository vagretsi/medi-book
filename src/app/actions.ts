'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export default function BookingManager({ appointments }: { appointments: any }) {  // Παίρνουμε τα δεδομένα από τη φόρμα
  const aptId = Number(formData.get('aptId'))
  const patientName = formData.get('patientName') as string
  const patientTel = formData.get('patientTel') as string
  const notes = formData.get('notes') as string

  try {
    // Ενημερώνουμε το ραντεβού στη βάση
    await prisma.appointment.update({
      where: { 
        id: aptId 
      },
      data: {
        patientName,
        patientTel,
        notes,
        status: 'BOOKED' // Αλλάζουμε το status από FREE σε BOOKED
      }
    })

    // Αυτή η εντολή λέει στο Next.js να ξαναδιαβάσει τη βάση 
    // για να δεις αμέσως την αλλαγή στο Dashboard
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error("Σφάλμα κατά την κράτηση:", error)
    return { success: false, error: "Η κράτηση απέτυχε" }
  }
}