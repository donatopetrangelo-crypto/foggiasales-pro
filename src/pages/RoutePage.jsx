

   

   
import { useEffect, useRef, useState, useCallback } from 'react'
import { Route, X, Navigation, MapPin, Loader2, Trash2, Star } from 'lucide-react'
import { StarRating, Spinner } from '../components/ui'
import { useAppStore } from '../store/appStore'
import { useClients } from '../hooks/useClients'
import { initMap, addMarkers, drawRoute, optimizeRoute } from '../lib/googleMaps'

export default function RoutePage() {
  const { routeClients, removeFromRoute, clearRoute, addToRoute } = useAppStore()
  const { data: allClients = [] } = useClients()
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const polylineRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [routeResult, setRouteResult] = useState(null)

  // Init map once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    let cancelled = false
    initMap(mapRef.current)
      .then(({ map, L }) => {
        if (cancelled) return
        mapInstance.current = { map, L }
        setMapReady(true)
      })
      .catch(e => {
        console.error('Map init error:', e)
        setMapError(true)
      })
    return () => { cancelled = true }
  }, [])

  // Update markers when route changes
  useEffect(() => {
    if (!mapReady || !mapInstance.current) return
    const { map, L } = mapInstance.current
    // Remove old markers safely
    markersRef.current.forEach(m => { try { m.remove() } catch(e) {} })
    markersRef.current = []
    if (routeClients.length > 0) {
      try {
        markersRef.current = addMarkers(map, L, routeClients)
        // Fit map to markers
        const validClients = routeClients.filter(c => c.lat && c.lng)
        if (validClients.length > 0) {
          const bounds = L.latLngBounds(validClients.map(c => [c.lat, c.lng]))
          map.fitBounds(bounds, { padding: [40, 40] })
        }
      } catch(e) {
        console.error('Marker error:', e)
      }
    }
  }, [routeClients, mapReady])

  function handleOptimize() {
    const withCoords = routeClients.filter(c => c.lat && c.lng)
    if (withCoords.length < 2) return
    setOptimizing(true)
    try {
      const { map, L } = mapInstance.current
      if (polylineRef.current) { try { polylineRef.current.remove() } catch(e) {} }
      const { orderedClients, totalKm } = optimizeRoute(withCoords)
      polylineRef.current = drawRoute(map, L, orderedClients)
      setRouteResult({ distance: totalKm, duration: Math.round(totalKm * 2) })
    } catch(e) {
      console.error('Optimize error:', e)
    } finally {
      setOptimizing(false)
    }
  }

  function handleAddToRoute(client) {
    try {
      addToRoute(client)
    } catch(e) {
      console.error('Add to route error:', e)
    }
  }

  const topClients = allClients
    .filter(c => (c.value_score || 0) >= 3 && !routeClients.find(r => r.id === c.id))
    .sort((a, b) => (b.value_score || 0) - (a.value_score || 0))
    .slice(0, 8)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-900/50 overflow-hidden">
        <div className="p-4 border-b border-slate-800/60">
          <h1 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
            <Route size={18} className="text-brand-400" /> Giro Commerciale
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{routeClients.length} fermate nel percorso</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Route clients */}
          {routeClients.length === 0 ? (
            <div className="py-6 text-center">
              <MapPin size={24} className="text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Nessun cliente nel percorso</p>
              <p className="text-xs text-slate-700 mt-1">Aggiungili dai suggeriti qui sotto</p>
            </div>
          ) : (
            routeClients.map((client, i) => (
              <div key={client.id || i} className="card p-3 flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-400 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{client.name}</p>
                  <p className="text-xs text-slate-500">{client.city}</p>
                  <StarRating score={client.value_score || 0} size={10} />
                </div>
                <button
                  onClick={() => removeFromRoute(client.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))
          )}

          {/* Suggestions */}
          {topClients.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium px-1 mb-2">
                ⭐ Clienti suggeriti — clicca per aggiungere
              </p>
              {topClients.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleAddToRoute(c)}
                  className="w-full flex items-center gap-2 py-2 px-2 hover:bg-slate-800/60 rounded-lg transition-colors text-left"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-500 flex-shrink-0" />
                  <span className="text-xs text-slate-400 flex-1 truncate hover:text-slate-200">{c.name}</span>
                  <span className="text-xs text-slate-600">{c.city}</span>
                  <StarRating score={c.value_score || 0} size={9} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {routeResult && (
            <div className="card p-3 grid grid-cols-2 gap-2 text-center">
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
            disabled={routeClients.length < 2 || optimizing}
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
      <div className="flex-1 relative overflow-hidden">
        {mapError ? (
          <div className="flex items-center justify-center h-full flex-col gap-3 bg-slate-900">
            <MapPin size={32} className="text-slate-600" />
            <p className="text-slate-500 text-sm">Errore caricamento mappa</p>
            <p className="text-xs text-slate-600">Ricarica la pagina</p>
          </div>
        ) : (
          <>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            {!mapReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90">
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
