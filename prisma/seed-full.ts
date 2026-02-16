import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("☢️  HARD RESET: Διαγραφή όλων των ραντεβού...")
  
  // 1. ΔΙΑΓΡΑΦΗ ΟΛΩΝ (Καθαρίζει τα 02:02, 03:02 και τα λάθος ωράρια)
  await prisma.appointment.deleteMany({})
  console.log("🗑️  Η βάση άδειασε.")

  console.log("🚀 Γέμισμα με 15-λεπτα slots (08:00 - 22:00)...")

  // 2. Resources (Ιατρείο & Laser)
  const iatreio = await prisma.resource.upsert({ where: { id: 1 }, update: {}, create: { name: 'ΙΑΤΡΕΙΟ', type: 'MEDICAL' }})
  const laser = await prisma.resource.upsert({ where: { id: 2 }, update: {}, create: { name: 'LASER', type: 'LASER' }})
  
  // 3. Ρυθμίσεις (Για 45 μέρες)
  const daysToGenerate = 45; 
  const startHour = 8;        // 08:00
  const endHour = 22;         // 22:00
  const intervalMinutes = 15; // 15 Λεπτά

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
      // Create IATREIO
      await prisma.appointment.create({ 
        data: { date: timeCursor, resourceId: iatreio.id, status: 'FREE', duration: 15 }
      })

      // Create LASER
      await prisma.appointment.create({ 
        data: { date: timeCursor, resourceId: laser.id, status: 'FREE', duration: 15 }
      })
      
      timeCursor.setMinutes(timeCursor.getMinutes() + intervalMinutes);
    }
  }
  console.log("✅ Έτοιμο! Το νέο πρόγραμμα χτίστηκε σωστά.")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())