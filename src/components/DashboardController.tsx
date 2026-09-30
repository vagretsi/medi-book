'use client'
import Link from 'next/link'
import { useState, useRef, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { el } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, Loader2, LogOut, LayoutDashboard, Plus, Search, Clock3, Check, HeartPulse, SlidersHorizontal, NotebookPen } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import BookingManager from './BookingManager'
import BookingModal from './BookingModal'
import DailyNote from './DailyNote'
import { getDayAppointments, getDayNote } from '@/app/actions'
import type { CalendarResource } from '@/lib/calendar-types'
import { getVisibleSlots } from '@/lib/visible-slots'

export default function DashboardController({ initialData, initialDayNote }: { initialData: CalendarResource[], initialDayNote: string }) {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [resources, setResources] = useState(initialData)
  const [dayNote, setDayNote] = useState(initialDayNote)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedResource, setSelectedResource] = useState('all')
  const [newBooking, setNewBooking] = useState(false)
  const requestId = useRef(0)
  const canWrite = resources.some(r => r.canWrite)
  const username = session?.user?.name || 'Χρήστης'
  const slots = resources.flatMap(r => getVisibleSlots(r.appointments))
  const booked = slots.filter(a => a.status === 'BOOKED').length
  const free = slots.filter(a => a.status === 'FREE').length
  const hasFreeSlot = resources.some(r => r.canWrite && getVisibleSlots(r.appointments).some(a => a.status === 'FREE'))
  const visibleResources = resources.filter(r => selectedResource === 'all' || String(r.id) === selectedResource)

  const refreshData = useCallback(async (targetDate = currentDate) => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const [data, note] = await Promise.all([getDayAppointments(targetDate.toISOString()), getDayNote(targetDate.toISOString())])
      if (id !== requestId.current) return
      setResources(data)
      setDayNote(note)
      setCurrentDate(targetDate)
    } catch {
      if (id === requestId.current) setError('Δεν ήταν δυνατή η φόρτωση. Δοκίμασε ξανά.')
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [currentDate])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="MediBook αρχική"><span className="brand-mark"><HeartPulse size={23} /></span><span>medi<span className="brand-light">book</span><small>CARE, ORGANIZED.</small></span></Link>
        <div className="workspace-badge"><span className="workspace-avatar">M</span><div><strong>Το ιατρείο μου</strong><small>Χώρος εργασίας</small></div><span className="online-dot" /></div>
        <p className="nav-caption">ΧΩΡΟΣ ΕΡΓΑΣΙΑΣ</p>
        <nav aria-label="Κύρια πλοήγηση"><a className="nav-item active" href="#overview"><LayoutDashboard size={18} /> Επισκόπηση <span className="nav-dot" /></a><a className="nav-item" href="#schedule"><CalendarDays size={18} /> Πρόγραμμα</a><a className="nav-item" href="#notes"><NotebookPen size={18} /> Σημειώσεις ημέρας</a></nav>

      </aside>
      <div className="main-shell">
        <header className="topbar"><div className="breadcrumb">Χώρος εργασίας <ChevronRight size={14} /><strong>Επισκόπηση</strong></div><div className="account"><span className="account-avatar">{username.charAt(0).toUpperCase()}</span><div><strong>{username}</strong><small>{canWrite ? 'Διαχείριση ραντεβού' : 'Πρόσβαση προβολής'}</small></div><button className="icon-button" onClick={() => signOut()} aria-label="Αποσύνδεση" title="Αποσύνδεση"><LogOut size={18} /></button></div></header>
        <div className="dashboard-content" id="overview">
          <section className="page-heading"><h1>Ραντεβού</h1><button className="primary-button" disabled={!hasFreeSlot || loading} onClick={() => setNewBooking(true)}><Plus size={18} /> Νέο ραντεβού</button></section>
          <section className="day-banner" aria-label="Επιλεγμένη ημέρα">
            <div className="day-banner-caption"><CalendarDays size={25} /><span>ΠΡΟΓΡΑΜΜΑ ΗΜΕΡΑΣ</span></div>
            <div className="day-banner-navigation">
              <button className="day-arrow" aria-label="Προηγούμενη ημέρα" disabled={loading} onClick={() => void refreshData(subDays(currentDate, 1))}><ChevronLeft size={25} /></button>
              <label className="day-banner-date">
                <span className="day-banner-weekday">{format(currentDate, 'EEEE', { locale: el })}</span>
                <span className="day-banner-value" aria-live="polite">{format(currentDate, 'd MMMM yyyy', { locale: el })}</span>
                <input aria-label="Επιλογή ημερομηνίας" type="date" disabled={loading} value={format(currentDate, 'yyyy-MM-dd')} onChange={e => { if (e.target.value) void refreshData(new Date(`${e.target.value}T12:00:00`)) }} />
              </label>
              <button className="day-arrow" aria-label="Επόμενη ημέρα" disabled={loading} onClick={() => void refreshData(addDays(currentDate, 1))}><ChevronRight size={25} /></button>
            </div>
            <button className="day-today" disabled={loading} onClick={() => void refreshData(new Date())}>Σήμερα</button>
          </section>
          <section className="stats-grid" aria-label="Σύνοψη επιλεγμένης ημέρας">
            <div className="stat-card featured"><div className="stat-top"><span>Ραντεβού</span><CalendarDays size={19} /></div><div className="stat-value">{booked.toString().padStart(2, '0')}</div></div>
            <div className="stat-card"><div className="stat-top"><span>Διαθέσιμα διαστήματα</span><Clock3 size={19} /></div><div className="stat-value">{free.toString().padStart(2, '0')}</div></div>
            <div className="stat-card"><div className="stat-top"><span>Ημερολόγια</span><Check size={19} /></div><div className="stat-value">{resources.length.toString().padStart(2, '0')}</div></div>
          </section>
          <section id="schedule" className="schedule-section">
            <div className="section-heading"><div><h2>Πρόγραμμα <span className="count-pill">{booked}</span></h2></div></div>
            <div className="schedule-toolbar"><div className="segmented-control" aria-label="Φίλτρο ραντεβού">{[['all','Όλα'],['BOOKED','Κρατήσεις'],['FREE','Διαθέσιμα']].map(([value,label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><div className="toolbar-inputs"><label className="search-field"><Search size={16} /><input aria-label="Αναζήτηση ασθενή ή τηλεφώνου" placeholder="Αναζήτηση ασθενή..." value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Καθαρισμός αναζήτησης" onClick={() => setQuery('')}>×</button>}</label><label className="resource-filter"><SlidersHorizontal size={15} /><select aria-label="Φίλτρο ημερολογίου" value={selectedResource} onChange={e => setSelectedResource(e.target.value)}><option value="all">Όλα τα ημερολόγια</option>{resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label></div></div>
            {error && <p className="error-banner" role="alert">{error} <button onClick={() => void refreshData()}>Επανάληψη</button></p>}
            <div className="schedule-layout" aria-busy={loading}>
              <div className={`calendars-grid ${visibleResources.length === 1 ? 'single-calendar' : ''}`}>
                {resources.length === 0 && <div className="empty-state"><CalendarDays size={28} /><h3>Δεν υπάρχουν διαθέσιμα ημερολόγια</h3><p>Ζήτησε από τον διαχειριστή πρόσβαση σε ένα ημερολόγιο.</p></div>}
                {visibleResources.map((resource, index) => <section className="calendar-card" key={resource.id}><div className="calendar-heading"><span className={`calendar-icon ${index % 2 ? 'lilac' : ''}`}><CalendarDays size={19} /></span><div><h3>{resource.name}</h3><p>{resource.groupName || (resource.type === 'MEDICAL' ? 'Ιατρικό ημερολόγιο' : 'Ημερολόγιο ραντεβού')}</p></div><span className="calendar-count">{resource.appointments.filter(a => a.status === 'BOOKED').length} ραντεβού</span></div><div className="calendar-subheading"><span>{format(currentDate, 'EEEE', { locale: el })}</span><span>{resource.canWrite ? 'Ώρα / Ραντεβού' : 'Μόνο προβολή'}</span></div><div className="calendar-slots"><BookingManager resourceName={resource.name} appointments={resource.appointments} onRefresh={refreshData} canWrite={resource.canWrite} query={query} filter={filter} /></div></section>)}
              </div>
              <aside id="notes" className="notes-column"><DailyNote key={format(currentDate, 'yyyy-MM-dd')} dateStr={currentDate.toISOString()} initialContent={dayNote} canWrite={canWrite} /></aside>
            </div>
            {loading && <div className="loading-indicator" role="status"><Loader2 size={16} className="animate-spin" /> Ενημέρωση προγράμματος...</div>}
          </section>

        </div>
      </div>
      {newBooking && <BookingModal resources={resources} canWrite={canWrite} onClose={() => setNewBooking(false)} onRefresh={refreshData} />}
    </div>
  )
}
