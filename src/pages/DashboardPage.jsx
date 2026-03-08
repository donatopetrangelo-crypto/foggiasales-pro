import { Users, UserCheck, PhoneCall, Bell, TrendingUp, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { PageHeader, StatCard, StatusBadge, Spinner } from '../components/ui'
import { useDashboardStats, useRecentActivity } from '../hooks/useClients'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: activity = [], isLoading: actLoading } = useRecentActivity()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle={`Benvenuto — ${format(new Date(), "EEEE d MMMM yyyy", { locale: it })}`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          <div className="col-span-4 flex justify-center py-10"><Spinner /></div>
        ) : (
          <>
            <StatCard label="Clienti Totali"    value={stats?.total || 0}     icon={Users}    color="brand" />
            <StatCard label="Clienti Acquisiti" value={stats?.acquired || 0}  icon={UserCheck} color="green" />
            <StatCard label="Da Contattare"     value={stats?.toContact || 0} icon={PhoneCall} color="orange" />
            <StatCard label="Nuove Aperture"    value={stats?.newAlerts || 0} icon={Bell}      color="yellow" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-brand-400" />
            <h2 className="font-display font-semibold text-slate-100">Attività Recenti</h2>
          </div>
          {actLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : activity.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8">Nessuna attività registrata</p>
          ) : (
            <div className="space-y-3">
              {activity.slice(0, 8).map(entry => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {entry.clients?.name}
                      </span>
                      <StatusBadge status={entry.status} />
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{entry.notes}</p>
                    )}
                    <p className="text-xs text-slate-600">
                      {format(new Date(entry.visit_date), "d MMM, HH:mm", { locale: it })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-accent-500" />
            <h2 className="font-display font-semibold text-slate-100">Suggerimenti</h2>
          </div>
          <div className="space-y-3">
            {[
              { icon: '🎯', text: 'Priorità ai clienti con 4-5 stelle nella tua zona' },
              { icon: '🆕', text: 'Controlla le nuove aperture ogni settimana' },
              { icon: '🗺️', text: 'Usa il Giro Commerciale per ottimizzare i tuoi spostamenti' },
              { icon: '📞', text: 'Aggiorna lo stato dopo ogni contatto telefonico' },
              { icon: '⭐', text: 'I take-away hanno il consumo packaging più alto' },
            ].map(({ icon, text }, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-lg leading-none">{icon}</span>
                <p className="text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
