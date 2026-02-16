'use client'
import { useState } from 'react'
import { PlusCircle, User, Phone, Edit2 } from 'lucide-react' // Added Edit2
import BookingModal from './BookingModal'
import EditModal from './EditModal' // Import το νέο Modal
import { format } from 'date-fns'

export default function BookingManager({ appointments }: { appointments: any }) {
  const [selectedApt, setSelectedApt] = useState<any>(null)
  const [editingApt, setEditingApt] = useState<any>(null) // State για Edit

  return (
    <div className="space-y-3">
      {appointments.map((apt: any) => (
        <div 
          key={apt.id} 
          className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
            apt.status === 'FREE' 
            ? 'bg-slate-900/40 border-slate-700/30 hover:border-blue-500/50 hover:bg-slate-800/60' 
            : 'bg-blue-600/10 border-blue-500/20 relative overflow-hidden'
          }`}
        >
          {/* Side Indicator για booked */}
          {apt.status === 'BOOKED' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}

          <div className="flex items-center gap-4 pl-2">
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

          {/* ACTIONS */}
          {apt.status === 'FREE' ? (
            <button 
              onClick={() => setSelectedApt(apt)}
              className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 text-[10px] font-black px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              ΚΡΑΤΗΣΗ
            </button>
          ) : (
            <button 
              onClick={() => setEditingApt(apt)}
              className="text-slate-500 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      
      {/* Modals */}
      {selectedApt && <BookingModal apt={selectedApt} onClose={() => setSelectedApt(null)} />}
      {editingApt && <EditModal apt={editingApt} onClose={() => setEditingApt(null)} />}
    </div>
  )
}