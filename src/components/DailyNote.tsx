'use client'
import { useState, useEffect, useRef } from 'react'
import { saveDayNote } from '@/app/actions'
import { NotebookPen, Check, Loader2, LockKeyhole } from 'lucide-react'

export default function DailyNote({ dateStr, initialContent, canWrite }: { dateStr: string, initialContent: string, canWrite: boolean }) {
  const [content, setContent] = useState(initialContent)
  const [status, setStatus] = useState<'saved' | 'saving' | 'typing' | 'error'>('saved')
  const savedContent = useRef(initialContent)
  const revision = useRef(0)
  useEffect(() => {
    if (!canWrite || content === savedContent.current) return
    const version = revision.current
    let active = true
    const timer = setTimeout(async () => {
      setStatus('saving')
      try {
        await saveDayNote(dateStr, content)
        savedContent.current = content
        if (active && version === revision.current) setStatus('saved')
      } catch {
        if (active && version === revision.current) setStatus('error')
      }
    }, 1000)
    return () => { active = false; clearTimeout(timer) }
  }, [content, dateStr, canWrite])
  return <section className="notes-card"><div className="notes-heading"><NotebookPen size={18} /><h3>Σημειώσεις ημέρας</h3><span role="status">{!canWrite ? <LockKeyhole size={12} /> : status === 'saved' ? <><Check size={12} /> Έτοιμο</> : status === 'saving' ? <Loader2 size={12} className="animate-spin" /> : status === 'error' ? 'Αποτυχία' : 'Γράφεις...'}</span></div><textarea aria-label="Σημειώσεις ημέρας" value={content} onChange={e => { revision.current++; setContent(e.target.value); setStatus(e.target.value === savedContent.current ? 'saved' : 'typing') }} placeholder={canWrite ? 'Σημειώσεις...' : 'Δεν υπάρχουν σημειώσεις.'} readOnly={!canWrite} />{status === 'error' && <p className="error-banner" role="alert">Δεν αποθηκεύτηκε. Άλλαξε το κείμενο για νέα προσπάθεια.</p>}<div className="notes-footer"><span className="online-dot" />{canWrite ? 'Αυτόματη αποθήκευση' : 'Πρόσβαση μόνο για προβολή'}</div></section>
}
