import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs' // <--- ΝΕΟ IMPORT

const prisma = new PrismaClient()

async function main() {
  console.log("🛠️  HARD RESET & ADMIN CREATION...")
  
  // 1. Καθαρισμός
  await prisma.appointment.deleteMany({})
  // Προσοχή: Δεν διαγράφουμε τα DayNotes ή τους Users κάθε φορά, αλλά για τώρα ας τα αφήσουμε
  // Αν θες να σβήνεις και users: await prisma.user.deleteMany({}) 

  console.log("🗑️  Τα ραντεβού καθαρίστηκαν.")

 // 2. Δημιουργία ή Ενημέρωση χρηστών
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const demoPassword = await bcrypt.hash("demo", 10);

  const internalGroup = await prisma.calendarGroup.upsert({
    where: { slug: 'medibook-internal' },
    update: { name: 'MediBook Internal' },
    create: { name: 'MediBook Internal', slug: 'medibook-internal' },
  })

  const demoGroup = await prisma.calendarGroup.upsert({
    where: { slug: 'demo-company' },
    update: { name: 'Demo Company' },
    create: { name: 'Demo Company', slug: 'demo-company' },
  })
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { 
      password: hashedPassword, // <--- ΠΡΟΣΘΕΣΕ ΑΥΤΟ για να ανανεώνεται ο κωδικός
      role: 'ADMIN',
      canWrite: true,
    }, 
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      canWrite: true,
    }
  });

  const demo = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {
      password: demoPassword,
      role: 'USER',
      groupId: demoGroup.id,
      canWrite: false,
    },
    create: {
      username: 'demo',
      password: demoPassword,
      role: 'USER',
      groupId: demoGroup.id,
      canWrite: false,
    },
  })

  // 3. Resources
  console.log("🚀 Γέμισμα με 15-λεπτα slots...")
  
  const iatreio = await prisma.resource.upsert({ 
    where: { id: 1 }, 
    update: { name: 'ΙΑΤΡΕΙΟ', groupId: internalGroup.id }, 
    create: { name: 'ΙΑΤΡΕΙΟ', type: 'MEDICAL', groupId: internalGroup.id }
  })

  const laser = await prisma.resource.upsert({ 
    where: { id: 2 }, 
    update: { name: 'LASER', groupId: internalGroup.id }, 
    create: { name: 'LASER', type: 'LASER', groupId: internalGroup.id }
  })

  const demoCalendar = await prisma.resource.upsert({
    where: { id: 3 },
    update: { name: 'DEMO ΗΜΕΡΟΛΟΓΙΟ', type: 'DEMO', groupId: demoGroup.id },
    create: { name: 'DEMO ΗΜΕΡΟΛΟΓΙΟ', type: 'DEMO', groupId: demoGroup.id }
  })

  await prisma.resourceAccess.upsert({
    where: {
      userId_resourceId: {
        userId: demo.id,
        resourceId: demoCalendar.id,
      },
    },
    update: { canWrite: false },
    create: {
      userId: demo.id,
      resourceId: demoCalendar.id,
      canWrite: false,
    },
  })

  const seedResources = [iatreio, laser, demoCalendar]
  
  // 4. Ρυθμίσεις Ωραρίου
  const daysToGenerate = 45; 
  const startHour = 8;
  const endHour = 22;
  const intervalMinutes = 15;

  const startDate = new Date();
  startDate.setUTCHours(0,0,0,0);

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(startDate);
    currentDate.setUTCDate(startDate.getUTCDate() + i);
    
    const timeCursor = new Date(currentDate);
    timeCursor.setUTCHours(startHour, 0, 0, 0);
    const endTime = new Date(currentDate);
    endTime.setUTCHours(endHour, 0, 0, 0);

    while (timeCursor < endTime) {
      for (const resource of seedResources) {
        await prisma.appointment.create({ 
          data: { date: timeCursor, resourceId: resource.id, status: 'FREE', duration: 15 }
        })
      }
      
      timeCursor.setUTCMinutes(timeCursor.getUTCMinutes() + intervalMinutes);
    }
  }
  console.log("✅ Έτοιμο! Admin, demo user & Πρόγραμμα δημιουργήθηκαν.")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
