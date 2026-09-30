'use client'
import { useState, type CSSProperties } from 'react'
import { Phone, Pencil, Plus, CalendarDays } from 'lucide-react'
import BookingModal from './BookingModal'
import EditModal from './EditModal'
import type { AppointmentSlot } from '@/lib/calendar-types'
import { formatBusinessTime } from '@/lib/business-time'
import { getVisibleSlots } from '@/lib/visible-slots'

export default function BookingManager({ appointments, onRefresh, canWrite, resourceName, query = '', filter = 'all' }: { appointments: AppointmentSlot[], onRefresh: (targetDate?: Date) => Promise<void>, canWrite: boolean, resourceName: string, query?: string, filter?: string }) {
  const [selectedApt, setSelectedApt] = useState<AppointmentSlot | null>(null)
  const [editingApt, setEditingApt] = useState<AppointmentSlot | null>(null)
  const normalized = query.trim().toLocaleLowerCase('el')
  const visible = getVisibleSlots(appointments).filter(a => (filter === 'all' || a.status === filter) && (!normalized || `${a.patientName ?? ''} ${a.patientTel ?? ''}`.toLocaleLowerCase('el').includes(normalized)))
  return (
    <div className="booking-list">
      {visible.length === 0 && <div className="empty-state"><CalendarDays size={25} /><h3>{appointments.length ? 'Δεν βρέθηκαν αποτελέσματα' : 'Χωρίς διαθέσιμες ώρες'}</h3><p>{appointments.length ? 'Δοκίμασε άλλη αναζήτηση ή φίλτρο.' : 'Επίλεξε μια διαφορετική ημέρα.'}</p></div>}
      {visible.map(apt => <div key={apt.id} style={{ '--slot-span': apt.status === 'BOOKED' ? Math.max(1, apt.duration / 15) : 1 } as CSSProperties} className={`appointment-row ${apt.status === 'BOOKED' ? 'is-booked' : 'is-free'}`}>
        <div className="appointment-time">{formatBusinessTime(apt.date)}<small>{apt.status === 'BOOKED' ? apt.duration : 15}′</small>{apt.status === 'BOOKED' && apt.duration > 15 && <small className="appointment-end">έως {formatBusinessTime(new Date(+new Date(apt.date) + apt.duration * 60_000))}</small>}</div>
        {apt.status === 'BOOKED' ? <div className="appointment-content"><div className="patient-avatar">{apt.patientName?.charAt(0).toUpperCase() || '•'}</div><div className="patient-details"><strong>{apt.patientName}</strong><span><Phone size={11} />{apt.patientTel}</span>{apt.notes && <p title={apt.notes}>{apt.notes}</p>}</div>{canWrite && <button className="edit-booking" aria-label={`Επεξεργασία ραντεβού ${apt.patientName}`} onClick={() => setEditingApt(apt)}><Pencil size={14} /></button>}</div> : <div className="appointment-content"><span className="available-label"><span /> Διαθέσιμο</span>{canWrite ? <button className="book-button" aria-label={`Κράτηση στις ${formatBusinessTime(apt.date)}`} onClick={() => setSelectedApt(apt)}><Plus size={14} /> Κράτηση</button> : <span className="read-only-label">Προβολή</span>}</div>}
      </div>)}
      {selectedApt && <BookingModal appointments={appointments} resourceName={resourceName} apt={selectedApt} onClose={() => setSelectedApt(null)} onRefresh={onRefresh} canWrite={canWrite} />}
      {editingApt && canWrite && <EditModal apt={editingApt} onClose={() => setEditingApt(null)} onRefresh={onRefresh} />}
    </div>
  )
}
