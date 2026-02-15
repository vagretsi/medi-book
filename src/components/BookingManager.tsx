'use client'

import { useState } from 'react'
import { PlusCircle, User, Phone } from 'lucide-react'
import BookingModal from './BookingModal'
import { format } from 'date-fns'

export default function BookingManager({ appointments }: { appointments: any }) {
  const [selectedApt, setSelectedApt] = useState<any>(null)

  return (
    <>
      <div className="space-y-3">
        {appointments.map((apt: any) => (
          <div 
            key={apt.id} 
            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 
              ${apt.status === 'FREE' ? 'bg-white border-slate-200 hover:border-blue-400' : 'bg-slate-100 opacity-90'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`font-mono text-xl font-bold ${apt.status === 'FREE' ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                {format(new Date(apt.date), "HH:mm")}
              </div>
              
              {apt.status === 'FREE' ? (
                <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">ΔΙΑΘΕΣΙΜΟ</span>
              ) : (
                <div className="flex flex-col">
                   <div className="flex items-center gap-1 text-slate-800 font-bold text-sm"><User className="w-3 h-3" /> {apt.patientName}</div>
                   <div className="flex items-center gap-1 text-slate-500 text-xs"><Phone className="w-3 h-3" /> {apt.patientTel}</div>
                </div>
              )}
            </div>

            <div>
              {apt.status === 'FREE' ? (
                <button 
                  onClick={() => setSelectedApt(apt)}
                  className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <PlusCircle className="w-3 h-3" /> Κράτηση
                </button>
              ) : (
                <span className="text-xs font-medium text-slate-400 italic">Κλεισμένο</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedApt && (
        <BookingModal apt={selectedApt} onClose={() => setSelectedApt(null)} />
      )}
    </>
  )
}