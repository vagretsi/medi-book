'use client'
import { useState, useCallback } from 'react'
import ModalFrame from './ModalFrame'
import { bookAppointment } from '@/app/actions'
import { X, CalendarCheck, Clock } from 'lucide-react'
import type { AppointmentSlot } from '@/lib/calendar-types'
import { formatBusinessTime } from '@/lib/business-time'

// ΠΡΟΣΟΧΗ: Εδώ προσθέσαμε το onRefresh
export default function BookingModal({ apt, onClose, onRefresh, canWrite }: { apt: AppointmentSlot, onClose: () => void, onRefresh: () => Promise<void>, canWrite: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const close = useCallback(() => { if (!loading) onClose() }, [loading, onClose])

  async function handleSubmit(formData: FormData) {
    if (!canWrite) return

    setLoading(true)
    setError('')
    try {
      await bookAppointment(formData)
      await onRefresh()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Δεν ήταν δυνατή η κράτηση.')
    } finally { setLoading(false) }
  }

  return (
    <ModalFrame title="Νέα κράτηση" onClose={close}>
        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <CalendarCheck className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg leading-tight">Νέα Κράτηση</h3>
              <p className="text-blue-200 text-xs font-mono uppercase tracking-widest">
                Έναρξη: {formatBusinessTime(apt.date)}
              </p>
            </div>
          </div>
          <button aria-label="Κλείσιμο" disabled={loading} onClick={close} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form action={handleSubmit} className="p-8 space-y-5">
          {error && <p className="error-banner" role="alert">{error}</p>}
          <input type="hidden" name="aptId" value={apt.id} />
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Όνομα Ασθενή</label>
            <input aria-label="Όνομα ασθενή" name="patientName" required readOnly={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`} placeholder="Ονοματεπώνυμο..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Τηλέφωνο</label>
               <input type="tel" aria-label="Τηλέφωνο" name="patientTel" required readOnly={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`} placeholder="69..." />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Διάρκεια</label>
               <select aria-label="Διάρκεια" name="duration" defaultValue="30" disabled={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`}>
                  <option value="15">15 Λεπτά</option>
                  <option value="30">30 Λεπτά</option>
                  <option value="45">45 Λεπτά</option>
                  <option value="60">1 Ώρα</option>
                  <option value="90">1.5 Ώρα</option>
               </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Σημειώσεις</label>
            <textarea aria-label="Σημειώσεις" name="notes" rows={3} readOnly={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`} placeholder="Σημειώσεις..." />
          </div>

          <button type="submit" disabled={loading || !canWrite} className={`w-full py-4 rounded-2xl font-black uppercase tracking-tighter transition-all transform shadow-xl shadow-white/5 ${canWrite ? 'bg-white text-slate-950 hover:bg-blue-500 hover:text-white active:scale-95' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>
            {!canWrite ? 'ΠΡΟΒΟΛΗ ΜΟΝΟ' : loading ? 'ΚΡΑΤΗΣΗ...' : 'ΕΠΙΒΕΒΑΙΩΣΗ'}
          </button>
        </form>
    </ModalFrame>
  )
}
