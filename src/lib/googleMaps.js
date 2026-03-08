import { Loader } from '@googlemaps/js-api-loader'

const FOGGIA_BOUNDS = {
  north: 41.95, south: 41.0, east: 16.4, west: 14.9,
}

const FOGGIA_CENTER = { lat: 41.4621, lng: 15.5444 }

let googleMaps = null
let placesService = null
let directionsService = null
let directionsRenderer = null

export async function loadGoogleMaps() {
  if (googleMaps) return googleMaps
  const loader = new Loader({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    version: 'weekly',
    libraries: ['places', 'geometry', 'routes'],
    language: 'it',
    region: 'IT',
  })
  googleMaps = await loader.load()
  return googleMaps
}

export async function initMap(mapElement, options = {}) {
  await loadGoogleMaps()
  const { Map } = await google.maps.importLibrary('maps')
  const map = new Map(mapElement, {
    center: FOGGIA_CENTER,
    zoom: 10,
    mapId: 'foggiasales_map',
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
    styles: darkMapStyles,
    ...options,
  })
  directionsService = new google.maps.DirectionsService()
  directionsRenderer = new google.maps.DirectionsRenderer({
    map,
    suppressMarkers: false,
    polylineOptions: { strokeColor: '#0c87e8', strokeWeight: 4, strokeOpacity: 0.8 },
  })
  return { map, directionsService, directionsRenderer }
}

// ─── Search nearby businesses ─────────────────────────────────────────────
export async function searchNearbyBusinesses({ keyword, city, category, map }) {
  await loadGoogleMaps()
  const geocoder = new google.maps.Geocoder()

  // Geocode city first
  const cityResult = await geocoder.geocode({ address: `${city}, Foggia, Italia` })
  const location = cityResult.results[0]?.geometry?.location

  if (!location) throw new Error(`Città non trovata: ${city}`)

  const { PlacesService } = await google.maps.importLibrary('places')
  const dummyDiv = document.createElement('div')
  const service = new PlacesService(map || dummyDiv)

  return new Promise((resolve, reject) => {
    service.nearbySearch(
      {
        location,
        radius: 10000,
        keyword: keyword || categoryToKeyword(category),
        type: categoryToType(category),
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(results.map(mapPlaceResult))
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([])
        } else {
          reject(new Error(`Places API error: ${status}`))
        }
      }
    )
  })
}

// ─── Get place details ─────────────────────────────────────────────────────
export async function getPlaceDetails(placeId, map) {
  await loadGoogleMaps()
  const { PlacesService } = await google.maps.importLibrary('places')
  const dummyDiv = document.createElement('div')
  const service = new PlacesService(map || dummyDiv)

  return new Promise((resolve, reject) => {
    service.getDetails(
      {
        placeId,
        fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'geometry', 'opening_hours', 'rating', 'business_status'],
      },
      (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          resolve(mapPlaceResult(result))
        } else {
          reject(new Error(`Details error: ${status}`))
        }
      }
    )
  })
}

// ─── Optimize route ────────────────────────────────────────────────────────
export async function optimizeRoute(clients, startLocation = FOGGIA_CENTER) {
  await loadGoogleMaps()
  if (!directionsService) {
    directionsService = new google.maps.DirectionsService()
  }
  if (clients.length < 2) return null

  const waypoints = clients.slice(1, -1).map(c => ({
    location: new google.maps.LatLng(c.lat, c.lng),
    stopover: true,
  }))

  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin: new google.maps.LatLng(clients[0].lat, clients[0].lng),
        destination: new google.maps.LatLng(clients[clients.length - 1].lat, clients[clients.length - 1].lng),
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        region: 'IT',
      },
      (result, status) => {
        if (status === 'OK') {
          resolve(result)
        } else {
          reject(new Error(`Directions error: ${status}`))
        }
      }
    )
  })
}

// ─── Geocode address ──────────────────────────────────────────────────────
export async function geocodeAddress(address) {
  await loadGoogleMaps()
  const geocoder = new google.maps.Geocoder()
  const result = await geocoder.geocode({ address: `${address}, Provincia di Foggia, Italia` })
  const loc = result.results[0]?.geometry?.location
  if (!loc) return null
  return { lat: loc.lat(), lng: loc.lng() }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function mapPlaceResult(place) {
  return {
    google_place_id: place.place_id,
    name: place.name,
    address: place.vicinity || place.formatted_address,
    phone: place.formatted_phone_number,
    website: place.website,
    lat: place.geometry?.location?.lat(),
    lng: place.geometry?.location?.lng(),
    rating: place.rating,
    business_status: place.business_status,
  }
}

function categoryToKeyword(category) {
  const map = {
    horeca: 'ristorante pizzeria bar',
    alimentari_retail: 'alimentari supermercato macelleria',
    medical_estetico: 'studio medico centro estetico',
    altre_attivita: 'tatuaggi studio tattoo',
  }
  return map[category] || category
}

function categoryToType(category) {
  const map = {
    horeca: 'restaurant',
    alimentari_retail: 'grocery_or_supermarket',
    medical_estetico: 'health',
    altre_attivita: 'establishment',
  }
  return map[category] || 'establishment'
}

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c2340' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]
