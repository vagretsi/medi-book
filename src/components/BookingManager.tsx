'use client'
import { useState } from 'react'
import { User, Phone, Edit2, Clock } from 'lucide-react'
import BookingModal from './BookingModal'
import EditModal from './EditModal'
import { format, addMinutes, isSameMinute } from 'date-fns'

export default function BookingManager({ appointments, onRefresh }: { appointments: any[], onRefresh: () => void }) {
  const [selectedApt, setSelectedApt] = useState<any>(null)
  const [editingApt, setEditingApt] = useState<any>(null)

  // Βοηθητική συνάρτηση για να βρούμε ποια slots πρέπει να ΚΡΥΨΟΥΜΕ επειδή τα καλύπτει ένα μεγάλο ραντεβού
  const getHiddenSlots = () => {
    const hiddenIds = new Set();
    
    appointments.forEach(apt => {
      if (apt.status === 'BOOKED' && apt.duration > 15) {
        // Υπολογίζουμε πόσα 15λεπτα πιάνει
        const slotsCovered = (apt.duration / 15) - 1;
        let currentTime = new Date(apt.date);

        for (let i = 0; i < slotsCovered; i++) {
          currentTime = addMinutes(currentTime, 15);
          // Βρες το slot που πέφτει σε αυτή την ώρα και βάλτο στη λίστα για κρύψιμο
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
      {/* Timeline Grid */}
      {appointments.map((apt: any) => {
        // Αν αυτό το slot καλύπτεται από προηγούμενο μεγάλο ραντεβού, μην το δείξεις καθόλου
        if (hiddenSlotIds.has(apt.id)) return null;

        // Υπολογισμός ύψους: Κάθε 15 λεπτά = 60px ύψος (περίπου)
        // Αν είναι 15' -> h-14
        // Αν είναι 30' -> h-28
        // Αν είναι 60' -> h-60
        const heightClass = apt.duration > 15 
          ? `min-h-[${(apt.duration/15) * 3.5}rem]` 
          : 'min-h-[3.5rem]'; // Default 15 min height

        return (
          <div 
            key={apt.id} 
            style={{ height: `${(apt.duration / 15) * 60}px` }} // Dynamic inline style for exact height
            className={`group flex w-full rounded-xl border transition-all duration-200 relative overflow-hidden ${
              apt.status === 'FREE' 
              ? 'bg-slate-800/20 border-slate-700/30 hover:bg-slate-800/50 hover:border-blue-500/30 items-center' 
              : 'bg-blue-900/20 border-blue-500/30 items-start'
            }`}
          >
            {/* Left Side: Time */}
            <div className={`w-16 flex flex-col items-center justify-center border-r border-white/5 h-full ${apt.status === 'BOOKED' ? 'bg-blue-500/10' : ''}`}>
               <span className={`text-xs font-mono font-bold ${apt.status === 'BOOKED' ? 'text-blue-300' : 'text-slate-500'}`}>
                 {format(new Date(apt.date), "HH:mm")}
               </span>
               {apt.status === 'BOOKED' && (
                 <span className="text-[9px] text-blue-400/60 mt-1">{apt.duration}'</span>
               )}
            </div>

            {/* Content Side */}
            <div className="flex-1 px-3 py-2 h-full flex items-center justify-between relative">
              {apt.status === 'BOOKED' ? (
                <div className="flex flex-col justify-center h-full w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3 h-3 text-blue-400" /> 
                    <span className="text-white font-bold text-sm leading-none truncate">{apt.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-400 text-xs leading-none">{apt.patientTel}</span>
                  </div>
                  
                  {/* Edit Button (Top Right) */}
                  <button 
                    onClick={() => setEditingApt(apt)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-white hover:bg-slate-700 p-1.5 rounded-lg transition-colors z-10"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest pl-2">Available</span>
                  <button 
                    onClick={() => setSelectedApt(apt)}
                    className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/20"
                  >
                    + BOOK
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
      
      {selectedApt && <BookingModal apt={selectedApt} onClose={() => setSelectedApt(null)} onRefresh={onRefresh} />}
      {editingApt && <EditModal apt={editingApt} onClose={() => setEditingApt(null)} onRefresh={onRefresh} />}
    </div>
  )
}