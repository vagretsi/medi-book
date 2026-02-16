'use client'
import { useState } from 'react'
import { bookAppointment } from '@/app/actions'
import { X, CalendarCheck } from 'lucide-react'

export default function BookingModal({ apt, onClose }: { apt: any, onClose: any }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    await bookAppointment(formData)
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
              <h3 className="font-bold text-lg leading-tight">Κράτηση Slot</h3>
              <p className="text-blue-200 text-xs font-mono uppercase tracking-widest">
                Ώρα: {new Date(apt.date).toLocaleTimeString('el-GR', {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form action={handleSubmit} className="p-8 space-y-5">
          <input type="hidden" name="aptId" value={apt.id} />
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Όνομα Ασθενή</label>
            <input name="patientName" required className="w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="π.χ. Ιωάννης Παπαδόπουλος" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Τηλέφωνο Επικοινωνίας</label>
            <input name="patientTel" required className="w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="69..." />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Σημειώσεις</label>
            <textarea name="notes" rows={3} className="w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Προαιρετικά..." />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black uppercase tracking-tighter hover:bg-blue-500 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5">
            {loading ? 'Γίνεται η κράτηση...' : 'ΕΠΙΒΕΒΑΙΩΣΗ ΡΑΝΤΕΒΟΥ'}
          </button>
        </form>
      </div>
    </div>
  )
}