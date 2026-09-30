'use client'
import Link from 'next/link'
import { useState, useRef, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { el } from 'date-fns/locale'
import { ArrowUpRight, ChevronLeft, ChevronRight, CalendarDays, Loader2, LogOut, LayoutDashboard, Plus, Search, Clock3, Check, HeartPulse, SlidersHorizontal, NotebookPen } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import BookingManager from './BookingManager'
import BookingModal from './BookingModal'
import DailyNote from './DailyNote'
import { getDayAppointments, getDayNote } from '@/app/actions'
import type { CalendarResource, AppointmentSlot } from '@/lib/calendar-types'
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
  const [newBooking, setNewBooking] = useState<AppointmentSlot | null>(null)
  const requestId = useRef(0)
  const canWrite = resources.some(r => r.canWrite)
  const username = session?.user?.name || 'Χρήστης'
  const slots = resources.flatMap(r => getVisibleSlots(r.appointments))
  const booked = slots.filter(a => a.status === 'BOOKED').length
  const free = slots.filter(a => a.status === 'FREE').length
  const firstFree = resources.filter(r => r.canWrite && (selectedResource === 'all' || String(r.id) === selectedResource)).flatMap(r => getVisibleSlots(r.appointments)).filter(a => a.status === 'FREE').sort((a, b) => +new Date(a.date) - +new Date(b.date))[0]
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
        <div className="sidebar-bottom"><div className="care-card"><span className="care-icon"><HeartPulse size={22} /></span><strong>Λιγότερη οργάνωση.<br />Περισσότερη φροντίδα.</strong><p>Η ημέρα σου, σε ένα μέρος.</p></div><div className="sidebar-footer"><span className="online-dot" /> MediBook workspace <span>v. 2.0</span></div></div>
      </aside>
      <div className="main-shell">
        <header className="topbar"><div className="breadcrumb">Χώρος εργασίας <ChevronRight size={14} /><strong>Επισκόπηση</strong></div><div className="account"><span className="account-avatar">{username.charAt(0).toUpperCase()}</span><div><strong>{username}</strong><small>{canWrite ? 'Διαχείριση ραντεβού' : 'Πρόσβαση προβολής'}</small></div><button className="icon-button" onClick={() => signOut()} aria-label="Αποσύνδεση" title="Αποσύνδεση"><LogOut size={18} /></button></div></header>
        <div className="dashboard-content" id="overview">
          <section className="page-heading"><div><p className="eyebrow"><span className="online-dot" /> ΟΛΑ ΣΤΗ ΘΕΣΗ ΤΟΥΣ</p><h1>Η ημέρα σου, οργανωμένη<span>.</span></h1><p className="muted">Ραντεβού, διαθεσιμότητα και σημειώσεις. Μια καθαρή εικόνα, κάθε μέρα.</p></div><button className="primary-button" disabled={!firstFree || loading} onClick={() => setNewBooking(firstFree)}><Plus size={18} /> Νέο ραντεβού</button></section>
          <section className="stats-grid" aria-label="Σύνοψη επιλεγμένης ημέρας">
            <div className="stat-card featured"><div className="stat-top"><span>Ραντεβού ημέρας</span><CalendarDays size={19} /></div><div className="stat-value">{booked.toString().padStart(2, '0')}<span className="stat-detail"><span className="tiny-dot" /> Προγραμματισμένα</span></div><div className="stat-bottom">Μια καλή ημέρα ξεκινά με οργάνωση <ArrowUpRight size={16} /></div></div>
            <div className="stat-card"><div className="stat-top"><span>Διαθέσιμες ώρες</span><span className="stat-icon"><Clock3 size={19} /></span></div><div className="stat-value">{free.toString().padStart(2, '0')}<span className="stat-detail">Ελεύθερα διαστήματα</span></div><div className="stat-bottom"><span className="online-dot" /> Χώρος για το επόμενο ραντεβού</div></div>
            <div className="stat-card"><div className="stat-top"><span>Ημερολόγια</span><span className="stat-icon lilac"><Check size={19} /></span></div><div className="stat-value">{resources.length.toString().padStart(2, '0')}<span className="stat-detail">Στον χώρο εργασίας σου</span></div><div className="stat-bottom">{resources.filter(r => r.canWrite).length} με δυνατότητα επεξεργασίας</div></div>
          </section>
          <section id="schedule" className="schedule-section">
            <div className="section-heading"><div><h2>Το πρόγραμμά σου <span className="count-pill">{booked}</span></h2><p className="muted">Κάθε ραντεβού, τη σωστή στιγμή.</p></div><div className="date-controls"><button className="today-button" disabled={loading} onClick={() => void refreshData(new Date())}>Σήμερα</button><div className="date-switcher"><button className="icon-button" aria-label="Προηγούμενη ημέρα" disabled={loading} onClick={() => void refreshData(subDays(currentDate, 1))}><ChevronLeft size={18} /></button><label className="date-label"><CalendarDays size={17} /><span>{format(currentDate, 'd MMM yyyy', { locale: el })}</span><input aria-label="Επιλογή ημερομηνίας" type="date" disabled={loading} value={format(currentDate, 'yyyy-MM-dd')} onChange={e => { if(e.target.value) void refreshData(new Date(`${e.target.value}T12:00:00`)) }} /></label><button className="icon-button" aria-label="Επόμενη ημέρα" disabled={loading} onClick={() => void refreshData(addDays(currentDate, 1))}><ChevronRight size={18} /></button></div></div></div>
            <div className="schedule-toolbar"><div className="segmented-control" aria-label="Φίλτρο ραντεβού">{[['all','Όλα'],['BOOKED','Κρατήσεις'],['FREE','Διαθέσιμα']].map(([value,label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><div className="toolbar-inputs"><label className="search-field"><Search size={16} /><input aria-label="Αναζήτηση ασθενή ή τηλεφώνου" placeholder="Αναζήτηση ασθενή..." value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Καθαρισμός αναζήτησης" onClick={() => setQuery('')}>×</button>}</label><label className="resource-filter"><SlidersHorizontal size={15} /><select aria-label="Φίλτρο ημερολογίου" value={selectedResource} onChange={e => setSelectedResource(e.target.value)}><option value="all">Όλα τα ημερολόγια</option>{resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label></div></div>
            {error && <p className="error-banner" role="alert">{error} <button onClick={() => void refreshData()}>Επανάληψη</button></p>}
            <div className="schedule-layout" aria-busy={loading}>
              <div className={`calendars-grid ${visibleResources.length === 1 ? 'single-calendar' : ''}`}>
                {resources.length === 0 && <div className="empty-state"><CalendarDays size={28} /><h3>Δεν υπάρχουν διαθέσιμα ημερολόγια</h3><p>Ζήτησε από τον διαχειριστή πρόσβαση σε ένα ημερολόγιο.</p></div>}
                {visibleResources.map((resource, index) => <section className="calendar-card" key={resource.id}><div className="calendar-heading"><span className={`calendar-icon ${index % 2 ? 'lilac' : ''}`}><CalendarDays size={19} /></span><div><h3>{resource.name}</h3><p>{resource.groupName || (resource.type === 'MEDICAL' ? 'Ιατρικό ημερολόγιο' : 'Ημερολόγιο ραντεβού')}</p></div><span className="calendar-count">{resource.appointments.filter(a => a.status === 'BOOKED').length} ραντεβού</span></div><div className="calendar-subheading"><span>{format(currentDate, 'EEEE', { locale: el })}</span><span>{resource.canWrite ? 'Ώρα / Ραντεβού' : 'Μόνο προβολή'}</span></div><div className="calendar-slots"><BookingManager appointments={resource.appointments} onRefresh={refreshData} canWrite={resource.canWrite} query={query} filter={filter} /></div></section>)}
              </div>
              <aside id="notes" className="notes-column"><DailyNote key={format(currentDate, 'yyyy-MM-dd')} dateStr={currentDate.toISOString()} initialContent={dayNote} canWrite={canWrite} /><div className="day-tip"><span className="tip-label">ΜΙΚΡΗ ΥΠΕΝΘΥΜΙΣΗ</span><p>Λίγος χρόνος ανάμεσα στα ραντεβού κάνει τη διαφορά.</p><span>Φρόντισε και τον δικό σου χρόνο. <HeartPulse size={17} /></span></div></aside>
            </div>
            {loading && <div className="loading-indicator" role="status"><Loader2 size={16} className="animate-spin" /> Ενημέρωση προγράμματος...</div>}
          </section>
          <footer className="page-footer"><span>Φτιαγμένο για μια πιο ήρεμη καθημερινότητα.</span><span>MediBook <span className="footer-cross">✳</span></span></footer>
        </div>
      </div>
      {newBooking && <BookingModal apt={newBooking} canWrite={canWrite} onClose={() => setNewBooking(null)} onRefresh={refreshData} />}
    </div>
  )
}
