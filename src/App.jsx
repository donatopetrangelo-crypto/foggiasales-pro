import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Search, Users, Route, Bell, ChevronRight, Package, Settings } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

const NAV_ITEMS = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search',  icon: Search,          label: 'Cerca Clienti' },
  { to: '/crm',     icon: Users,           label: 'CRM' },
  { to: '/route',   icon: Route,           label: 'Giro Commerciale' },
  { to: '/alerts',  icon: Bell,            label: 'Nuove Aperture' },
]

export function AppShell({ children }) {
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <div className="flex min-h-screen">
      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ease-out bg-slate-900/95 border-r border-slate-800/60 backdrop-blur-xl ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/60">
          <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-500/30">
            <Package size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in overflow-hidden">
              <p className="font-display font-bold text-sm text-slate-100 leading-tight">FoggiaSales</p>
              <p className="text-[10px] text-slate-500 font-mono">PRO v1.0</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span className="animate-fade-in">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Settings + Toggle */}
        <div className="px-2 pb-2 space-y-1 border-t border-slate-800/60 pt-2">
          <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Settings size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="animate-fade-in">Impostazioni</span>}
          </NavLink>
          <button onClick={toggleSidebar} className="sidebar-link w-full justify-center" title={sidebarOpen ? 'Chiudi' : 'Apri'}>
            {sidebarOpen ? <ChevronRight size={16} className="rotate-180" /> : <ChevronRight size={16} />}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'}`}>
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-100">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
