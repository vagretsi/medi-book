'use client'
import { useState } from 'react'
import { bookAppointment } from '@/app/actions'
import { X } from 'lucide-react'

export default function BookingModal({ apt, onClose }: { apt: any, onClose: any }) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    await bookAppointment(formData)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold">Κράτηση: {new Date(apt.date).toLocaleTimeString('el-GR', {hour: '2-digit', minute:'2-digit'})}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form action={handleSubmit} className="p-6 space-y-4">
          <input type="hidden" name="aptId" value={apt.id} />
          <input name="patientName" required className="w-full p-2 border rounded" placeholder="Ονοματεπώνυμο" />
          <input name="patientTel" required className="w-full p-2 border rounded" placeholder="Τηλέφωνο" />
          <textarea name="notes" className="w-full p-2 border rounded" placeholder="Σημειώσεις" />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded font-bold">
            {loading ? 'Παρακαλώ περιμένετε...' : 'Επιβεβαίωση'}
          </button>
        </form>
      </div>
    </div>
  )
}