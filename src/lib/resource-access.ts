import type { Prisma } from '@prisma/client'

type UserAccess = { id: number; role: string; groupId: number | null }
/** The same visibility boundary applies to calendars, patient search, and visit history. */
export function resourceVisibility(user: UserAccess): Prisma.ResourceWhereInput {
  if (user.role === 'SUPER_ADMIN') return {}
  if (user.groupId) return { groupId: user.groupId }
  if (user.role === 'ADMIN') return { groupId: null }
  return { accesses: { some: { userId: user.id } } }
}
