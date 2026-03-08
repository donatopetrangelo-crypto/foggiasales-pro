import { useState, useRef } from 'react'
import { Search, MapPin, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { PageHeader, Spinner, EmptyState } from '../components/ui'
import { ClientCard } from '../components/crm/ClientCard'
import { FOGGIA_CITIES, CATEGORIES } from '../lib/constants'
import { searchNearbyBusinesses } from '../lib/googleMaps'
import { useCreateClient } from '../hooks/useClients'
import { calculateValueScore } from '../lib/scoring'

export default function SearchPage() {
  const [city, setCity] = useState('Foggia')
  const [category, setCategory] = useState('horeca')
  const [subcategory, setSubcategory] = useState('')
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(new Set())
  const mapRef = useRef(null)
  const createClient = useCreateClient()

  const catConfig = CATEGORIES[category]
  const allCities = ['Tutta la Provincia', ...FOGGIA_CITIES]

  async function handleSearch() {
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const searchCity = city === 'Tutta la Provincia' ? 'Foggia' : city
      const places = await searchNearbyBusinesses({
        keyword: keyword || undefined,
        city: searchCity,
        category,
      })
      const enriched = places.map(p => ({
        ...p,
        category,
        subcategory: subcategory || null,
        city: city === 'Tutta la Provincia' ? searchCity : city,
        province: 'FG',
        status: 'da_contattare',
        value_score: calculateValueScore({ category, subcategory, city: searchCity }),
      }))
      setResults(enriched)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(place) {
    const { google_place_id, ...rest } = place
    await createClient.mutateAsync({ ...rest, google_place_id, source: 'google_places' })
    setSaved(prev => new Set([...prev, place.google_place_id]))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Cerca Nuovi Clienti"
        subtitle="Trova attività nella provincia di Foggia tramite Google Maps"
      />

      {/* Search Filters */}
      <div className="card p-5 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Category */}
          <div>
            <label className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1.5">
              Categoria
            </label>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setSubcategory('') }}
              className="select"
            >
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1.5">
              Sottocategoria
            </label>
            <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="select">
              <option value="">Tutte</option>
              {catConfig?.subcategories.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1.5">
              Zona
            </label>
            <select value={city} onChange={e => setCity(e.target.value)} className="select">
              {allCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Keyword */}
          <div>
            <label className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1.5">
              Parola Chiave (opzionale)
            </label>
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="es. sushi, pizzeria..."
              className="input"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading} className="btn-primary">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          {loading ? 'Ricerca in corso...' : 'Cerca Attività'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-500/20 bg-red-500/5 p-4 mb-4 flex gap-3 text-red-400 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Errore nella ricerca</p>
            <p className="text-red-500 mt-0.5">{error}</p>
            <p className="text-xs mt-1 text-red-600">Assicurati che la Google Maps API key sia configurata nel file .env</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-brand-400" />
            <p className="text-sm text-slate-400">
              <span className="text-slate-100 font-semibold">{results.length}</span> attività trovate in{' '}
              <span className="text-brand-400">{city}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {results.map((place, i) => (
              <div key={place.google_place_id || i} className="relative">
                {saved.has(place.google_place_id) && (
                  <div className="absolute inset-0 rounded-2xl bg-green-500/5 border border-green-500/20 z-10 flex items-center justify-center">
                    <span className="badge bg-green-500/20 text-green-300">✓ Salvato nel CRM</span>
                  </div>
                )}
                <ClientCard
                  client={place}
                  onSave={saved.has(place.google_place_id) ? null : handleSave}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <EmptyState
          icon={Search}
          title="Inizia una ricerca"
          subtitle="Seleziona categoria e zona, poi clicca Cerca Attività per trovare nuovi clienti potenziali."
        />
      )}
    </div>
  )
}
