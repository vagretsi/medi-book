'use client'
import { useState, useEffect } from 'react'
import { saveDayNote } from '@/app/actions'
import { FilePenLine, CheckCircle2, Loader2 } from 'lucide-react'

export default function DailyNote({ dateStr, initialContent, canWrite }: { dateStr: string, initialContent: string, canWrite: boolean }) {
  const [content, setContent] = useState(initialContent)
  const [status, setStatus] = useState<'saved' | 'saving' | 'typing'>('saved')

  // Η λογική του Auto-Save (Debounce)
  useEffect(() => {
    if (!canWrite) return
    // Αν δεν έχουμε αλλάξει κάτι, μην κάνεις τίποτα
    if (content === initialContent) return;

    // Περίμενε 1 δευτερόλεπτο αφού σταματήσει ο χρήστης να πληκτρολογεί
    const timer = setTimeout(async () => {
      setStatus('saving')
      await saveDayNote(dateStr, content)
      setStatus('saved')
    }, 1000)

    // Καθαρισμός του timer αν ο χρήστης ξαναπατήσει κουμπί
    return () => clearTimeout(timer)
  }, [content, dateStr, canWrite, initialContent])

  return (
    <div className="bg-slate-800/30 rounded-[32px] border border-slate-700/50 shadow-xl overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* HEADER */}
      <div className="p-5 border-b border-slate-700/50 flex justify-between items-center bg-yellow-500/5">
        <div className="flex items-center gap-3">
          <FilePenLine className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-bold text-white uppercase tracking-tighter">ΣΗΜΕΙΩΣΕΙΣ</h2>
        </div>
        
        {/* Status Indicator */}
        <div className="text-[10px] font-black uppercase tracking-widest">
          {!canWrite && <span className="text-amber-400">Προβολή μόνο</span>}
          {canWrite && status === 'saved' && <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Saved</span>}
          {canWrite && status === 'saving' && <span className="text-yellow-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>}
          {canWrite && status === 'typing' && <span className="text-slate-500">Typing...</span>}
        </div>
      </div>

      {/* TEXT AREA */}
      <div className="flex-1 p-0">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (canWrite) setStatus('typing')
          }}
          placeholder={canWrite ? "Γράψε ελεύθερα εδώ..." : "Προβολή μόνο"}
          readOnly={!canWrite}
          className={`w-full h-full bg-transparent text-slate-300 p-6 text-sm leading-relaxed resize-none outline-none transition-colors ${canWrite ? 'focus:bg-slate-800/50' : 'cursor-not-allowed opacity-80'}`}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
