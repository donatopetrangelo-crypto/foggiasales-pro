# 🚀 Guida Installazione e Avvio — FoggiaSales Pro

## Prerequisiti

- Node.js 18+
- Account Supabase (gratuito su supabase.com)
- Google Cloud Account (per Maps + Places API)
- (Opzionale) Account Anthropic per suggerimenti AI

---

## 1. Installazione Dipendenze

```bash
cd foggia-sales-app
npm install
```

---

## 2. Configurazione Supabase

### 2a. Crea nuovo progetto su supabase.com

1. Vai su https://supabase.com → New Project
2. Nome: `foggiasales-pro`, regione: `eu-central-1 (Frankfurt)`
3. Salva la password database

### 2b. Esegui le migrazioni SQL

1. Vai su **SQL Editor** nel tuo progetto Supabase
2. Copia e incolla il contenuto di `supabase/migrations/001_initial_schema.sql`
3. Clicca **Run**

### 2c. Ottieni le chiavi API

1. Vai su **Settings → API**
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

---

## 3. Configurazione Google Maps API

### 3a. Abilita le API necessarie

Su https://console.cloud.google.com:
1. Crea nuovo progetto o seleziona esistente
2. Vai su **APIs & Services → Library**
3. Abilita queste API:
   - ✅ **Maps JavaScript API**
   - ✅ **Places API**
   - ✅ **Directions API**
   - ✅ **Geocoding API**

### 3b. Crea API Key

1. Vai su **APIs & Services → Credentials**
2. **Create Credentials → API Key**
3. (Consigliato) Aggiungi restrizioni: HTTP referrers → `localhost:5173/*` e il tuo dominio

### 3c. Costo stimato

- Maps JS API: gratuita fino a 28.000 load/mese
- Places API: $17 ogni 1.000 ricerche (dopo la free tier da $200)
- Directions API: $5 ogni 1.000 richieste

---

## 4. File .env

```bash
cp .env.example .env
```

Modifica `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXX
```

---

## 5. Avvio in Sviluppo

```bash
npm run dev
```

Apri http://localhost:5173

> **Nota**: In sviluppo senza Supabase configurato, l'app bypassa il login automaticamente e usa dati mock.

---

## 6. Build per Produzione

```bash
npm run build
npm run preview  # per testare la build locale
```

### Deploy su Vercel (consigliato)

```bash
npm install -g vercel
vercel --prod
```

Configura le env vars anche su Vercel dashboard.

---

## 7. Configurazione Autenticazione Supabase

### Crea primo utente admin

Nel SQL Editor di Supabase:
```sql
-- Oppure usa Supabase Dashboard → Authentication → Users → Add user
INSERT INTO profiles (id, full_name, role)
VALUES ('uuid-del-tuo-user', 'Nome Agente', 'admin');
```

Oppure registrati direttamente nell'app dalla schermata di login.

---

## 8. Aggiunta Avvisi Nuove Aperture (Manuale)

Finché non si integra uno scraper automatico, puoi inserire manualmente:

```sql
INSERT INTO new_opening_alerts 
  (business_name, category, city, estimated_opening, source, priority_score, confidence_score, notes)
VALUES 
  ('Nuova Pizzeria Gargano', 'horeca', 'Vieste', '2025-09-01', 'social_media', 4, 80, 
   'Annuncio su Instagram locale - apertura prevista settembre');
```

### Automazione futura consigliata

Per automatizzare la raccolta di nuove aperture:
- **Supabase Edge Function** che scrapa Google Maps Places API con query `"nuovo" OR "opening soon"` nella provincia FG
- **n8n** o **Make.com** per monitorare keyword Facebook/Instagram locali

---

## 9. Struttura Componenti

```
DashboardPage     → Statistiche + attività recenti
SearchPage        → Ricerca via Google Places API
CRMPage           → Lista clienti con filtri + storico
RoutePage         → Mappa + ottimizzazione percorso
AlertsPage        → Segnalazioni nuove aperture
```

---

## 10. Personalizzazione

### Aggiungere nuove città

In `src/lib/constants.js` → array `FOGGIA_CITIES`

### Aggiungere nuove categorie/sottocategorie

In `src/lib/constants.js` → oggetto `CATEGORIES`

### Modificare algoritmo punteggio

In `src/lib/scoring.js` → `CATEGORY_BASE_SCORE`, `SUBCATEGORY_MULTIPLIER`, `CITY_POPULARITY`

---

## Support

Per problemi di configurazione o personalizzazione, apri una issue nel repository.
