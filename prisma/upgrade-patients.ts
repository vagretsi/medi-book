import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { normalizePatientName, normalizePatientPhone, patientScope } from '../src/lib/patient-identity'

const prisma = new PrismaClient()
async function main() {
  const version = '001-patient-profiles'
  const sql = readFileSync(`${__dirname}/upgrades/${version}.sql`, 'utf8')
  const checksum = createHash('sha256').update(sql).digest('hex')
  const statements = sql.replace(/^--.*$/gm, '').split(';').map(item => item.trim()).filter(Boolean)
  if (process.argv.includes('--check-only')) {
    if (!statements.length || statements.some(statement => !/^(ALTER TABLE|CREATE TABLE|CREATE (UNIQUE )?INDEX)\b/.test(statement))) throw new Error('Unexpected migration statement')
    console.log(`Validated ${statements.length} additive migration statements. No database connection was made.`)
    return
  }
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(1342343, 1)`
    await tx.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS "_MediBookUpgrade" ("version" TEXT PRIMARY KEY, "checksum" TEXT NOT NULL, "appliedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)')
    const applied = await tx.$queryRaw<Array<{ checksum: string }>>`SELECT "checksum" FROM "_MediBookUpgrade" WHERE "version" = ${version}`
    if (applied.length) {
      if (applied[0].checksum !== checksum) throw new Error('Applied migration checksum differs. Do not edit applied SQL.')
      return
    }
    // This versioned migration contains ordinary DDL statements, no procedural bodies.
    for (const statement of statements) await tx.$executeRawUnsafe(statement)
    await tx.$executeRaw`INSERT INTO "_MediBookUpgrade" ("version", "checksum") VALUES (${version}, ${checksum})`
  }, { timeout: 60000 })
  console.log('Patient schema is up to date. Linking existing appointments...')
  let cursor = 0, linked = 0, skipped = 0
  while (true) {
    const appointments = await prisma.appointment.findMany({
      where: { id: { gt: cursor }, status: 'BOOKED', OR: [{ patientId: null }, { visit: null }] },
      orderBy: { id: 'asc' }, take: 100, select: { id: true, resourceId: true },
    })
    if (!appointments.length) break
    for (const row of appointments) {
      const didLink = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT "id" FROM "Resource" WHERE "id" = ${row.resourceId} FOR UPDATE`
        const apt = await tx.appointment.findUnique({ where: { id: row.id }, include: { resource: true, visit: true } })
        if (!apt || apt.status !== 'BOOKED' || apt.visit) return false
        const fullName = apt.patientName?.trim() ?? ''
        const phone = apt.patientTel?.trim() ?? ''
        const normalizedName = normalizePatientName(fullName), normalizedPhone = normalizePatientPhone(phone)
        if (!normalizedName || !normalizedPhone || fullName.length > 200 || phone.length > 40) return false
        const scopeKey = patientScope(apt.resource)
        const patient = await tx.patient.upsert({
          where: { scopeKey_normalizedName_normalizedPhone: { scopeKey, normalizedName, normalizedPhone } },
          create: { scopeKey, fullName, phone, normalizedName, normalizedPhone }, update: {},
        })
        await tx.patientVisit.create({ data: {
          patientId: patient.id, resourceId: apt.resourceId, appointmentId: apt.id,
          date: apt.date, duration: apt.duration, patientName: fullName, patientTel: phone,
          notes: apt.notes, status: 'SCHEDULED', createdAt: apt.createdAt,
        } })
        await tx.appointment.update({ where: { id: apt.id }, data: { patientId: patient.id } })
        return true
      })
      if (didLink) linked++; else skipped++
      cursor = row.id
    }
  }
  console.log(`Linked ${linked} appointments. Skipped ${skipped} records without complete identity or already linked. No attendance or payment was inferred.`)
}
main().catch((error: unknown) => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : 'UPGRADE_ERROR'
  console.error(`Upgrade error code: ${code}`)
  console.error('Patient upgrade failed. The application has not been restarted. Check database availability and migration state; rerun the upgrade to resume.'); process.exitCode = 1 }).finally(() => prisma.$disconnect())
