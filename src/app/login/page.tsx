'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, User, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Λάθος στοιχεία πρόσβασης')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-xl p-10 rounded-[40px] border border-slate-700/50 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">MediBook</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Restricted Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="USERNAME"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-blue-500 transition-all uppercase tracking-widest"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              placeholder="PASSWORD"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-white text-sm outline-none focus:border-blue-500 transition-all uppercase tracking-widest"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-400 text-[10px] font-black uppercase text-center tracking-widest">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Εισοδος'}
          </button>
        </form>
      </div>
    </div>
  )
}
