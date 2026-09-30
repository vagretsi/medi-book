'use client'
import { useState, useCallback } from 'react'
import { useCalendarDaySlots } from './useCalendarDaySlots'
import { getAppointmentTimeError } from '@/lib/appointment-duration'
import PatientFields from './PatientFields'
import ModalFrame from './ModalFrame'
import { updateAppointment, cancelAppointment } from '@/app/actions'
import { X, FileText, Trash2, Save, Clock } from 'lucide-react'
import { businessDateKey, formatBusinessTime } from '@/lib/business-time'
import { getVisibleSlots } from '@/lib/visible-slots'
import type { AppointmentSlot } from '@/lib/calendar-types'

// ΠΡΟΣΟΧΗ: Εδώ προσθέσαμε το onRefresh
export default function EditModal({ apt, appointments, onClose, onRefresh }: { apt: AppointmentSlot, appointments: AppointmentSlot[], onClose: () => void, onRefresh: (targetDate?: Date) => Promise<void> }) {
  const originalDate = businessDateKey(apt.date)
  const [selectedDate, setSelectedDate] = useState(originalDate)
  const daySlots = useCalendarDaySlots(selectedDate, apt.resourceId, originalDate, appointments)
  const [targetAptId, setTargetAptId] = useState(String(apt.id))
  // Release this booking only for the preview of available start times.
  const timeOptions = getVisibleSlots(daySlots.slots.filter(slot => slot.resourceId === apt.resourceId).map(slot => slot.id === apt.id ? { ...slot, status: 'FREE', duration: 15 } : slot))
    .filter(slot => slot.status === 'FREE' || slot.id === apt.id)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date))
  if (selectedDate === originalDate && !timeOptions.some(slot => slot.id === apt.id)) timeOptions.push(apt)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const close = useCallback(() => { if (!loading) onClose() }, [loading, onClose])

  async function handleUpdate(formData: FormData) {
    const destination = timeOptions.find(slot => String(slot.id) === targetAptId)
    if (loading || daySlots.loading || daySlots.error || !destination) return
    const timeError = getAppointmentTimeError(destination.date, Number(formData.get('duration')))
    if (timeError) { setError(timeError); return }
    setLoading(true)
    setError('')
    try {
      const result = await updateAppointment(formData)
      if (result.error) { setError(result.error); return }
      await onRefresh(new Date(destination.date))
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Δεν ήταν δυνατή η αποθήκευση.')
    } finally { setLoading(false) }
  }

  async function handleCancel(formData: FormData) {
    if(!confirm("Είστε σίγουροι για την ακύρωση;")) return;
    setLoading(true)
    setError('')
    try {
      await cancelAppointment(formData)
      await onRefresh()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Δεν ήταν δυνατή η αποθήκευση.')
    } finally { setLoading(false) }
  }

  return (
    <ModalFrame title="Επεξεργασία ραντεβού" onClose={close}>
        
        {/* HEADER */}
        <div className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700">
          <h3 className="font-bold text-white text-lg">Επεξεργασία Ραντεβού</h3>
          <button aria-label="Κλείσιμο" disabled={loading} onClick={close} className="hover:bg-white/10 p-2 rounded-full text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 space-y-6">
          <form onSubmit={event => { event.preventDefault(); void handleUpdate(new FormData(event.currentTarget)) }} className="space-y-4">
            {error && <p className="error-banner" role="alert">{error}</p>}
          <input type="hidden" name="aptId" value={apt.id} />
            <div className="space-y-2">
              <label htmlFor="edit-booking-date" className="text-[10px] font-black text-blue-400 uppercase">Ημερομηνία</label>
              <input id="edit-booking-date" type="date" value={selectedDate} disabled={loading} required onChange={event => { setSelectedDate(event.target.value); setTargetAptId(''); setError('') }} className="w-full p-3 rounded-xl" />
            </div>
            {daySlots.error && <p className="error-banner" role="alert">{daySlots.error} <button type="button" onClick={daySlots.retry}>Επανάληψη</button></p>}
            <div className="space-y-2">
              <label htmlFor="edit-booking-time" className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-2"><Clock className="w-3 h-3" /> Ώρα</label>
              <select id="edit-booking-time" name="targetAptId" value={targetAptId} disabled={loading || daySlots.loading || !timeOptions.length} onChange={event => { setTargetAptId(event.target.value); setError('') }} className="w-full p-3 rounded-xl" required>
                <option value="" disabled>{daySlots.loading ? 'Φόρτωση ωρών...' : timeOptions.length ? 'Επίλεξε ώρα' : 'Δεν υπάρχουν διαθέσιμες ώρες'}</option>
                {timeOptions.map(slot => <option key={slot.id} value={slot.id}>{formatBusinessTime(slot.date)}</option>)}
              </select>
            </div>
            
            <PatientFields key={apt.id} resourceId={apt.resourceId} initialName={apt.patientName ?? ''} initialPhone={apt.patientTel ?? ''} initialPatientId={apt.patientId} disabled={loading} />
          <div>
            <div className="space-y-2">
                 <label className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-2"><Clock className="w-3 h-3"/> Διάρκεια</label>
                 <select aria-label="Διάρκεια" name="duration" defaultValue={apt.duration || 30} className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl focus:border-blue-500 outline-none">
                    <option value="15">15 Λεπτά</option>
                    <option value="30">30 Λεπτά</option>
                    <option value="45">45 Λεπτά</option>
                    <option value="60">1 Ώρα</option>
                    <option value="90">1.5 Ώρα</option>
                  <option value="240">4 Ώρες</option>
                  <option value="480">8 Ώρες</option>
                 </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-2"><FileText className="w-3 h-3"/> Σημειώσεις</label>
              <textarea aria-label="Σημειώσεις" name="notes" defaultValue={apt.notes ?? ''} rows={3} className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl focus:border-blue-500 outline-none" />
            </div>

            <button type="submit" disabled={loading || daySlots.loading || Boolean(daySlots.error) || !targetAptId} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
              <Save className="w-4 h-4" /> {loading ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
            </button>
          </form>

          {/* DELETE BUTTON */}
          <form action={handleCancel} className="pt-4 border-t border-slate-700/50">
            <input type="hidden" name="aptId" value={apt.id} />
            <button type="submit" disabled={loading} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-red-500/20">
              <Trash2 className="w-4 h-4" /> Ακύρωση Ραντεβού
            </button>
          </form>
        </div>
    </ModalFrame>
  )
}
