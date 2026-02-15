'use client'
import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import BookingModal from './BookingModal'
import { format } from 'date-fns'

export default function BookingManager({ appointments }: { appointments: any }) {
  const [selectedApt, setSelectedApt] = useState<any>(null)

  return (
    <div className="space-y-2">
      {appointments.map((apt: any) => (
        <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
          <span className="font-bold">{format(new Date(apt.date), "HH:mm")}</span>
          {apt.status === 'FREE' ? (
            <button onClick={() => setSelectedApt(apt)} className="text-blue-600 flex items-center gap-1 text-sm font-bold">
              <PlusCircle className="w-4 h-4" /> Κράτηση
            </button>
          ) : (
            <span className="text-slate-400 text-sm italic">{apt.patientName}</span>
          )}
        </div>
      ))}
      {selectedApt && <BookingModal apt={selectedApt} onClose={() => setSelectedApt(null)} />}
    </div>
  )
}