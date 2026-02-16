import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Ξεκινάει η δημιουργία προγράμματος...")

  // 1. Διασφάλιση Resources (Αν δεν υπάρχουν, τα φτιάχνει)
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
  
  // 2. Ρυθμίσεις Γεννήτριας
  const daysToGenerate = 30; // Για πόσες μέρες μπροστά
  const startHour = 9;       // 09:00
  const endHour = 21;        // 21:00
  const intervalMinutes = 30; // Κάθε 30 λεπτά

  const startDate = new Date();
  startDate.setHours(0,0,0,0);

  // 3. Loop για κάθε μέρα
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    console.log(`📅 Επεξεργασία: ${currentDate.toDateString()}`);

    // Loop για τις ώρες της ημέρας
    const timeCursor = new Date(currentDate);
    timeCursor.setHours(startHour, 0, 0, 0);
    
    const endTime = new Date(currentDate);
    endTime.setHours(endHour, 0, 0, 0);

    while (timeCursor < endTime) {
      
      // Δημιουργία για ΙΑΤΡΕΙΟ
      const existsIatreio = await prisma.appointment.findFirst({
        where: { resourceId: iatreio.id, date: timeCursor }
      })
      if (!existsIatreio) {
        await prisma.appointment.create({
          data: { date: timeCursor, resourceId: iatreio.id, status: 'FREE' }
        })
      }

      // Δημιουργία για LASER
      const existsLaser = await prisma.appointment.findFirst({
        where: { resourceId: laser.id, date: timeCursor }
      })
      if (!existsLaser) {
        await prisma.appointment.create({
          data: { date: timeCursor, resourceId: laser.id, status: 'FREE' }
        })
      }

      // Προχωράμε 30 λεπτά
      timeCursor.setMinutes(timeCursor.getMinutes() + intervalMinutes);
    }
  }
  
  console.log("✅ Ολοκληρώθηκε! Το πρόγραμμα γέμισε.")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())