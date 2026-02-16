'use client'
import { useState, useEffect } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { el } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, CalendarDays } from 'lucide-react'
import BookingManager from './BookingManager'
import { getDayAppointments } from '@/app/actions'

export default function DashboardController({ initialData }: { initialData: any }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [resources, setResources] = useState(initialData)

  useEffect(() => {
    async function fetchData() {
      const data = await getDayAppointments(currentDate.toISOString())
      setResources(data)
    }
    fetchData()
  }, [currentDate])

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-slate-800/40 backdrop-blur-md p-4 rounded-3xl border border-slate-700/50 shadow-xl gap-4">
        
        {/* Τίτλος */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">MediBook</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Appointment Manager</p>
          </div>
        </div>

        {/* CLICKABLE ΗΜΕΡΟΛΟΓΙΟ */}
        <div className="flex items-center gap-4 bg-slate-900/80 p-2 pr-4 pl-2 rounded-2xl border border-slate-700 shadow-inner relative group">
          <button onClick={() => setCurrentDate(d => subDays(d, 1))} className="p-2 hover:bg-slate-700 rounded-xl text-white transition-colors z-10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Container που περιέχει το κείμενο και το κρυφό input */}
          <div className="flex items-center gap-3 relative cursor-pointer px-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <div className="flex flex-col items-center min-w-[140px]">
              <span className="text-blue-400 font-bold text-xs uppercase tracking-widest">
                {format(currentDate, 'EEEE', { locale: el })}
              </span>
              <span className="text-white font-black text-xl">
                {format(currentDate, 'd MMM yyyy', { locale: el })}
              </span>
            </div>
            
            {/* ΤΟ ΚΡΥΦΟ INPUT ΠΟΥ ΑΝΟΙΓΕΙ ΤΟ ΗΜΕΡΟΛΟΓΙΟ ΣΕ ΟΛΟ ΤΟ ΚΟΥΤΙ */}
            <input 
              type="date" 
              value={format(currentDate, 'yyyy-MM-dd')} 
              onChange={(e) => setCurrentDate(new Date(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
          </div>

          <button onClick={() => setCurrentDate(d => addDays(d, 1))} className="p-2 hover:bg-slate-700 rounded-xl text-white transition-colors z-10">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ΚΕΝΟ ΔΕΞΙΑ (Αφαιρέθηκε το LIVE DATA) */}
        <div className="hidden md:block w-[200px]"></div>
      </header>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {resources.map((resource: any) => (
          <div key={resource.id} className="bg-slate-800/30 rounded-[32px] border border-slate-700/50 shadow-xl overflow-hidden flex flex-col h-full min-h-[600px] animate-in fade-in duration-500">
            <div className={`p-5 border-b border-slate-700/50 flex justify-between items-center ${resource.type === 'MEDICAL' ? 'bg-blue-500/5' : 'bg-purple-500/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${resource.type === 'MEDICAL' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                <h2 className="text-lg font-bold text-white uppercase tracking-tighter">{resource.name}</h2>
              </div>
              <span className="text-[10px] font-black bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700 uppercase">
                {resource.type}
              </span>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              {resource.appointments.length > 0 ? (
                 <BookingManager appointments={resource.appointments} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                  <div className="text-center">
                    <p className="text-slate-400 font-bold">Κενό Πρόγραμμα</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}