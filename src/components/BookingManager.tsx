'use client'
import { useState } from 'react'
import { PlusCircle, User, Phone } from 'lucide-react'
import BookingModal from './BookingModal'
import { format } from 'date-fns'

export default function BookingManager({ appointments }: { appointments: any }) {
  const [selectedApt, setSelectedApt] = useState<any>(null)

  return (
    <div className="space-y-3">
      {appointments.map((apt: any) => (
        <div 
          key={apt.id} 
          className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
            apt.status === 'FREE' 
            ? 'bg-slate-900/40 border-slate-700/30 hover:border-blue-500/50 hover:bg-slate-800/60' 
            : 'bg-blue-600/10 border-blue-500/20'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`font-mono text-sm font-bold px-3 py-1.5 rounded-xl ${
              apt.status === 'FREE' ? 'bg-slate-800 text-slate-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
            }`}>
              {format(new Date(apt.date), "HH:mm")}
            </div>
            
            <div className="flex flex-col">
              {apt.status === 'BOOKED' ? (
                <>
                  <div className="flex items-center gap-1.5 text-white font-bold text-sm tracking-tight">
                    <User className="w-3 h-3 text-blue-400" /> {apt.patientName}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-medium">
                    <Phone className="w-3 h-3" /> {apt.patientTel}
                  </div>
                </>
              ) : (
                <span className="text-slate-600 text-[11px] font-black uppercase tracking-widest">Διαθέσιμο</span>
              )}
            </div>
          </div>

          {apt.status === 'FREE' && (
            <button 
              onClick={() => setSelectedApt(apt)}
              className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 text-[10px] font-black px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              ΚΡΑΤΗΣΗ
            </button>
          )}
        </div>
      ))}
      {selectedApt && <BookingModal apt={selectedApt} onClose={() => setSelectedApt(null)} />}
    </div>
  )
}