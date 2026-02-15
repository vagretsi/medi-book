import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const res = await prisma.resource.create({
    data: { 
      name: 'ΙΑΤΡΕΙΟ ΔΟΚΙΜΗ', 
      type: 'MEDICAL',
      appointments: {
        create: [
          { date: new Date(), status: 'FREE' },
          { date: new Date(new Date().getTime() + 3600000), status: 'FREE' }
        ]
      }
    }
  })
  console.log("Έτοιμο! Κάνε refresh το site.")
}
main()