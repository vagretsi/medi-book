'use client'

import { useState } from 'react'
import { bookAppointment } from '@/app/actions'
import { X, User, Phone, FileText } from 'lucide-react'

export default function BookingModal({ apt, onClose }: { apt: any, onClose: any }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    await bookAppointment(formData)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <div>
            <h3 className="font-bold">Κράτηση Ραντεβού</h3>
            <p className="text-xs text-slate-400">Ώρα: {new Date(apt.date).toLocaleTimeString('el-GR', {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form action={handleSubmit} className="p-6 space-y-4">
          <input type="hidden" name="aptId" value={apt.id} />
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ονοματεπώνυμο</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                name="patientName" 
                required 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="π.χ. Μαρία Παπαδοπούλου" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Τηλέφωνο</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                name="patientTel" 
                required 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="69XXXXXXXX" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Σημειώσεις</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea 
                name="notes" 
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                rows={2} 
                placeholder="π.χ. Πρώτη φορά για Laser" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {loading ? 'Γίνεται κράτηση...' : 'Επιβεβαίωση Κράτησης'}
          </button>
        </form>
      </div>
    </div>
  )
}