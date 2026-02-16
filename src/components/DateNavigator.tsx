'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { el } from 'date-fns/locale'

export default function DateNavigator() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dateParam = searchParams.get('date')
  const currentDate = dateParam ? new Date(dateParam) : new Date()

  const changeDate = (newDate: Date) => {
    const params = new URLSearchParams(searchParams)
    params.set('date', format(newDate, 'yyyy-MM-dd'))
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-700/50">
      <button onClick={() => changeDate(subDays(currentDate, 1))} className="p-2 hover:bg-white/10 rounded-lg text-white">
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex flex-col items-center min-w-[140px]">
        <span className="text-blue-400 font-bold text-sm uppercase">
          {format(currentDate, 'EEEE', { locale: el })}
        </span>
        <span className="text-white font-black text-lg">
          {format(currentDate, 'd MMM yyyy', { locale: el })}
        </span>
      </div>

      <button onClick={() => changeDate(addDays(currentDate, 1))} className="p-2 hover:bg-white/10 rounded-lg text-white">
        <ChevronRight className="w-5 h-5" />
      </button>
      
      {/* Hidden native picker trigger if needed later */}
      <input 
        type="date" 
        value={format(currentDate, 'yyyy-MM-dd')} 
        onChange={(e) => changeDate(new Date(e.target.value))}
        className="bg-transparent text-transparent w-8 absolute cursor-pointer"
      />
    </div>
  )
}