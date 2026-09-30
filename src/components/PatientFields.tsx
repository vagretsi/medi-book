'use client'
import { useEffect, useState } from 'react'
import { searchPatients } from '@/app/actions'

type PatientOption = { id: number; fullName: string; phone: string }

export default function PatientFields({ resourceId, initialName = '', initialPhone = '', initialPatientId, disabled = false }: {
  resourceId?: number; initialName?: string; initialPhone?: string; initialPatientId?: number | null; disabled?: boolean
}) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [selected, setSelected] = useState<PatientOption | null>(initialPatientId ? { id: initialPatientId, fullName: initialName, phone: initialPhone } : null)
  const [selectedResourceId, setSelectedResourceId] = useState(resourceId)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<{ key: string; patients: PatientOption[]; failed: boolean } | null>(null)
  const key = `${resourceId}:${query}`
  useEffect(() => {
    if (!resourceId || query.trim().length < 2 || !open) return
    let active = true
    const timer = setTimeout(() => {
      searchPatients(query, resourceId).then(patients => { if (active) setResult({ key, patients, failed: false }) })
        .catch(() => { if (active) setResult({ key, patients: [], failed: true }) })
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [query, resourceId, key, open])
  const selectedMatches = selectedResourceId === resourceId && selected?.fullName === name && selected?.phone === phone
  function select(patient: PatientOption) {
    setName(patient.fullName); setPhone(patient.phone); setSelected(patient); setSelectedResourceId(resourceId); setOpen(false)
  }
  return <div className="patient-fields" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false) }}>
    <input type="hidden" name="patientId" value={selectedMatches ? selected?.id ?? '' : ''} />
    <label className="patient-field"><span>Όνομα ασθενή</span><input name="patientName" maxLength={200} aria-label="Όνομα ασθενή" value={name} required disabled={disabled} autoComplete="off" placeholder="Όνομα ή αναζήτηση ασθενούς..." onChange={event => { setName(event.target.value); setQuery(event.target.value); setSelected(null); setOpen(true) }} onFocus={() => { setQuery(name); setOpen(true) }} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false) } }} /></label>
    <label className="patient-field"><span>Τηλέφωνο</span><input name="patientTel" maxLength={40} aria-label="Τηλέφωνο" type="tel" value={phone} required disabled={disabled} autoComplete="off" placeholder="Τηλέφωνο ή αναζήτηση..." onChange={event => { setPhone(event.target.value); setQuery(event.target.value); setSelected(null); setOpen(true) }} onFocus={() => { setQuery(phone); setOpen(true) }} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false) } }} /></label>
    {selectedMatches && <p className="patient-selected">✓ Υπάρχων ασθενής</p>}
    {open && resourceId && query.trim().length >= 2 && <div className="patient-suggestions" aria-label="Προτεινόμενοι ασθενείς">
      {result?.key !== key ? <p role="status">Αναζήτηση...</p> : result.failed ? <p role="status">Η αναζήτηση δεν είναι διαθέσιμη. Μπορείς να συμπληρώσεις τα στοιχεία.</p> : result.patients.length ? result.patients.map(patient => <button key={patient.id} type="button" onClick={() => select(patient)}><strong>{patient.fullName}</strong><span>{patient.phone}</span></button>) : <p>Νέος ασθενής — το προφίλ δημιουργείται με την κράτηση.</p>}
    </div>}
  </div>
}
