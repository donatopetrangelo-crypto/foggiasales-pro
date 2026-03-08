import { useState } from 'react'
import { Package, Mail, Lock, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('login') // login | signup

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const fn = mode === 'login'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password })
      const { error: err } = await fn
      if (err) throw err
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/30">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-slate-100">FoggiaSales Pro</h1>
          <p className="text-slate-500 text-sm mt-1">CRM per grossisti di packaging</p>
          <p className="text-xs text-slate-600 mt-0.5">Provincia di Foggia</p>
        </div>

        {/* Card */}
        <div className="card p-6 shadow-2xl shadow-slate-950/50">
          <h2 className="font-display font-semibold text-slate-200 mb-5">
            {mode === 'login' ? 'Accedi al tuo account' : 'Crea account'}
          </h2>

          <div className="space-y-3">
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                className="input pl-9"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="input pl-9"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="btn-primary w-full justify-center py-2.5 mt-1"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Accesso...' : mode === 'login' ? 'Accedi' : 'Registrati'}
            </button>
          </div>

          <button
            onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
            className="text-xs text-slate-500 hover:text-slate-300 mt-4 block w-full text-center transition-colors"
          >
            {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
        </div>

        <p className="text-xs text-slate-700 text-center mt-4">
          © 2025 FoggiaSales Pro • Tutti i diritti riservati
        </p>
      </div>
    </div>
  )
}
