import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set, get) => ({
      // ── Auth ──────────────────────────────────────────────
      user: null,
      setUser: (user) => set({ user }),

      // ── Route Builder ─────────────────────────────────────
      routeClients: [],
      addToRoute: (client) => {
        const exists = get().routeClients.find(c => c.id === client.id)
        if (!exists) set(s => ({ routeClients: [...s.routeClients, client] }))
      },
      removeFromRoute: (clientId) => set(s => ({
        routeClients: s.routeClients.filter(c => c.id !== clientId)
      })),
      clearRoute: () => set({ routeClients: [] }),

      // ── Active Filters ────────────────────────────────────
      searchFilters: {
        city: 'all',
        category: 'all',
        status: 'all',
        sortBy: 'value_score',
      },
      setSearchFilters: (filters) => set(s => ({
        searchFilters: { ...s.searchFilters, ...filters }
      })),

      // ── UI State ─────────────────────────────────────────
      sidebarOpen: true,
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

      alertsEnabled: true,
      toggleAlerts: () => set(s => ({ alertsEnabled: !s.alertsEnabled })),

      routeOptEnabled: true,
      toggleRouteOpt: () => set(s => ({ routeOptEnabled: !s.routeOptEnabled })),

      // ── Selected client ──────────────────────────────────
      selectedClientId: null,
      setSelectedClient: (id) => set({ selectedClientId: id }),
    }),
    {
      name: 'foggiasales-store',
      partialize: (s) => ({
        searchFilters: s.searchFilters,
        alertsEnabled: s.alertsEnabled,
        routeOptEnabled: s.routeOptEnabled,
        sidebarOpen: s.sidebarOpen,
      }),
    }
  )
)
