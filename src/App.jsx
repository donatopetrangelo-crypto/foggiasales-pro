import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import SearchPage from './pages/SearchPage'
import CRMPage from './pages/CRMPage'
import RoutePage from './pages/RoutePage'
import AlertsPage from './pages/AlertsPage'
import LoginPage from './pages/LoginPage'
import { supabase } from './lib/supabase'
import { useAppStore } from './store/appStore'
import { Spinner } from './components/ui'

export default function App() {
  const { user, setUser } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [setUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size={36} />
          <p className="text-slate-500 text-sm mt-4">Caricamento FoggiaSales Pro...</p>
        </div>
      </div>
    )
  }

  // Bypass auth in dev if no Supabase configured
  const isDev = import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL?.includes('supabase.co')
  const isAuthenticated = !!user || isDev

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/"        element={<DashboardPage />} />
        <Route path="/search"  element={<SearchPage />} />
        <Route path="/crm"     element={<CRMPage />} />
        <Route path="/route"   element={<RoutePage />} />
        <Route path="/alerts"  element={<AlertsPage />} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
