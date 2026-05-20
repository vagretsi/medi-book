import { Prisma, PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_USERNAME = 'demo'
const DEMO_PASSWORD = 'demo'
const DEMO_RESOURCE_NAME = 'DEMO ΗΜΕΡΟΛΟΓΙΟ'
const DEMO_RESOURCE_TYPE = 'DEMO'

const DAYS_TO_GENERATE = 45
const START_HOUR = 8
const END_HOUR = 22
const SLOT_INTERVAL_MINUTES = 15

async function upsertDemoResource() {
  const existing = await prisma.resource.findFirst({
    where: { name: DEMO_RESOURCE_NAME },
  })

  if (existing) {
    return prisma.resource.update({
      where: { id: existing.id },
      data: {
        name: DEMO_RESOURCE_NAME,
        type: DEMO_RESOURCE_TYPE,
      },
    })
  }

  return prisma.resource.create({
    data: {
      name: DEMO_RESOURCE_NAME,
      type: DEMO_RESOURCE_TYPE,
    },
  })
}

async function ensureDemoSlots(resourceId: number) {
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)

  const pendingCreates: Prisma.AppointmentCreateManyInput[] = []

  for (let day = 0; day < DAYS_TO_GENERATE; day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + day)

    const timeCursor = new Date(currentDate)
    timeCursor.setHours(START_HOUR, 0, 0, 0)

    const endTime = new Date(currentDate)
    endTime.setHours(END_HOUR, 0, 0, 0)

    while (timeCursor < endTime) {
      pendingCreates.push({
        date: new Date(timeCursor),
        resourceId,
        status: 'FREE',
        duration: SLOT_INTERVAL_MINUTES,
      })

      timeCursor.setMinutes(timeCursor.getMinutes() + SLOT_INTERVAL_MINUTES)
    }
  }

  for (let index = 0; index < pendingCreates.length; index += 500) {
    await prisma.appointment.createMany({
      data: pendingCreates.slice(index, index + 500),
      skipDuplicates: true,
    })
  }
}

async function main() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10)

  const demoUser = await prisma.user.upsert({
    where: { username: DEMO_USERNAME },
    update: {
      password: hashedPassword,
      role: 'USER',
    },
    create: {
      username: DEMO_USERNAME,
      password: hashedPassword,
      role: 'USER',
    },
  })

  const demoResource = await upsertDemoResource()

  await prisma.resourceAccess.upsert({
    where: {
      userId_resourceId: {
        userId: demoUser.id,
        resourceId: demoResource.id,
      },
    },
    update: { canWrite: false },
    create: {
      userId: demoUser.id,
      resourceId: demoResource.id,
      canWrite: false,
    },
  })

  await ensureDemoSlots(demoResource.id)

  console.log(`Demo ready: ${DEMO_USERNAME}/${DEMO_PASSWORD} -> ${DEMO_RESOURCE_NAME} (read-only)`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
