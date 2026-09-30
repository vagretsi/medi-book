'use client'
import { useEffect, useState } from 'react'
import { ArrowLeft, X, UserRound, Search, Loader2 } from 'lucide-react'
import { getPatientProfile, searchPatients } from '@/app/actions'
import { formatBusinessDate, formatBusinessTime } from '@/lib/business-time'
import ModalFrame from './ModalFrame'

type Profile = NonNullable<Awaited<ReturnType<typeof getPatientProfile>>>
const statusLabels: Record<string, string> = { SCHEDULED: 'Προγραμματισμένο', COMPLETED: 'Ολοκληρώθηκε', CANCELLED: 'Ακυρώθηκε', NO_SHOW: 'Δεν προσήλθε' }
const money = (amount: string, currency: string) => new Intl.NumberFormat('el-GR', { style: 'currency', currency }).format(Number(amount))

function ProfileContent({ id }: { id: number }) {
  const [page, setPage] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; profile: Profile | null; error: boolean } | null>(null)
  const key = `${id}:${page}:${attempt}`
  useEffect(() => {
    let active = true
    getPatientProfile(id, page).then(profile => { if (active) setResult({ key, profile, error: false }) }).catch(() => { if (active) setResult({ key, profile: null, error: true }) })
    return () => { active = false }
  }, [id, page, key])
  if (result?.key !== key) return <p className="patient-loading" role="status"><Loader2 size={18} className="animate-spin" /> Φόρτωση προφίλ...</p>
  if (result.error) return <p className="error-banner" role="alert">Δεν ήταν δυνατή η φόρτωση. <button onClick={() => setAttempt(value => value + 1)}>Επανάληψη</button></p>
  if (!result.profile) return <p className="patient-loading">Το προφίλ δεν είναι διαθέσιμο.</p>
  const { patient, visits, hasMore } = result.profile
  return <div className="patient-profile">
    <div className="patient-profile-heading"><span className="patient-profile-avatar"><UserRound size={24} /></span><div><h2>{patient.fullName}</h2><a href={`tel:${patient.phone}`}>{patient.phone}</a></div></div>
    {patient.email && <p>{patient.email}</p>}
    {patient.dateOfBirth && <p>Ημ. γέννησης: {formatBusinessDate(patient.dateOfBirth)}</p>}
    {patient.notes && <p className="profile-notes">{patient.notes}</p>}
    <h3>Ιστορικό ραντεβού</h3>
    {visits.map(visit => <article key={visit.id} className="patient-visit"><div className="patient-visit-heading"><strong>{formatBusinessDate(visit.date)} · {formatBusinessTime(visit.date)}</strong><span>{statusLabels[visit.status] ?? visit.status}</span></div><p>{visit.resourceName} · {visit.duration}′{visit.serviceName ? ` · ${visit.serviceName}` : ''}</p>{visit.notes && <p className="profile-notes">{visit.notes}</p>}<div className="visit-finances"><p>Χρέωση: {visit.chargedAmount === null ? 'Δεν έχει καταγραφεί' : money(visit.chargedAmount, visit.currency)}</p>{visit.payments.length ? visit.payments.map(payment => <p key={payment.id}>Πληρωμή {money(payment.amount, payment.currency)} · {formatBusinessDate(payment.paidAt)}{payment.method ? ` · ${payment.method}` : ''}</p>) : <p>Δεν έχουν καταγραφεί πληρωμές.</p>}</div></article>)}
    {!visits.length && <p className="muted">Δεν υπάρχουν ραντεβού σε αυτή τη σελίδα.</p>}
    <div className="patient-pagination"><button disabled={page === 0} onClick={() => setPage(value => value - 1)}>Προηγούμενα</button><span>{page + 1}</span><button disabled={!hasMore} onClick={() => setPage(value => value + 1)}>Επόμενα</button></div>
  </div>
}

export default function PatientBrowser({ patientId, onClose }: { patientId?: number; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState(patientId)
  const [query, setQuery] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; patients: Awaited<ReturnType<typeof searchPatients>>; error: boolean } | null>(null)
  const key = `${query}:${attempt}`
  useEffect(() => {
    if (selectedId) return
    let active = true
    const timer = setTimeout(() => {
      searchPatients(query).then(patients => { if (active) setResult({ key, patients, error: false }) }).catch(() => { if (active) setResult({ key, patients: [], error: true }) })
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [query, selectedId, key])
  return <ModalFrame title={selectedId ? 'Προφίλ ασθενούς' : 'Ασθενείς'} onClose={onClose}><div className="patient-browser-header">{selectedId && !patientId && <button className="icon-button" aria-label="Πίσω στους ασθενείς" onClick={() => setSelectedId(undefined)}><ArrowLeft size={18} /></button>}<h2>{selectedId ? 'Προφίλ ασθενούς' : 'Ασθενείς'}</h2><button className="icon-button" aria-label="Κλείσιμο" onClick={onClose}><X size={20} /></button></div>{selectedId ? <ProfileContent key={selectedId} id={selectedId} /> : <div className="patient-directory"><label className="search-field"><Search size={17} /><input aria-label="Αναζήτηση ασθενών" placeholder="Όνομα ή τηλέφωνο" value={query} onChange={event => setQuery(event.target.value)} /></label>{result?.key !== key ? <p className="patient-loading" role="status">Αναζήτηση...</p> : result.error ? <p className="error-banner" role="alert">Δεν ήταν δυνατή η φόρτωση. <button onClick={() => setAttempt(value => value + 1)}>Επανάληψη</button></p> : <><div className="patient-suggestions">{result.patients.map(patient => <button type="button" key={patient.id} onClick={() => setSelectedId(patient.id)}><strong>{patient.fullName}</strong><span>{patient.phone}</span></button>)}</div>{!result.patients.length && <p className="patient-loading">Δεν βρέθηκαν ασθενείς.</p>}{result.patients.length === 20 && <p className="muted">Εμφανίζονται έως 20 ασθενείς. Περιόρισε την αναζήτηση.</p>}</>}</div>}</ModalFrame>
}
