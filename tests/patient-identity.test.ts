import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { normalizePatientName, normalizePatientPhone, patientScope } from '../src/lib/patient-identity'
import { resourceVisibility } from '../src/lib/resource-access'

test('name identity tolerates whitespace and case without fuzzy merging', () => {
  assert.equal(normalizePatientName('  ΕΛΈΝΗ   ΠΑΠΆ  '), normalizePatientName('Ελένη Παπά'))
  assert.notEqual(normalizePatientName('Ελένη Παπά'), normalizePatientName('Μαρία Παπά'))
})
test('Greek country prefixes and phone formatting resolve to the same number', () => {
  assert.equal(normalizePatientPhone('+30 691 234 5678'), '6912345678')
  assert.equal(normalizePatientPhone('0030-6912345678'), '6912345678')
  assert.equal(normalizePatientPhone('6912345678'), '6912345678')
  assert.equal(normalizePatientPhone('+44 7700 900123'), '447700900123')
})
test('same phone with different patient names is a different identity', () => {
  const key = (name: string) => JSON.stringify([normalizePatientName(name), normalizePatientPhone('6912345678')])
  assert.notEqual(key('Μαρία'), key('Ελένη'))
})
test('patient identities share a group but never share unrelated calendar scopes', () => {
  assert.equal(patientScope({ id: 1, groupId: 5 }), patientScope({ id: 2, groupId: 5 }))
  assert.notEqual(patientScope({ id: 1, groupId: null }), patientScope({ id: 2, groupId: null }))
  assert.notEqual(patientScope({ id: 1, groupId: 5 }), patientScope({ id: 1, groupId: 6 }))
})
test('patient history reuses the calendar visibility boundaries', () => {
  assert.deepEqual(resourceVisibility({ id: 7, role: 'USER', groupId: null }), { accesses: { some: { userId: 7 } } })
  assert.deepEqual(resourceVisibility({ id: 7, role: 'ADMIN', groupId: 4 }), { groupId: 4 })
  assert.deepEqual(resourceVisibility({ id: 7, role: 'ADMIN', groupId: null }), { groupId: null })
  assert.deepEqual(resourceVisibility({ id: 7, role: 'SUPER_ADMIN', groupId: null }), {})
})
