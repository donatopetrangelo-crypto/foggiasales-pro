// FoggiaSales Pro — Maps 100% GRATUITO (OpenStreetMap + Overpass + Leaflet)

const FOGGIA_CENTER = { lat: 41.4621, lng: 15.5444 }

export const CITY_COORDS = {
  'Foggia':               { lat: 41.4621, lng: 15.5444 },
  'Manfredonia':          { lat: 41.6247, lng: 15.9166 },
  'Vieste':               { lat: 41.8806, lng: 16.1761 },
  "Monte Sant'Angelo":    { lat: 41.7072, lng: 15.9636 },
  'San Giovanni Rotondo': { lat: 41.7072, lng: 15.7283 },
  'Lucera':               { lat: 41.5072, lng: 15.3361 },
  'Cerignola':            { lat: 41.2644, lng: 15.9011 },
  'San Severo':           { lat: 41.6872, lng: 15.3797 },
  'Peschici':             { lat: 41.9483, lng: 16.0147 },
  'Rodi Garganico':       { lat: 41.9283, lng: 15.8897 },
  'Mattinata':            { lat: 41.7083, lng: 16.0536 },
  'Zapponeta':            { lat: 41.4494, lng: 15.9644 },
  'Margherita di Savoia': { lat: 41.3722, lng: 16.1483 },
  'San Marco in Lamis':   { lat: 41.7136, lng: 15.6344 },
  'Apricena':             { lat: 41.7872, lng: 15.4436 },
  'Torremaggiore':        { lat: 41.6897, lng: 15.2936 },
  'Orta Nova':            { lat: 41.3261, lng: 15.7094 },
  'Lesina':               { lat: 41.8636, lng: 15.3497 },
  'Cagnano Varano':       { lat: 41.8272, lng: 15.7747 },
  'Vico del Gargano':     { lat: 41.8972, lng: 15.9547 },
  'Ischitella':           { lat: 41.9047, lng: 15.8997 },
  'Bovino':               { lat: 41.2497, lng: 15.3397 },
  'Stornara':             { lat: 41.2872, lng: 15.7747 },
  'Carapelle':            { lat: 41.3597, lng: 15.6947 },
}

const OVERPASS_TAGS = {
  horeca:             ['amenity=restaurant','amenity=bar','amenity=cafe','amenity=fast_food','shop=bakery','shop=pastry'],
  alimentari_retail:  ['shop=supermarket','shop=grocery','shop=convenience','shop=butcher','shop=seafood','shop=greengrocer'],
  medical_estetico:   ['amenity=dentist','amenity=doctors','amenity=clinic','shop=beauty','amenity=pharmacy'],
  altre_attivita:     ['shop=tattoo','shop=hairdresser','shop=barber','amenity=gym'],
}

export async function searchNearbyBusinesses({ city, category }) {
  const coords = CITY_COORDS[city] || FOGGIA_CENTER
  const radius = 8000
  const tags = OVERPASS_TAGS[category] || OVERPASS_TAGS.horeca

  const tagFilters = tags.map(tag => {
    const [key, value] = tag.split('=')
    return `node["${key}"="${value}"](around:${radius},${coords.lat},${coords.lng});\nway["${key}"="${value}"](around:${radius},${coords.lat},${coords.lng});`
  }).join('\n')

  const query = `[out:json][timeout:25];\n(\n${tagFilters}\n);\nout center meta;`

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST', body: query,
  })
  if (!response.ok) throw new Error('Errore nella ricerca. Riprova tra qualche secondo.')
  const data = await response.json()

  return data.elements
    .filter(el => el.tags && el.tags.name)
    .map(el => ({
      google_place_id: `osm_${el.type}_${el.id}`,
      name: el.tags.name,
      address: [el.tags['addr:street'], el.tags['addr:housenumber']].filter(Boolean).join(' ') || null,
      phone: el.tags.phone || el.tags['contact:phone'] || null,
      website: el.tags.website || null,
      lat: el.lat || (el.center && el.center.lat),
      lng: el.lon || (el.center && el.center.lon),
      city,
    }))
    .filter(p => p.lat && p.lng)
    .slice(0, 40)
}

export async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', Foggia, Italia')}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'it' } })
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

export async function initMap(mapElement) {
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link')
    link.id = 'leaflet-css'
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }
  if (!window.L) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  const L = window.L
  const map = L.map(mapElement).setView([FOGGIA_CENTER.lat, FOGGIA_CENTER.lng], 10)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19,
  }).addTo(map)
  return { map, L }
}

export function addMarkers(map, L, clients, onMarkerClick) {
  const markers = []
  clients.forEach((client, i) => {
    if (!client.lat || !client.lng) return
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#0c87e8;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);">${i + 1}</div>`,
      iconSize: [28, 28], iconAnchor: [14, 14],
    })
    const marker = L.marker([client.lat, client.lng], { icon }).addTo(map)
      .bindPopup(`<b>${client.name}</b><br>${client.city || ''}`)
    if (onMarkerClick) marker.on('click', () => onMarkerClick(client))
    markers.push(marker)
  })
  return markers
}

export function drawRoute(map, L, clients) {
  const latlngs = clients.filter(c => c.lat && c.lng).map(c => [c.lat, c.lng])
  if (latlngs.length < 2) return null
  const polyline = L.polyline(latlngs, { color: '#0c87e8', weight: 3, opacity: 0.8, dashArray: '8,8' }).addTo(map)
  map.fitBounds(polyline.getBounds(), { padding: [40, 40] })
  return polyline
}

export function optimizeRoute(clients) {
  if (clients.length < 2) return { orderedClients: clients, totalKm: 0 }
  const remaining = [...clients]
  const route = [remaining.shift()]
  while (remaining.length > 0) {
    const last = route[route.length - 1]
    let nearestIdx = 0, nearestDist = Infinity
    remaining.forEach((c, i) => {
      const d = Math.sqrt(Math.pow(c.lat - last.lat, 2) + Math.pow(c.lng - last.lng, 2))
      if (d < nearestDist) { nearestDist = d; nearestIdx = i }
    })
    route.push(remaining.splice(nearestIdx, 1)[0])
  }
  let totalKm = 0
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i], b = route[i+1]
    totalKm += Math.sqrt(Math.pow((b.lat-a.lat)*111,2) + Math.pow((b.lng-a.lng)*78,2))
  }
  return { orderedClients: route, totalKm: totalKm.toFixed(1) }
}

export async function loadGoogleMaps() { return null }
export async function getPlaceDetails() { return null }
export { FOGGIA_CENTER }

// ─── OpenRouteService — percorso stradale reale ───────────────────────────
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFlNDhiYzMzOGM1NjQ2NTI4OTQzM2Y2MzM3ODJjZDZiIiwiaCI6Im11cm11cjY0In0='

export async function drawRealRoute(map, L, clients) {
  const validClients = clients.filter(c => c.lat && c.lng)
  if (validClients.length < 2) return null

  const coordinates = validClients.map(c => [c.lng, c.lat])

  try {
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordinates }),
    })

    if (!response.ok) throw new Error('ORS API error')
    const data = await response.json()

    const coords = data.features[0].geometry.coordinates.map(c => [c[1], c[0]])
    const summary = data.features[0].properties.summary

    const polyline = L.polyline(coords, {
      color: '#0c87e8',
      weight: 4,
      opacity: 0.9,
    }).addTo(map)

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] })

    return {
      polyline,
      distanceKm: (summary.distance / 1000).toFixed(1),
      durationMin: Math.round(summary.duration / 60),
    }
  } catch(e) {
    console.error('ORS error, fallback to straight line:', e)
    const polyline = drawRoute(map, L, validClients)
    return { polyline, distanceKm: null, durationMin: null }
  }
}
