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

 // 2. Δημιουργία ή Ενημέρωση ADMIN Χρήστη
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { 
      password: hashedPassword // <--- ΠΡΟΣΘΕΣΕ ΑΥΤΟ για να ανανεώνεται ο κωδικός
    }, 
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  // 3. Resources
  console.log("🚀 Γέμισμα με 15-λεπτα slots...")
  
  const iatreio = await prisma.resource.upsert({ 
    where: { id: 1 }, 
    update: { name: 'ΙΑΤΡΕΙΟ' }, 
    create: { name: 'ΙΑΤΡΕΙΟ', type: 'MEDICAL' }
  })

  const laser = await prisma.resource.upsert({ 
    where: { id: 2 }, 
    update: { name: 'LASER' }, 
    create: { name: 'LASER', type: 'LASER' }
  })
  
  // 4. Ρυθμίσεις Ωραρίου
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
  console.log("✅ Έτοιμο! Admin & Πρόγραμμα δημιουργήθηκαν.")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
