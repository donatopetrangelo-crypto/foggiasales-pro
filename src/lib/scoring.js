/**
 * FoggiaSales Pro — Customer Value Scoring
 * Assigns 0-5 stars based on multiple factors
 */

const CATEGORY_BASE_SCORE = {
  horeca: 4,
  alimentari_retail: 3,
  medical_estetico: 2,
  altre_attivita: 2,
}

const SUBCATEGORY_MULTIPLIER = {
  // Horeca — high packaging consumption
  pizzeria: 1.3,
  ristorante: 1.2,
  bar: 0.9,
  pasticceria: 1.1,
  panificio: 1.0,
  street_food: 1.2,
  sushi_takeaway: 1.4,
  rosticceria: 1.2,
  // Retail
  alimentari: 1.0,
  minimarket: 1.1,
  supermercato: 1.3,
  macelleria: 1.0,
  pescheria: 1.0,
  fruttivendolo: 0.8,
  detersivista: 0.9,
  caseificio: 0.8,
  // Medical / Estetico
  studio_dentistico: 0.7,
  ambulatorio: 0.7,
  rsa: 0.9,
  clinica_privata: 1.0,
  centro_estetico: 0.7,
  laboratorio_medico: 0.8,
  // Altre
  centro_tattoo: 0.6,
}

const STATUS_BONUS = {
  da_contattare: 0,
  contattato: 0,
  richiamare: -0.2,
  cliente_acquisito: 0,
  non_interessato: -1,
}

const CITY_POPULARITY = {
  Foggia: 1.2,
  Manfredonia: 1.1,
  'San Giovanni Rotondo': 1.1,
  Vieste: 1.15,
  Lucera: 1.0,
  Cerignola: 1.0,
  'Monte Sant\'Angelo': 0.95,
  Mattinata: 0.9,
  Peschici: 0.9,
  'Rodi Garganico': 0.9,
  Zapponeta: 0.75,
  'San Marco in Lamis': 0.8,
}

/**
 * Calculate value score (0–5) for a client
 * @param {Object} client
 * @returns {number} 1–5 stars
 */
export function calculateValueScore(client) {
  const base = CATEGORY_BASE_SCORE[client.category] || 2.5
  const subMult = SUBCATEGORY_MULTIPLIER[client.subcategory] || 1.0
  const statusBonus = STATUS_BONUS[client.status] || 0
  const cityMult = CITY_POPULARITY[client.city] || 1.0
  const newOpeningBonus = client.is_new_opening ? 0.5 : 0

  const raw = base * subMult * cityMult + statusBonus + newOpeningBonus
  const clamped = Math.max(1, Math.min(5, Math.round(raw)))
  return clamped
}

/**
 * Get scoring explanation
 */
export function getScoreRationale(client) {
  const score = calculateValueScore(client)
  const labels = ['', 'Basso potenziale', 'Discreto potenziale', 'Buon potenziale', 'Alto potenziale', 'Ottimo potenziale']
  const reasons = []

  if (client.category === 'horeca') reasons.push('Settore HoReCa — alto consumo packaging')
  if (client.subcategory === 'sushi_takeaway') reasons.push('Take away = packaging intensivo')
  if (client.is_new_opening) reasons.push('🆕 Nuova apertura — contatto prioritario')
  if ((CITY_POPULARITY[client.city] || 1) > 1) reasons.push(`${client.city} — zona ad alta affluenza`)

  return { score, label: labels[score] || 'N/D', reasons }
}

/**
 * Sort clients by value score (descending)
 */
export function sortByValue(clients) {
  return [...clients].sort((a, b) => (b.value_score || 0) - (a.value_score || 0))
}

/**
 * Priority score for route optimization
 * Combines value_score + distance penalty
 */
export function routePriority(client, distanceKm) {
  const value = client.value_score || 3
  const distancePenalty = Math.min(distanceKm / 50, 1) // normalize 0-1
  return value * 2 - distancePenalty
}
