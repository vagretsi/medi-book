'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { LockKeyhole, UserRound, Loader2, ArrowRight, HeartPulse, CalendarDays, Check, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await signIn('credentials', { username: username.trim().toLowerCase(), password, redirect: false })
      if (res?.error || !res?.ok) { setError('Τα στοιχεία πρόσβασης δεν είναι σωστά. Δοκίμασε ξανά.'); setLoading(false) }
      else { router.push('/'); router.refresh() }
    } catch { setError('Δεν ήταν δυνατή η σύνδεση. Δοκίμασε ξανά.'); setLoading(false) }
  }
  return <div className="login-page"><section className="login-story"><a className="brand" href="/login"><span className="brand-mark"><HeartPulse size={24} /></span><span>medi<span className="brand-light">book</span><small>CARE, ORGANIZED.</small></span></a><div className="story-content"><span className="story-caption">Ο ΧΡΟΝΟΣ ΣΟΥ, ΜΕΤΡΑΕΙ.</span><h1>Κάθε ημέρα,<br />λίγο πιο <span>απλή.</span></h1><p>Δώσε χώρο σε ό,τι έχει σημασία. Τα ραντεβού και η οργάνωση του ιατρείου σου ξεκινούν εδώ.</p><div className="mini-schedule" aria-label="Ενδεικτικό πρόγραμμα"><div><span>Μια ματιά στην ημέρα σου</span><CalendarDays size={16} /></div><div className="mini-appointment"><span>09:00</span><div>Πρώτο ραντεβού <Check size={14} /></div></div><div className="mini-appointment"><span>09:30</span><div>Χρόνος για φροντίδα <HeartPulse size={14} /></div></div></div></div><footer>Λιγότερη οργάνωση. Περισσότερη φροντίδα.</footer><div className="story-orbit" /></section><section className="login-form-area"><div className="login-form-inner"><p className="eyebrow"><span className="online-dot" /> ΚΑΛΩΣ ΗΡΘΕΣ ΣΤΟ MEDIBOOK</p><h2>Χαίρομαστε που είσαι εδώ.</h2><p className="muted">Συνδέσου στον χώρο εργασίας σου.<br />Το πρόγραμμά σου σε περιμένει.</p><form className="login-form" onSubmit={handleSubmit}><label className="form-field" htmlFor="username"><span>Όνομα χρήστη</span><div className="input-wrap"><UserRound size={16} /><input id="username" autoComplete="username" placeholder="Το όνομα χρήστη σου" value={username} onChange={e => setUsername(e.target.value)} required /></div></label><label className="form-field" htmlFor="password"><span>Κωδικός πρόσβασης</span><div className="input-wrap"><LockKeyhole size={16} /><input id="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} placeholder="Ο κωδικός σου" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" className="password-toggle" aria-label={showPassword ? 'Απόκρυψη κωδικού' : 'Εμφάνιση κωδικού'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{error && <p className="error-banner" role="alert">{error}</p>}<button type="submit" className="primary-button" disabled={loading}>{loading ? <><Loader2 size={17} className="animate-spin" /> Σύνδεση...</> : <>Σύνδεση στον χώρο μου <ArrowRight size={16} /></>}</button></form><div className="demo-access"><Sparkles size={17} /><div><strong>Μια πρώτη γνωριμία με το MediBook</strong><p>Δοκίμασε την εφαρμογή με όνομα χρήστη <b>demo</b><br />και κωδικό <b>demo</b>.</p><button type="button" onClick={() => { setUsername('demo'); setPassword('demo'); setError('') }}>Συμπλήρωση στοιχείων demo <span aria-hidden="true">↗</span></button></div></div><p className="login-footer"><ShieldCheck size={13} /> Ο δικός σου χώρος για την οργάνωση του ιατρείου.</p></div></section></div>
}
