/** Normalize conservatively: a shared telephone alone never identifies a patient. */
export function normalizePatientName(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('el-GR')
}
export function normalizePatientPhone(value: string) {
  return value.replace(/[^0-9]/g, '').replace(/^0030(?=\d{10}$)/, '').replace(/^30(?=\d{10}$)/, '')
}
export function patientScope(resource: { id: number; groupId: number | null }) {
  return resource.groupId === null ? `resource:${resource.id}` : `group:${resource.groupId}`
}
