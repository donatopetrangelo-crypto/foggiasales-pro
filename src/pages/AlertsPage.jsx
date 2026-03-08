import { useState } from 'react'
import { Bell, BellOff, Plus, MapPin, Calendar, Star, Sparkles, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { PageHeader, Spinner, EmptyState, StarRating, CategoryBadge } from '../components/ui'
import { useAlerts, useAddAlertToCRM } from '../hooks/useClients'
import { useAppStore } from '../store/appStore'
import { CATEGORIES } from '../lib/constants'

export default function AlertsPage() {
  const { alertsEnabled, toggleAlerts } = useAppStore()
  const { data: alerts = [], isLoading } = useAlerts()
  const addToCRM = useAddAlertToCRM()
  const [added, setAdded] = useState(new Set())

  async function handleAddToCRM(alert) {
    await addToCRM.mutateAsync({
      alertId: alert.id,
      clientData: {
        name: alert.business_name,
        category: alert.category,
        address: alert.address,
        city: alert.city,
        lat: alert.lat,
        lng: alert.lng,
        status: 'da_contattare',
        estimated_opening: alert.estimated_opening,
      },
    })
    setAdded(prev => new Set([...prev, alert.id]))
  }

  const pending = alerts.filter(a => !a.added_to_crm && !added.has(a.id))
  const processed = alerts.filter(a => a.added_to_crm || added.has(a.id))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Nuove Aperture"
        subtitle="Segnalazioni di nuove attività nella provincia di Foggia"
        actions={
          <button
            onClick={toggleAlerts}
            className={alertsEnabled ? 'btn-secondary' : 'btn-ghost'}
          >
            {alertsEnabled ? <Bell size={15} className="text-brand-400" /> : <BellOff size={15} />}
            {alertsEnabled ? 'Avvisi attivi' : 'Avvisi disattivati'}
          </button>
        }
      />

      {!alertsEnabled && (
        <div className="card border-yellow-500/20 bg-yellow-500/5 p-4 mb-6 flex gap-3 text-yellow-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <p>Gli avvisi nuove aperture sono disattivati. Clicca "Avvisi disattivati" per riattivarli.</p>
        </div>
      )}

      {/* How it works */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-brand-400" />
          <h3 className="font-display font-semibold text-sm text-slate-100">Come funziona</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '🗺️', title: 'Google Maps', desc: 'Schede attività in costruzione o pre-apertura' },
            { icon: '📱', title: 'Social Media', desc: 'Post Facebook/Instagram locali su nuove aperture' },
            { icon: '📋', title: 'Registro Imprese', desc: 'Nuove iscrizioni CCIAA provincia di Foggia' },
            { icon: '📣', title: 'Annunci Locali', desc: 'Siti di annunci e forum locali foggiani' },
          ].map(item => (
            <div key={item.title} className="text-center p-3 rounded-xl bg-slate-800/40">
              <p className="text-2xl mb-1">{item.icon}</p>
              <p className="text-xs font-semibold text-slate-300">{item.title}</p>
              <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nessuna segnalazione"
          subtitle="Le nuove aperture rilevate appariranno qui. Il sistema monitora automaticamente le fonti configurate."
        />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <h2 className="font-display font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                Da contattare ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAdd={handleAddToCRM}
                    loading={addToCRM.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {processed.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-slate-500 mb-3 text-sm">
                Già aggiunti al CRM ({processed.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {processed.map(alert => (
                  <AlertCard key={alert.id} alert={alert} done />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AlertCard({ alert, onAdd, loading, done }) {
  const catCfg = CATEGORIES[alert.category]
  const sourceLabels = {
    google_maps: 'Google Maps',
    social_media: 'Social Media',
    segnalazione: 'Segnalazione',
    registro_imprese: 'Registro Imprese',
  }

  return (
    <div className={`card p-4 ${done ? '' : 'card-hover'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-display font-semibold text-slate-100">{alert.business_name}</h3>
            {alert.is_new_opening && (
              <span className="badge bg-accent-500/20 text-accent-400 text-[10px]">🆕 Nuova apertura</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin size={11} /> {alert.city} {alert.address && `— ${alert.address}`}
            </span>
            {alert.estimated_opening && (
              <span className="flex items-center gap-1 text-brand-400">
                <Calendar size={11} />
                Apertura stimata: {format(new Date(alert.estimated_opening), 'd MMMM yyyy', { locale: it })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {catCfg && <CategoryBadge category={alert.category} />}
            <span className="badge bg-slate-800 text-slate-400 text-[10px]">
              📡 {sourceLabels[alert.source] || alert.source}
            </span>
            <span className="badge bg-slate-800 text-slate-500 text-[10px]">
              Affidabilità: {alert.confidence_score}%
            </span>
          </div>

          {alert.notes && (
            <p className="text-xs text-slate-600 mt-2">{alert.notes}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StarRating score={alert.priority_score || 0} size={13} />
          {done ? (
            <span className="badge bg-green-500/20 text-green-400 text-[10px]">✓ Nel CRM</span>
          ) : (
            <button
              onClick={() => onAdd(alert)}
              disabled={loading}
              className="btn-primary text-xs py-1.5 px-3"
            >
              <Plus size={12} /> Aggiungi CRM
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
