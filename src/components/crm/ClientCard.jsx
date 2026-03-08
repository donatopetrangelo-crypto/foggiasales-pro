import { useState } from 'react'
import { Phone, MapPin, Plus, Route, Star, ChevronDown, CheckCircle2, RefreshCw } from 'lucide-react'
import { StarRating, StatusBadge, StatusSelect, CategoryBadge, Modal } from '../ui'
import { CATEGORIES } from '../../lib/constants'
import { useUpdateClientStatus, useAddCRMEntry } from '../../hooks/useClients'
import { useAppStore } from '../../store/appStore'

export function ClientCard({ client, onSave, compact = false }) {
  const [showQuickEdit, setShowQuickEdit] = useState(false)
  const [note, setNote] = useState('')
  const [newStatus, setNewStatus] = useState(client.status)
  const { addToRoute, routeClients } = useAppStore()
  const updateStatus = useUpdateClientStatus()
  const addEntry = useAddCRMEntry()
  const inRoute = routeClients.some(c => c.id === client.id)

  const subLabel = Object.values(CATEGORIES)
    .flatMap(c => c.subcategories)
    .find(s => s.value === client.subcategory)?.label || client.subcategory

  async function handleSaveStatus() {
    await addEntry.mutateAsync({
      client_id: client.id,
      status: newStatus,
      notes: note,
      visit_type: 'visita',
    })
    setShowQuickEdit(false)
    setNote('')
  }

  return (
    <>
      <div className="card-hover p-4 animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Name & category */}
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-slate-100 text-sm truncate">{client.name}</h3>
              {client.is_new_opening && (
                <span className="badge bg-accent-500/20 text-accent-400 text-[10px] border border-accent-500/20">🆕 Nuova</span>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin size={11} /> {client.city}
              </span>
              {subLabel && <span className="text-xs text-slate-600">{subLabel}</span>}
            </div>

            {/* Status + Stars */}
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={client.status} />
              <StarRating score={client.value_score || 0} size={12} />
            </div>

            {/* Address */}
            {!compact && client.address && (
              <p className="text-xs text-slate-600 mt-1.5 truncate">{client.address}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="btn-ghost p-2 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-500/10"
                title="Chiama ora"
              >
                <Phone size={15} />
              </a>
            )}
            {onSave && (
              <button
                onClick={() => onSave(client)}
                className="btn-ghost p-2 rounded-lg text-brand-400 hover:text-brand-300 hover:bg-brand-500/10"
                title="Salva nel CRM"
              >
                <Plus size={15} />
              </button>
            )}
            <button
              onClick={() => addToRoute(client)}
              className={`btn-ghost p-2 rounded-lg ${inRoute ? 'text-accent-400' : 'text-slate-500'}`}
              title={inRoute ? 'Nel percorso' : 'Aggiungi al percorso'}
            >
              <Route size={15} />
            </button>
          </div>
        </div>

        {/* Quick update */}
        {!compact && (
          <div className="mt-3 pt-3 border-t border-slate-800/60">
            <button
              onClick={() => setShowQuickEdit(!showQuickEdit)}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={11} /> Aggiorna stato
              <ChevronDown size={11} className={`transition-transform ${showQuickEdit ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Quick Edit Drawer */}
      {showQuickEdit && (
        <div className="card border-t-0 rounded-t-none px-4 pb-4 -mt-1 animate-slide-up">
          <div className="flex gap-2">
            <StatusSelect value={newStatus} onChange={setNewStatus} className="flex-1" />
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Nota rapida..."
            rows={2}
            className="input mt-2 resize-none text-xs"
          />
          <button
            onClick={handleSaveStatus}
            disabled={updateStatus.isPending}
            className="btn-primary mt-2 w-full justify-center text-xs"
          >
            <CheckCircle2 size={13} /> Salva
          </button>
        </div>
      )}
    </>
  )
}
