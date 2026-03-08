import { useState } from 'react'
import { Users, Filter, SortAsc, Star, Plus, Search } from 'lucide-react'
import { PageHeader, StatusBadge, StatusSelect, StarRating, Spinner, EmptyState, Modal } from '../components/ui'
import { ClientCard } from '../components/crm/ClientCard'
import { ClientDetailModal } from '../components/crm/ClientDetailModal'
import { useClients, useCreateClient } from '../hooks/useClients'
import { FOGGIA_CITIES, CATEGORIES, STATUS_CONFIG } from '../lib/constants'
import { sortByValue } from '../lib/scoring'

const SORT_OPTIONS = [
  { value: 'value_score', label: '⭐ Valore' },
  { value: 'created_at', label: '🕐 Più recenti' },
  { value: 'city', label: '📍 Città' },
  { value: 'status', label: '🏷️ Stato' },
]

export default function CRMPage() {
  const [filters, setFilters] = useState({ city: 'all', category: 'all', status: 'all' })
  const [sortBy, setSortBy] = useState('value_score')
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const { data: clients = [], isLoading } = useClients({
    city: filters.city !== 'all' ? filters.city : undefined,
    category: filters.category !== 'all' ? filters.category : undefined,
    status: filters.status !== 'all' ? filters.status : undefined,
  })

  const createClient = useCreateClient()

  const filtered = clients
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'value_score') return (b.value_score || 0) - (a.value_score || 0)
      if (sortBy === 'city') return (a.city || '').localeCompare(b.city || '')
      return new Date(b.created_at) - new Date(a.created_at)
    })

  function setFilter(key, value) {
    setFilters(f => ({ ...f, [key]: value }))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="CRM Clienti"
        subtitle={`${clients.length} clienti nel database`}
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus size={15} /> Aggiungi Cliente
          </button>
        }
      />

      {/* Filters Bar */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca per nome..."
              className="input pl-8"
            />
          </div>
          <select value={filters.city} onChange={e => setFilter('city', e.target.value)} className="select">
            <option value="all">Tutte le città</option>
            {FOGGIA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="select">
            <option value="all">Tutte le cat.</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="select">
            <option value="all">Tutti gli stati</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
          <SortAsc size={14} className="text-slate-500" />
          <span className="text-xs text-slate-500">Ordina per:</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                sortBy === opt.value
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-600">{filtered.length} risultati</span>
        </div>
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun cliente trovato"
          subtitle="Prova a modificare i filtri o aggiungi nuovi clienti dalla ricerca."
          action={
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={14} /> Aggiungi Cliente
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(client => (
            <div key={client.id} onClick={() => setSelectedClient(client)} className="cursor-pointer">
              <ClientCard client={client} />
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <ClientDetailModal
        client={selectedClient}
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
      />

      {/* Add Client Modal */}
      <AddClientModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreate={async data => {
          await createClient.mutateAsync(data)
          setShowAdd(false)
        }}
      />
    </div>
  )
}

function AddClientModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '', category: 'horeca', subcategory: '',
    city: 'Foggia', address: '', phone: '', email: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal open={open} onClose={onClose} title="Aggiungi Cliente Manuale">
      <div className="space-y-3">
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome attività *" className="input" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.category} onChange={e => set('category', e.target.value)} className="select">
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={form.city} onChange={e => set('city', e.target.value)} className="select">
            {FOGGIA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Indirizzo" className="input" />
        <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Telefono" className="input" />
        <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email" className="input" />
        <button
          onClick={() => form.name && onCreate(form)}
          disabled={!form.name}
          className="btn-primary w-full justify-center"
        >
          <Plus size={14} /> Aggiungi
        </button>
      </div>
    </Modal>
  )
}
