import { useEffect, useRef, useState, useCallback } from 'react'
import { Route, X, Play, Navigation, MapPin, Loader2, Star, Clock, Trash2 } from 'lucide-react'
import { PageHeader, StarRating, StatusBadge, Spinner, EmptyState } from '../components/ui'
import { useAppStore } from '../store/appStore'
import { useClients } from '../hooks/useClients'
import { initMap, optimizeRoute } from '../lib/googleMaps'
import { CATEGORIES } from '../lib/constants'

export default function RoutePage() {
  const { routeClients, removeFromRoute, clearRoute } = useAppStore()
  const { data: allClients = [] } = useClients()
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [routeResult, setRouteResult] = useState(null)
  const [mapError, setMapError] = useState(false)
  const [steps, setSteps] = useState([])

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    initMap(mapRef.current)
      .then(({ map, directionsRenderer }) => {
        mapInstance.current = { map, directionsRenderer }
        setMapLoaded(true)
      })
      .catch(() => setMapError(true))
  }, [])

  // Place markers for route clients
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return
    const { map } = mapInstance.current

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    routeClients.forEach((client, i) => {
      if (!client.lat || !client.lng) return
      const marker = new google.maps.Marker({
        position: { lat: client.lat, lng: client.lng },
        map,
        title: client.name,
        label: {
          text: String(i + 1),
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#0c87e8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 16,
        },
      })
      markersRef.current.push(marker)
    })
  }, [routeClients, mapLoaded])

  async function handleOptimize() {
    const withCoords = routeClients.filter(c => c.lat && c.lng)
    if (withCoords.length < 2) return

    setOptimizing(true)
    try {
      const result = await optimizeRoute(withCoords)
      mapInstance.current.directionsRenderer.setDirections(result)

      // Extract steps
      const allSteps = result.routes[0].legs.flatMap(leg => leg.steps)
      setSteps(allSteps)

      const totalDist = result.routes[0].legs.reduce((acc, l) => acc + l.distance.value, 0)
      const totalTime = result.routes[0].legs.reduce((acc, l) => acc + l.duration.value, 0)
      setRouteResult({
        distance: (totalDist / 1000).toFixed(1),
        duration: Math.round(totalTime / 60),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setOptimizing(false)
    }
  }

  // Quick-add clients with high value score
  const topClients = allClients
    .filter(c => c.value_score >= 4 && !routeClients.find(r => r.id === c.id))
    .slice(0, 5)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar panel */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-900/50 overflow-hidden">
        <div className="p-4 border-b border-slate-800/60">
          <h1 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
            <Route size={18} className="text-brand-400" /> Giro Commerciale
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{routeClients.length} fermate nel percorso</p>
        </div>

        {/* Route clients list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {routeClients.length === 0 ? (
            <div className="py-8 text-center">
              <MapPin size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Nessun cliente nel percorso</p>
              <p className="text-xs text-slate-700 mt-1">Aggiungili dal CRM o dai suggeriti qui sotto</p>
            </div>
          ) : (
            routeClients.map((client, i) => (
              <div key={client.id} className="card p-3 flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{client.name}</p>
                  <p className="text-xs text-slate-500">{client.city}</p>
                  <StarRating score={client.value_score || 0} size={10} />
                </div>
                <button onClick={() => removeFromRoute(client.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                  <X size={13} />
                </button>
              </div>
            ))
          )}

          {/* Top value suggestions */}
          {topClients.length > 0 && (
            <div className="pt-3 mt-1">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium px-1 mb-2">
                ⭐ Clienti ad alto valore — aggiungi al percorso
              </p>
              {topClients.map(c => (
                <div key={c.id} className="flex items-center gap-2 py-1.5 px-1 hover:bg-slate-800/40 rounded-lg cursor-pointer group"
                  onClick={() => useAppStore.getState().addToRoute(c)}>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-500 flex-shrink-0" />
                  <span className="text-xs text-slate-400 flex-1 truncate group-hover:text-slate-200">{c.name}</span>
                  <StarRating score={c.value_score} size={9} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {routeResult && (
            <div className="card p-3 grid grid-cols-2 gap-2 text-center mb-2">
              <div>
                <p className="text-xs text-slate-500">Distanza</p>
                <p className="font-display font-bold text-slate-100">{routeResult.distance} km</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tempo est.</p>
                <p className="font-display font-bold text-slate-100">{routeResult.duration} min</p>
              </div>
            </div>
          )}
          <button
            onClick={handleOptimize}
            disabled={routeClients.filter(c => c.lat).length < 2 || optimizing}
            className="btn-primary w-full justify-center"
          >
            {optimizing ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
            {optimizing ? 'Calcolo...' : 'Ottimizza Percorso'}
          </button>
          <button onClick={clearRoute} className="btn-ghost w-full justify-center text-xs">
            <Trash2 size={13} /> Svuota percorso
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {mapError ? (
          <div className="flex items-center justify-center h-full flex-col gap-3">
            <MapPin size={32} className="text-slate-600" />
            <p className="text-slate-500 text-sm">Mappa non disponibile</p>
            <p className="text-xs text-slate-600">Configura VITE_GOOGLE_MAPS_API_KEY nel file .env</p>
          </div>
        ) : (
          <>
            <div ref={mapRef} className="w-full h-full" />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                <div className="text-center">
                  <Spinner size={32} />
                  <p className="text-slate-500 text-sm mt-3">Caricamento mappa...</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
