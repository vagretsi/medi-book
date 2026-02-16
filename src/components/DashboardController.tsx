'use client'
import { useState, useEffect, useRef } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { el } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, Loader2, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react' 
import BookingManager from './BookingManager'
import DailyNote from './DailyNote'
import { getDayAppointments, getDayNote } from '@/app/actions'

export default function DashboardController({ initialData }: { initialData: any }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [resources, setResources] = useState(initialData)
  const [dayNote, setDayNote] = useState("") 
  const [loading, setLoading] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const refreshData = async () => {
    setLoading(true)
    const dateStr = currentDate.toISOString()
    const [data, note] = await Promise.all([
      getDayAppointments(dateStr),
      getDayNote(dateStr)
    ])
    setResources(data)
    setDayNote(note)
    setLoading(false)
  }

  useEffect(() => {
    refreshData()
  }, [currentDate])

  const openCalendar = () => {
    try {
      if (dateInputRef.current) dateInputRef.current.showPicker()
    } catch (err) {
      dateInputRef.current?.focus()
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-slate-800/40 backdrop-blur-md p-4 rounded-3xl border border-slate-700/50 shadow-xl gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">MediBook</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Appointment Manager</p>
          </div>
        </div>

        {/* ΗΜΕΡΟΛΟΓΙΟ */}
        <div className="flex items-center gap-4 bg-slate-900/80 p-2 pr-4 pl-2 rounded-2xl border border-slate-700 shadow-inner relative z-10">
          <button onClick={() => setCurrentDate(d => subDays(d, 1))} className="p-2 hover:bg-slate-700 rounded-xl text-white transition-colors z-20">
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div onClick={openCalendar} className="relative flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <div className="flex flex-col items-center min-w-[140px]">
              <span className="text-blue-400 font-bold text-xs uppercase tracking-widest">{format(currentDate, 'EEEE', { locale: el })}</span>
              <span className="text-white font-black text-xl">{format(currentDate, 'd MMM yyyy', { locale: el })}</span>
            </div>
            <input 
              ref={dateInputRef} 
              type="date" 
              className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer md:pointer-events-none" 
              value={format(currentDate, 'yyyy-MM-dd')} 
              onChange={(e) => { if(e.target.value) setCurrentDate(new Date(e.target.value)) }} 
            />
          </div>
          
          <button onClick={() => setCurrentDate(d => addDays(d, 1))} className="p-2 hover:bg-slate-700 rounded-xl text-white transition-colors z-20">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* ΔΕΞΙΑ ΠΛΕΥΡΑ: LOADING & ΜΟΝΟ ΕΝΑ LOGOUT */}
        <div className="flex items-center gap-4 min-w-[120px] justify-end">
          {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
          <button 
            onClick={() => signOut()} 
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black px-4 py-2 rounded-xl border border-red-500/20 transition-all uppercase tracking-widest active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            Έξοδος
          </button>
        </div>
      </header>

      {/* GRID (3 COLUMNS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {resources.map((resource: any) => (
          <div key={resource.id} className="bg-slate-800/30 rounded-[32px] border border-slate-700/50 shadow-xl overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className={`p-5 border-b border-slate-700/50 flex justify-between items-center ${resource.type === 'MEDICAL' ? 'bg-blue-500/5' : 'bg-purple-500/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full animate-pulse ${resource.type === 'MEDICAL' ? 'bg-blue-500' : 'bg-purple-500'}`} />
                <h2 className="text-lg font-bold text-white uppercase tracking-tighter">{resource.name}</h2>
              </div>
              <span className="text-[10px] font-black bg-slate-900 text-slate-500 px-2 py-1 rounded border border-slate-700 uppercase">{resource.type}</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
               <BookingManager appointments={resource.appointments} onRefresh={refreshData} />
            </div>
          </div>
        ))}
        <DailyNote dateStr={currentDate.toISOString()} initialContent={dayNote} />
      </div>
    </div>
  )
}
