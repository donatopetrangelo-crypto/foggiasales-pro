import { useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Phone, MapPin, Globe, Clock, Plus, Star } from 'lucide-react'
import { Modal, StatusBadge, StatusSelect, StarRating, Spinner, CategoryBadge } from '../ui'
import { useCRMEntries, useAddCRMEntry, useUpdateClient } from '../../hooks/useClients'
import { VISIT_TYPES } from '../../lib/constants'

export function ClientDetailModal({ client, open, onClose }) {
  const [status, setStatus] = useState(client?.status || 'da_contattare')
  const [note, setNote] = useState('')
  const [visitType, setVisitType] = useState('visita')
  const [nextAction, setNextAction] = useState('')

  const { data: entries = [], isLoading } = useCRMEntries(client?.id)
  const addEntry = useAddCRMEntry()
  const updateClient = useUpdateClient()

  if (!client) return null

  async function handleSubmit() {
    if (!note && status === client.status) return
    await addEntry.mutateAsync({
      client_id: client.id,
      status,
      notes: note,
      visit_type: visitType,
      next_action_note: nextAction,
    })
    setNote('')
    setNextAction('')
  }

  return (
    <Modal open={open} onClose={onClose} title={client.name} size="lg">
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Info */}
        <div className="space-y-4">
          <div>
            <CategoryBadge category={client.category} />
            <div className="mt-3 space-y-2 text-sm">
              {client.address && (
                <p className="text-slate-400 flex gap-2">
                  <MapPin size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                  {client.address}, {client.city}
                </p>
              )}
              {client.phone && (
                <a href={`tel:${client.phone}`} className="text-brand-400 hover:text-brand-300 flex gap-2 items-center">
                  <Phone size={14} /> {client.phone}
                </a>
              )}
              {client.website && (
                <a href={client.website} target="_blank" rel="noreferrer" className="text-brand-400 hover:text-brand-300 flex gap-2 items-center truncate">
                  <Globe size={14} /> Sito web
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide font-medium">Valore Cliente</p>
            <StarRating
              score={client.value_score || 0}
              size={18}
              onChange={score => updateClient.mutate({ id: client.id, updates: { value_score: score } })}
            />
          </div>

          {/* Quick status update */}
          <div className="card p-4 space-y-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Nuovo Contatto</p>
            <select value={visitType} onChange={e => setVisitType(e.target.value)} className="select text-xs">
              {VISIT_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
            <StatusSelect value={status} onChange={setStatus} />
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note contatto..."
              rows={3}
              className="input resize-none text-xs"
            />
            <input
              value={nextAction}
              onChange={e => setNextAction(e.target.value)}
              placeholder="Prossima azione..."
              className="input text-xs"
            />
            <button
              onClick={handleSubmit}
              disabled={addEntry.isPending}
              className="btn-primary w-full justify-center"
            >
              {addEntry.isPending ? <Spinner size={16} /> : <Plus size={14} />}
              Salva Contatto
            </button>
          </div>
        </div>

        {/* Right: History */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-3">Storico Visite</p>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : entries.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-8">Nessun contatto registrato</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {entries.map(entry => (
                <div key={entry.id} className="card p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={entry.status} />
                    <span className="text-slate-600">
                      {format(new Date(entry.visit_date), 'd MMM yyyy', { locale: it })}
                    </span>
                  </div>
                  {entry.visit_type && (
                    <p className="text-slate-500">
                      {VISIT_TYPES.find(v => v.value === entry.visit_type)?.label || entry.visit_type}
                    </p>
                  )}
                  {entry.notes && <p className="text-slate-300">{entry.notes}</p>}
                  {entry.next_action_note && (
                    <p className="text-brand-400 flex gap-1 items-start">
                      <Clock size={11} className="mt-0.5" /> {entry.next_action_note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
