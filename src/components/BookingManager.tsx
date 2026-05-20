'use client'
import { useState } from 'react'
import { User, Phone, Edit2 } from 'lucide-react'
import BookingModal from './BookingModal'
import EditModal from './EditModal'
import { addMinutes, isSameMinute } from 'date-fns'
import type { AppointmentSlot } from '@/lib/calendar-types'
import { formatBusinessTime } from '@/lib/business-time'

export default function BookingManager({ appointments, onRefresh, canWrite }: { appointments: AppointmentSlot[], onRefresh: () => Promise<void>, canWrite: boolean }) {
  const [selectedApt, setSelectedApt] = useState<AppointmentSlot | null>(null)
  const [editingApt, setEditingApt] = useState<AppointmentSlot | null>(null)

  // Βοηθητική συνάρτηση για να βρούμε ποια slots πρέπει να ΚΡΥΨΟΥΜΕ
  const getHiddenSlots = () => {
    const hiddenIds = new Set<number>();
    appointments.forEach(apt => {
      if (apt.status === 'BOOKED' && apt.duration > 15) {
        // Υπολογίζουμε πόσα 15λεπτα πιάνει
        const slotsCovered = Math.ceil(apt.duration / 15) - 1;
        let currentTime = new Date(apt.date);

        for (let i = 0; i < slotsCovered; i++) {
          currentTime = addMinutes(currentTime, 15);
          const coveredSlot = appointments.find(a => isSameMinute(new Date(a.date), currentTime));
          if (coveredSlot) {
            hiddenIds.add(coveredSlot.id);
          }
        }
      }
    });
    return hiddenIds;
  };

  const hiddenSlotIds = getHiddenSlots();

  return (
    <div className="flex flex-col gap-1 relative"> 
      {appointments.map((apt) => {
        // Αν αυτό το slot καλύπτεται από προηγούμενο μεγάλο ραντεβού, μην το δείξεις καθόλου
        if (hiddenSlotIds.has(apt.id)) return null;

        // Υπολογισμός ύψους: Κάθε 15 λεπτά = 60px
        const heightPx = (apt.duration / 15) * 60;

        return (
          <div 
            key={apt.id} 
            style={{ height: `${heightPx}px` }} // Dynamic inline style
            className={`group flex w-full rounded-xl border transition-all duration-200 relative overflow-hidden ${
              apt.status === 'FREE' 
              ? 'bg-slate-800/40 border-slate-700/50 items-center' 
              : 'bg-blue-600/10 border-blue-500/20 items-start'
            }`}
          >
            {/* Left Side: Time */}
            <div className={`w-16 flex flex-col items-center justify-center border-r border-white/5 h-full ${apt.status === 'BOOKED' ? 'bg-blue-500/10' : 'bg-black/20'}`}>
               <span className={`text-xs font-mono font-bold ${apt.status === 'BOOKED' ? 'text-blue-300' : 'text-slate-500'}`}>
                 {formatBusinessTime(apt.date)}
               </span>
               {apt.status === 'BOOKED' && (
                 <span className="text-[9px] text-blue-400/60 mt-1">{apt.duration} λεπτά</span>
               )}
            </div>

            {/* Content Side */}
            <div className="flex-1 px-3 py-2 h-full flex items-center justify-between relative">
              {apt.status === 'BOOKED' ? (
                <div className="flex flex-col justify-center h-full w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3.5 h-3.5 text-blue-400" /> 
                    <span className="text-white font-bold text-sm leading-none truncate">{apt.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400 text-xs leading-none">{apt.patientTel}</span>
                  </div>
                  
                  {/* Edit Button */}
                  {canWrite && (
                    <button 
                      onClick={() => setEditingApt(apt)}
                      className="absolute top-2 right-2 text-slate-500 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-colors z-10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest pl-2">Available</span>
                  {/* ΚΟΥΜΠΙ: Τώρα είναι ΠΑΝΤΑ ορατό (αφαιρέθηκε το opacity-0) */}
                  <button 
                    onClick={() => setSelectedApt(apt)}
                    className={canWrite
                      ? "bg-white text-slate-900 text-[10px] font-black px-4 py-2 rounded-xl transition-all shadow-xl active:scale-95"
                      : "text-[10px] font-black px-3 py-2 rounded-xl border border-amber-500/20 text-amber-400 bg-amber-500/10 uppercase transition-all active:scale-95"
                    }
                  >
                    {canWrite ? '+ BOOK' : 'Προβολή'}
                  </button>
                </>
              )}
            </div>
            
            {/* Status Bar Indicator */}
            {apt.status === 'BOOKED' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
            )}
          </div>
        )
      })}
      
      {selectedApt && <BookingModal apt={selectedApt} onClose={() => setSelectedApt(null)} onRefresh={onRefresh} canWrite={canWrite} />}
      {editingApt && canWrite && <EditModal apt={editingApt} onClose={() => setEditingApt(null)} onRefresh={onRefresh} />}
    </div>
  )
}
