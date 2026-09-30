'use client'
import { useState, useCallback } from 'react'
import ModalFrame from './ModalFrame'
import { bookAppointment } from '@/app/actions'
import { X, CalendarCheck, Clock } from 'lucide-react'
import { getVisibleSlots } from '@/lib/visible-slots'
import type { CalendarResource, AppointmentSlot } from '@/lib/calendar-types'
import { formatBusinessTime } from '@/lib/business-time'

export default function BookingModal({ apt: initialApt, resources = [], appointments = [], resourceName, onClose, onRefresh, canWrite }: { apt?: AppointmentSlot, resources?: CalendarResource[], appointments?: AppointmentSlot[], resourceName?: string, onClose: () => void, onRefresh: () => Promise<void>, canWrite: boolean }) {
  const [suggestion, setSuggestion] = useState<AppointmentSlot | null>(null)
  const [suggestedDuration, setSuggestedDuration] = useState<number | null>(null)
  const [acceptedSlot, setAcceptedSlot] = useState<AppointmentSlot | null>(null)
  const [resourceId, setResourceId] = useState('')
  const [slotId, setSlotId] = useState(initialApt ? String(initialApt.id) : '')
  const writableResources = resources.filter(resource => resource.canWrite)
  const selectedResource = writableResources.find(resource => String(resource.id) === resourceId)
  const calendarSlots = initialApt
    ? appointments.filter(slot => slot.resourceId === initialApt.resourceId)
    : selectedResource?.appointments ?? []
  const freeSlots = getVisibleSlots(calendarSlots).filter(slot => slot.status === 'FREE').sort((a, b) => +new Date(a.date) - +new Date(b.date))
  const timeOptions = acceptedSlot && !freeSlots.some(slot => slot.id === acceptedSlot.id)
    ? [...freeSlots, acceptedSlot].sort((a, b) => +new Date(a.date) - +new Date(b.date)) : freeSlots
  const apt = timeOptions.find(slot => String(slot.id) === slotId)
  const calendarName = resourceName ?? selectedResource?.name
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const close = useCallback(() => { if (!loading) onClose() }, [loading, onClose])

  async function handleSubmit(formData: FormData) {
    if (loading || !canWrite || !apt) return
    formData.set('aptId', String(apt.id))

    setLoading(true)
    setError('')
    setSuggestion(null)
    setSuggestedDuration(null)
    try {
      const result = await bookAppointment(formData)
      if (result.error) {
        setError(result.error)
        setSuggestion(result.suggestion ?? null)
        setSuggestedDuration(result.requestedDuration ?? null)
        return
      }
      await onRefresh()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Δεν ήταν δυνατή η κράτηση.')
    } finally { setLoading(false) }
  }

  return (
    <ModalFrame title="Νέα κράτηση" onClose={close}>
        <div className="bg-blue-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <CalendarCheck className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg leading-tight">Νέα Κράτηση</h3>
              <p className="text-blue-200 text-xs font-mono uppercase tracking-widest">
                {apt ? `${calendarName ? `${calendarName} · ` : ''}${formatBusinessTime(apt.date)}` : 'Επίλεξε ημερολόγιο και ώρα'}
              </p>
            </div>
          </div>
          <button aria-label="Κλείσιμο" disabled={loading} onClick={close} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={event => { event.preventDefault(); void handleSubmit(new FormData(event.currentTarget)) }} className="p-8 space-y-5">
          {error && <div className="error-banner" role="alert"><p>{error}</p>
            {suggestion && suggestedDuration ? <div className="booking-suggestion">
              <p>Επόμενη διαθέσιμη ώρα για {suggestedDuration}′: <strong>{formatBusinessTime(suggestion.date)}–{formatBusinessTime(new Date(+new Date(suggestion.date) + suggestedDuration * 60_000))}</strong></p>
              <button type="button" className="primary-button" disabled={loading} onClick={() => { setAcceptedSlot(suggestion); setSlotId(String(suggestion.id)); setSuggestion(null); setSuggestedDuration(null); setError('') }}><span>Πατήστε εδώ για την πρώτη διαθέσιμη ώρα</span><strong>{formatBusinessTime(suggestion.date)} →</strong></button>
            </div> : suggestedDuration && <p className="mt-2">Δεν υπάρχει επόμενη διαθέσιμη ώρα σήμερα για {suggestedDuration}′.</p>}
          </div>}
          <div className="space-y-4">
            {!initialApt && <div className="space-y-1.5">
              <label htmlFor="booking-resource" className="text-[10px] font-black text-slate-500 uppercase ml-1">Ημερολόγιο</label>
              <select id="booking-resource" required disabled={loading} value={resourceId} onChange={event => { setResourceId(event.target.value); setSlotId(''); setAcceptedSlot(null); setSuggestion(null); setSuggestedDuration(null); setError('') }} className="w-full p-3 rounded-xl">
                <option value="" disabled>Ιατρείο ή Laser;</option>
                {writableResources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
              </select>
            </div>}
            {(initialApt || selectedResource) && <div className="space-y-1.5">
              <label htmlFor="booking-time" className="text-[10px] font-black text-slate-500 uppercase ml-1">Ώρα</label>
              {timeOptions.length ? <select id="booking-time" required disabled={loading} value={slotId} onChange={event => { setSlotId(event.target.value); setSuggestion(null); setSuggestedDuration(null); setError('') }} className="w-full p-3 rounded-xl">
                <option value="" disabled>Επίλεξε ώρα</option>
                {timeOptions.map(slot => <option key={slot.id} value={slot.id}>{formatBusinessTime(slot.date)}</option>)}
              </select> : <p role="status" className="muted">Δεν υπάρχουν διαθέσιμες ώρες σε αυτό το ημερολόγιο.</p>}
            </div>}
          </div>
          {apt && <input type="hidden" name="aptId" value={apt.id} />}
          <fieldset disabled={!apt || loading} className="space-y-5 disabled:opacity-50">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Όνομα Ασθενή</label>
            <input aria-label="Όνομα ασθενή" name="patientName" required readOnly={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`} placeholder="Ονοματεπώνυμο..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Τηλέφωνο</label>
               <input type="tel" aria-label="Τηλέφωνο" name="patientTel" required readOnly={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`} placeholder="69..." />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Διάρκεια</label>
               <select aria-label="Διάρκεια" name="duration" defaultValue="30" onChange={() => { setSuggestion(null); setSuggestedDuration(null); setError('') }} disabled={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`}>
                  <option value="15">15 Λεπτά</option>
                  <option value="30">30 Λεπτά</option>
                  <option value="45">45 Λεπτά</option>
                  <option value="60">1 Ώρα</option>
                  <option value="90">1.5 Ώρα</option>
               </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Σημειώσεις</label>
            <textarea aria-label="Σημειώσεις" name="notes" rows={3} readOnly={!canWrite} className={`w-full bg-slate-800 border-slate-700 text-white p-3 rounded-xl outline-none transition-all ${canWrite ? 'focus:ring-2 focus:ring-blue-500' : 'cursor-not-allowed opacity-80'}`} placeholder="Σημειώσεις..." />
          </div>

          </fieldset>
          <button type="submit" disabled={loading || !canWrite || !apt} className={`w-full py-4 rounded-2xl font-black uppercase tracking-tighter transition-all transform shadow-xl shadow-white/5 ${canWrite ? 'bg-white text-slate-950 hover:bg-blue-500 hover:text-white active:scale-95' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}>
            {!canWrite ? 'ΠΡΟΒΟΛΗ ΜΟΝΟ' : loading ? 'ΚΡΑΤΗΣΗ...' : 'ΕΠΙΒΕΒΑΙΩΣΗ'}
          </button>
        </form>
    </ModalFrame>
  )
}
