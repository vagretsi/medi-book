import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("🛠️  Διόρθωση ονόματος & Hard Reset...")
  
  // 1. Καθαρισμός Appointments
  await prisma.appointment.deleteMany({})
  console.log("🗑️  Η βάση άδειασε.")

  console.log("🚀 Γέμισμα με 15-λεπτα slots (08:00 - 22:00)...")

  // 2. Resources (ΕΔΩ ΕΓΙΝΕ Η ΑΛΛΑΓΗ)
  // Πλέον λέμε ρητά: Αν υπάρχει, ΑΛΛΑΞΕ το όνομα σε 'ΙΑΤΡΕΙΟ'
  const iatreio = await prisma.resource.upsert({ 
    where: { id: 1 }, 
    update: { name: 'ΙΑΤΡΕΙΟ' }, // <--- ΑΥΤΟ ΤΟ ΦΤΙΑΧΝΕΙ
    create: { name: 'ΙΑΤΡΕΙΟ', type: 'MEDICAL' }
  })

  const laser = await prisma.resource.upsert({ 
    where: { id: 2 }, 
    update: { name: 'LASER' }, 
    create: { name: 'LASER', type: 'LASER' }
  })
  
  // 3. Ρυθμίσεις
  const daysToGenerate = 45; 
  const startHour = 8;
  const endHour = 22;
  const intervalMinutes = 15;

  const startDate = new Date();
  startDate.setHours(0,0,0,0);

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const timeCursor = new Date(currentDate);
    timeCursor.setHours(startHour, 0, 0, 0);
    const endTime = new Date(currentDate);
    endTime.setHours(endHour, 0, 0, 0);

    while (timeCursor < endTime) {
      await prisma.appointment.create({ 
        data: { date: timeCursor, resourceId: iatreio.id, status: 'FREE', duration: 15 }
      })

      await prisma.appointment.create({ 
        data: { date: timeCursor, resourceId: laser.id, status: 'FREE', duration: 15 }
      })
      
      timeCursor.setMinutes(timeCursor.getMinutes() + intervalMinutes);
    }
  }
  console.log("✅ Έτοιμο! Το όνομα άλλαξε σε 'ΙΑΤΡΕΙΟ'.")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())