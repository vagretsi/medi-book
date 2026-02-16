import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("🚀 Γέμισμα με 15-λεπτα slots (08:00 - 22:00)...")

  // 1. Resources
  const iatreio = await prisma.resource.upsert({ where: { id: 1 }, update: {}, create: { name: 'ΙΑΤΡΕΙΟ', type: 'MEDICAL' }})
  const laser = await prisma.resource.upsert({ where: { id: 2 }, update: {}, create: { name: 'LASER', type: 'LASER' }})
  
  // 2. Ρυθμίσεις
  const daysToGenerate = 30; 
  const startHour = 8;        // 08:00
  const endHour = 22;         // 22:00
  const intervalMinutes = 15; // <--- ΣΗΜΑΝΤΙΚΟ: Κάθε 15 λεπτά

  const startDate = new Date();
  startDate.setHours(0,0,0,0);

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const timeCursor = new Date(currentDate);
    timeCursor.setHours(startHour, 0, 0, 0);
    const endTime = new Date(currentDate);
    endTime.setHours(endHour, 0, 0, 0);

    while (timeCursor < endTime) { // < αντί για <= για να μην φτιάξει slot στις 22:00 ακριβώς
      
      // IATREIO
      const existsIatreio = await prisma.appointment.findFirst({ where: { resourceId: iatreio.id, date: timeCursor }})
      if (!existsIatreio) await prisma.appointment.create({ data: { date: timeCursor, resourceId: iatreio.id, status: 'FREE', duration: 15 }})

      // LASER
      const existsLaser = await prisma.appointment.findFirst({ where: { resourceId: laser.id, date: timeCursor }})
      if (!existsLaser) await prisma.appointment.create({ data: { date: timeCursor, resourceId: laser.id, status: 'FREE', duration: 15 }})
      
      timeCursor.setMinutes(timeCursor.getMinutes() + intervalMinutes);
    }
  }
  console.log("✅ Έτοιμο! Το timeline είναι έτοιμο.")
}

main().catch((e) => console.error(e)).finally(async () => await prisma.$disconnect())