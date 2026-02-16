'use client'
import { useState } from 'react'
import { updateAppointment, cancelAppointment } from '@/app/actions'
import { X, User, Phone, FileText, Trash2, Save, Clock } from 'lucide-react'

export default function EditModal({ apt, onClose }: { apt: any, onClose: any }) {
  const [loading, setLoading] = useState(false)

  async function handleUpdate(formData: FormData) {
    setLoading(true)
    await updateAppointment(formData)
    setLoading(false)
    onClose()
  }

  async function handleCancel(formData: FormData) {
    if(!confirm("Είστε σίγουροι για την ακύρωση;")) return;
    setLoading(true)
    await cancelAppointment(formData)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-[32px] border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="bg-slate-800 p-6 flex justify-between items-center border-b border-slate-700">
          <h3 className="font-bold text-white text-lg">Επεξεργασία Ραντεβού</h3>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 space-y-6">
          <form action={handleUpdate} className="space-y-4">
            <input type="hidden" name="aptId" value={apt.id} />
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-2"><User className="w-3 h-3"/> Όνομα Ασθενή</label>
              <input name="patientName" defaultValue={apt.patientName} className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl focus:border-blue-500 outline-none" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-2"><Phone className="w-3 h-3"/> Τηλέφωνο</label>
                <input name="patientTel" defaultValue={apt.patientTel} className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl focus:border-blue-500 outline-none" required />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-2"><Clock className="w-3 h-3"/> Διάρκεια</label>
                 <select name="duration" defaultValue={apt.duration || 30} className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl focus:border-blue-500 outline-none">
                    <option value="15">15 Λεπτά</option>
                    <option value="30">30 Λεπτά</option>
                    <option value="45">45 Λεπτά</option>
                    <option value="60">1 Ώρα</option>
                 </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-2"><FileText className="w-3 h-3"/> Σημειώσεις</label>
              <textarea name="notes" defaultValue={apt.notes} rows={3} className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl focus:border-blue-500 outline-none" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
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
      </div>
    </div>
  )
}