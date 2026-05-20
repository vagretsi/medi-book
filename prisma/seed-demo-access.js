const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const DEMO_USERNAME = 'demo'
const DEMO_PASSWORD = 'demo'
const ADMIN_USERNAME = 'admin'
const INTERNAL_GROUP_NAME = 'MediBook Internal'
const INTERNAL_GROUP_SLUG = 'medibook-internal'
const DEMO_GROUP_NAME = 'Demo Company'
const DEMO_GROUP_SLUG = 'demo-company'
const DEMO_RESOURCE_NAME = 'DEMO ΗΜΕΡΟΛΟΓΙΟ'
const DEMO_RESOURCE_TYPE = 'DEMO'

const DAYS_TO_GENERATE = 45
const START_HOUR = 8
const END_HOUR = 22
const SLOT_INTERVAL_MINUTES = 15

async function ensureDemoSlots(resourceId) {
  const startDate = new Date()
  startDate.setUTCHours(0, 0, 0, 0)

  const pendingCreates = []

  for (let day = 0; day < DAYS_TO_GENERATE; day++) {
    const currentDate = new Date(startDate)
    currentDate.setUTCDate(startDate.getUTCDate() + day)

    const timeCursor = new Date(currentDate)
    timeCursor.setUTCHours(START_HOUR, 0, 0, 0)

    const endTime = new Date(currentDate)
    endTime.setUTCHours(END_HOUR, 0, 0, 0)

    while (timeCursor < endTime) {
      pendingCreates.push({
        date: new Date(timeCursor),
        resourceId,
        status: 'FREE',
        duration: SLOT_INTERVAL_MINUTES,
      })

      timeCursor.setUTCMinutes(timeCursor.getUTCMinutes() + SLOT_INTERVAL_MINUTES)
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

  const internalGroup = await prisma.calendarGroup.upsert({
    where: { slug: INTERNAL_GROUP_SLUG },
    update: { name: INTERNAL_GROUP_NAME },
    create: {
      name: INTERNAL_GROUP_NAME,
      slug: INTERNAL_GROUP_SLUG,
    },
  })

  const demoGroup = await prisma.calendarGroup.upsert({
    where: { slug: DEMO_GROUP_SLUG },
    update: { name: DEMO_GROUP_NAME },
    create: {
      name: DEMO_GROUP_NAME,
      slug: DEMO_GROUP_SLUG,
    },
  })

  await prisma.user.updateMany({
    where: { username: ADMIN_USERNAME },
    data: {
      role: 'ADMIN',
      groupId: internalGroup.id,
      canWrite: true,
    },
  })

  await prisma.resource.updateMany({
    where: {
      OR: [
        { id: 1 },
        { id: 2 },
        { name: 'ΙΑΤΡΕΙΟ' },
        { name: 'LASER' },
      ],
    },
    data: { groupId: internalGroup.id },
  })

  await prisma.dayNote.updateMany({
    where: { groupId: null },
    data: { groupId: internalGroup.id },
  })

  const demoUser = await prisma.user.upsert({
    where: { username: DEMO_USERNAME },
    update: {
      password: hashedPassword,
      role: 'USER',
      groupId: demoGroup.id,
      canWrite: false,
    },
    create: {
      username: DEMO_USERNAME,
      password: hashedPassword,
      role: 'USER',
      groupId: demoGroup.id,
      canWrite: false,
    },
  })

  const existingDemoResource = await prisma.resource.findFirst({
    where: { name: DEMO_RESOURCE_NAME },
  })

  const demoResource = existingDemoResource
    ? await prisma.resource.update({
        where: { id: existingDemoResource.id },
        data: {
          name: DEMO_RESOURCE_NAME,
          type: DEMO_RESOURCE_TYPE,
          groupId: demoGroup.id,
        },
      })
    : await prisma.resource.create({
        data: {
          name: DEMO_RESOURCE_NAME,
          type: DEMO_RESOURCE_TYPE,
          groupId: demoGroup.id,
        },
      })

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

  console.log({
    demo: {
      id: demoUser.id,
      username: demoUser.username,
      role: demoUser.role,
      groupId: demoUser.groupId,
      canWrite: demoUser.canWrite,
    },
    internalGroup,
    group: demoGroup,
    resource: demoResource,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
