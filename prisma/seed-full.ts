import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Ξεκινάει η δημιουργία προγράμματος...")

  // 1. Δημιουργία/Εύρεση Ιατρείου & Laser
  const iatreio = await prisma.resource.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'ΙΑΤΡΕΙΟ', type: 'MEDICAL' }
  })

  const laser = await prisma.resource.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'LASER', type: 'LASER' }
  })
  
  // 2. Ρυθμίσεις: 30 μέρες, 09:00-21:00, ανά 30 λεπτά
  const daysToGenerate = 30; 
  const startHour = 9;       
  const endHour = 21;        
  const intervalMinutes = 30; 

  const startDate = new Date();
  startDate.setHours(0,0,0,0);

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Ωράριο για κάθε μέρα
    const timeCursor = new Date(currentDate);
    timeCursor.setHours(startHour, 0, 0, 0);
    const endTime = new Date(currentDate);
    endTime.setHours(endHour, 0, 0, 0);

    while (timeCursor < endTime) {
      // Slot Ιατρείου
      const existsIatreio = await prisma.appointment.findFirst({
        where: { resourceId: iatreio.id, date: timeCursor }
      })
      if (!existsIatreio) {
        await prisma.appointment.create({
          data: { date: timeCursor, resourceId: iatreio.id, status: 'FREE' }
        })
      }

      // Slot Laser
      const existsLaser = await prisma.appointment.findFirst({
        where: { resourceId: laser.id, date: timeCursor }
      })
      if (!existsLaser) {
        await prisma.appointment.create({
          data: { date: timeCursor, resourceId: laser.id, status: 'FREE' }
        })
      }
      
      // +30 λεπτά
      timeCursor.setMinutes(timeCursor.getMinutes() + intervalMinutes);
    }
  }
  console.log("✅ Έτοιμο! Το πρόγραμμα γέμισε.")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())