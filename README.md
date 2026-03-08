# 📦 FoggiaSales Pro — Wholesale Packaging & Supplies CRM

Web app per grossisti di packaging e forniture nella provincia di Foggia.

## 🏗️ Architettura del Progetto

```
foggia-sales-app/
├── src/
│   ├── components/
│   │   ├── layout/          # AppShell, Sidebar, Header
│   │   ├── search/          # ClientSearch, CategoryFilter, ZoneSelector
│   │   ├── crm/             # ClientCard, CRMTable, StatusBadge, Notes
│   │   ├── map/             # MapView, RouteOptimizer, CustomerPin
│   │   └── ui/              # Button, Badge, Modal, Toast
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── SearchPage.jsx
│   │   ├── CRMPage.jsx
│   │   ├── RoutePage.jsx
│   │   └── AlertsPage.jsx
│   ├── hooks/
│   │   ├── useClients.js
│   │   ├── useCRM.js
│   │   ├── useRoute.js
│   │   └── useAlerts.js
│   ├── lib/
│   │   ├── supabase.js      # Supabase client
│   │   ├── googlePlaces.js  # Google Places API wrapper
│   │   ├── claudeAI.js      # Claude AI for suggestions
│   │   └── scoring.js       # Customer value scoring
│   ├── store/
│   │   └── appStore.js      # Zustand global state
│   └── types/
│       └── index.js         # JSDoc type definitions
├── supabase/
│   ├── migrations/          # SQL migrations
│   └── functions/           # Edge functions
├── public/
└── docs/
    └── SETUP.md
```

## 🛠️ Stack Tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime) |
| Mappe | Google Maps API + Places API |
| AI Search | Claude API (suggerimenti categorie) |
| Routing | React Router v6 |

## 🗄️ Schema Database

### Tabella: `clients`
```sql
id, name, category, subcategory, address, city, province,
lat, lng, phone, email, website, google_place_id,
status, value_score, notes, created_at, updated_at
```

### Tabella: `crm_entries`
```sql
id, client_id, status, notes, visit_date, next_action, agent_id, created_at
```

### Tabella: `alerts`
```sql
id, business_name, category, address, city, estimated_opening,
source, priority_score, added_to_crm, created_at
```

### Tabella: `routes`
```sql
id, name, client_ids[], optimized_order[], total_distance, created_at
```
