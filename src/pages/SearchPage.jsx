import { useState } from 'react'
import { Search, MapPin, Loader2, Sparkles, AlertCircle, Plus, Route, Phone, CheckCircle2 } from 'lucide-react'
import { PageHeader, Spinner, EmptyState, StarRating } from '../components/ui'
import { FOGGIA_CITIES, CATEGORIES } from '../lib/constants'
import { searchNearbyBusinesses } from '../lib/googleMaps'
import { useCreateClient } from '../hooks/useClients'
import { useAppStore } from '../store/appStore'
import { calculateValueScore } from '../lib/scoring'

export default function SearchPage() {
  const [city, setCity] = useState('Foggia')
  const [category, setCategory] = useState('horeca')
  const [subcategory, setSubcategory] = useState('')
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [savedIds, setSavedIds] = useState({}) // osm_id -> client object
  const { addToRoute, routeClients } = useAppStore()
  const createClient = useCreateClient()

  const catConfig = CATEGORIES[category]
  const allCities = ['Tutta la Provincia', ...FOGGIA_CITIES]

  async function handleSearch() {
    setLoading(true)
    setError(null)
    setResults([])
    setSavedIds({})
    try {
      const searchCity = city === 'Tutta la Provincia' ? 'Foggia' : city
      const places = await searchNearbyBusinesses({ city: searchCity, category, keyword })
      const enriched = places.map(p => ({
        ...p,
        category,
        subcategory: subcategory || null,
        city: searchCity,
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

  async function handleSaveCRM(place) {
    if (savedIds[place.google_place_id]) return
    try {
      const { google_place_id, ...rest } = place
      const saved = await createClient.mutateAsync({ ...rest, google_place_id, source: 'openstreetmap' })
      setSavedIds(prev => ({ ...prev, [place.google_place_id]: saved }))
    } catch (e) {
      console.error(e)
    }
  }

  async function handleAddRoute(place) {
    // Se già salvato nel CRM usa quell'oggetto (ha id), altrimenti salvalo prima
    let client = savedIds[place.google_place_id]
    if (!client) {
      try {
        const { google_place_id, ...rest } = place
        client = await createClient.mutateAsync({ ...rest, google_place_id, source: 'openstreetmap' })
        setSavedIds(prev => ({ ...prev, [place.google_place_id]: client }))
      } catch (e) {
        console.error(e)
        return
      }
    }
    addToRoute(client)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Cerca Nuovi Clienti"
        subtitle="Trova attività nella provincia di Foggia — 100% gratuito con OpenStreetMap"
      />

      {/* Search Filters */}
      <div className="card p-5 mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1.5">Categoria</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory('') }} className="select">
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1.5">Sottocategoria</label>
            <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="select">
              <option value="">Tutte</option>
              {catConfig?.subcategories.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1.5">Zona</label>
            <select value={city} onChange={e => setCity(e.target.value)} className="select">
              {allCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium uppercase tracking-wide block mb-1.5">Parola Chiave</label>
            <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="es. pizzeria, sushi..." className="input" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
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
          <p>{error}</p>
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
            {results.map((place) => {
              const isSaved = !!savedIds[place.google_place_id]
              const inRoute = routeClients.some(c => c.google_place_id === place.google_place_id || (savedIds[place.google_place_id] && c.id === savedIds[place.google_place_id]?.id))
              return (
                <div key={place.google_place_id} className="card-hover p-4 animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-slate-100 text-sm">{place.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <MapPin size={11} /> {place.city}
                        {place.address && <span className="truncate">— {place.address}</span>}
                      </div>
                      <div className="mt-2">
                        <StarRating score={place.value_score || 0} size={12} />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {place.phone && (
                        <a href={`tel:${place.phone}`} className="btn-ghost p-2 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-500/10" title="Chiama">
                          <Phone size={15} />
                        </a>
                      )}
                      <button
                        onClick={() => handleSaveCRM(place)}
                        disabled={isSaved || createClient.isPending}
                        className={`p-2 rounded-lg transition-all ${isSaved ? 'text-green-400 bg-green-500/10' : 'btn-ghost text-brand-400 hover:text-brand-300 hover:bg-brand-500/10'}`}
                        title={isSaved ? 'Salvato nel CRM' : 'Salva nel CRM'}
                      >
                        {isSaved ? <CheckCircle2 size={15} /> : <Plus size={15} />}
                      </button>
                      <button
                        onClick={() => handleAddRoute(place)}
                        disabled={inRoute}
                        className={`p-2 rounded-lg transition-all ${inRoute ? 'text-accent-400 bg-accent-500/10' : 'btn-ghost text-slate-400 hover:text-accent-400 hover:bg-accent-500/10'}`}
                        title={inRoute ? 'Nel percorso' : 'Aggiungi al giro'}
                      >
                        <Route size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <EmptyState
          icon={Search}
          title="Inizia una ricerca"
          subtitle="Seleziona categoria e zona, poi clicca Cerca Attività."
        />
      )}
    </div>
  )
}
