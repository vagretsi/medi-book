'use client'
import { useState } from 'react'
import { bookAppointment } from '@/app/actions'
import { X, CalendarCheck, Clock } from 'lucide-react'
import type { AppointmentSlot } from '@/lib/calendar-types'
import { formatBusinessTime } from '@/lib/business-time'

// ΠΡΟΣΟΧΗ: Εδώ προσθέσαμε το onRefresh
export default function BookingModal({ apt, onClose, onRefresh, canWrite }: { apt: AppointmentSlot, onClose: () => void, onRefresh: () => Promise<void>, canWrite: boolean }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    if (!canWrite) return

    setLoading(true)
    await bookAppointment(formData)
    await onRefresh() // Καλούμε το refresh μετά την κράτηση
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-[32px] border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
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
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form action={handleSubmit} className="p-8 space-y-5">
          <input type="hidden" name="aptId" value={apt.id} />
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Όνομα Ασθενή</label>
            <input name="patientName" required readOnly={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`} placeholder="Ονοματεπώνυμο..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Τηλέφωνο</label>
               <input name="patientTel" required readOnly={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`} placeholder="69..." />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Διάρκεια</label>
               <select name="duration" defaultValue="30" disabled={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`}>
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
            <textarea name="notes" rows={3} readOnly={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`} placeholder="Σημειώσεις..." />
          </div>

          <button type="submit" disabled={loading || !canWrite} className={`w-full py-4 rounded-2xl font-black uppercase tracking-tighter transition-all transform shadow-xl shadow-white/5 ${canWrite ? 'bg-white text-slate-950 hover:bg-blue-500 hover:text-white active:scale-95' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>
            {!canWrite ? 'ΠΡΟΒΟΛΗ ΜΟΝΟ' : loading ? 'ΚΡΑΤΗΣΗ...' : 'ΕΠΙΒΕΒΑΙΩΣΗ'}
          </button>
        </form>
      </div>
    </div>
  )
}
