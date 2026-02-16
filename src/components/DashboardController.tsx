'use client'
import { useState, useEffect } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { el } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react'
import BookingManager from './BookingManager'
import { getDayAppointments } from '@/app/actions'

export default function DashboardController({ initialData }: { initialData: any }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [resources, setResources] = useState(initialData)
  const [loading, setLoading] = useState(false)

  // Όταν αλλάζει η ημερομηνία, φέρε τα νέα δεδομένα "αθόρυβα"
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const data = await getDayAppointments(currentDate.toISOString())
      setResources(data)
      setLoading(false)
    }
    fetchData()
  }, [currentDate])

  return (
    <div className="space-y-8">
      {/* HEADER ME HMEROLOGIO */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-slate-800/40 backdrop-blur-md p-4 rounded-3xl border border-slate-700/50 shadow-xl gap-4">
        
        {/* Αριστερά: Τίτλος */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">MediBook</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Appointment Manager</p>
          </div>
        </div>

        {/* Κέντρο: Ημερολόγιο (Χωρίς URL change) */}
        <div className="flex items-center gap-6 bg-slate-900/80 p-2 rounded-2xl border border-slate-700">
          <button onClick={() => setCurrentDate(d => subDays(d, 1))} className="p-2 hover:bg-slate-700 rounded-xl text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center min-w-[160px]">
            <span className="text-blue-400 font-bold text-xs uppercase tracking-widest">
              {format(currentDate, 'EEEE', { locale: el })}
            </span>
            <span className="text-white font-black text-xl">
              {format(currentDate, 'd MMM yyyy', { locale: el })}
            </span>
          </div>

          <button onClick={() => setCurrentDate(d => addDays(d, 1))} className="p-2 hover:bg-slate-700 rounded-xl text-white transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Δεξιά: Status */}
        <div className="hidden md:block text-right">
           <div className="flex items-center gap-2">
             {loading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
             <span className="text-slate-500 text-xs font-mono">LIVE DATA</span>
           </div>
        </div>
      </header>

      {/* GRID ΜΕ ΤΙΣ ΣΤΗΛΕΣ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {resources.map((resource: any) => (
          <div key={resource.id} className="bg-slate-800/30 rounded-[32px] border border-slate-700/50 shadow-xl overflow-hidden flex flex-col h-full min-h-[600px] animate-in fade-in duration-500">
            {/* Τίτλος Στήλης */}
            <div className={`p-5 border-b border-slate-700/50 flex justify-between items-center ${resource.type === 'MEDICAL' ? 'bg-blue-500/5' : 'bg-purple-500/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${resource.type === 'MEDICAL' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                <h2 className="text-lg font-bold text-white uppercase tracking-tighter">{resource.name}</h2>
              </div>
              <span className="text-[10px] font-black bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700 uppercase">
                {resource.type}
              </span>
            </div>
            
            {/* Περιεχόμενο (Slots) */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              {resource.appointments.length > 0 ? (
                 <BookingManager appointments={resource.appointments} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Calendar className="w-8 h-8 text-slate-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 font-bold">Κενό Πρόγραμμα</p>
                    <p className="text-slate-600 text-xs mt-1">Ζητήστε από τον Admin να τρέξει<br/>τη γεννήτρια slots.</p>
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