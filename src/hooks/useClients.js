import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi, crmApi, statsApi, alertsApi } from '../lib/supabase'
import { calculateValueScore } from '../lib/scoring'

// ─────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────
export function useClients(filters = {}) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => clientsApi.getAll(filters),
    select: (data) => data.map(c => ({
      ...c,
      value_score: c.value_score || calculateValueScore(c),
    })),
  })
}

export function useClient(id) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (client) => clientsApi.create({
      ...client,
      value_score: calculateValueScore(client),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }) => clientsApi.update(id, updates),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['client', id] })
    },
  })
}

export function useUpdateClientStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => clientsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => clientsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

// ─────────────────────────────────────────────
// CRM ENTRIES
// ─────────────────────────────────────────────
export function useCRMEntries(clientId) {
  return useQuery({
    queryKey: ['crm', clientId],
    queryFn: () => crmApi.getByClient(clientId),
    enabled: !!clientId,
  })
}

export function useAddCRMEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entry) => crmApi.addEntry(entry),
    onSuccess: (_, entry) => {
      qc.invalidateQueries({ queryKey: ['crm', entry.client_id] })
      qc.invalidateQueries({ queryKey: ['clients'] })
      qc.invalidateQueries({ queryKey: ['crm-activity'] })
    },
  })
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['crm-activity'],
    queryFn: () => crmApi.getRecentActivity(20),
  })
}

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: statsApi.getDashboard,
    staleTime: 1000 * 60,
  })
}

// ─────────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────────
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.getAll,
  })
}

export function useAddAlertToCRM() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ alertId, clientData }) => alertsApi.addToCRM(alertId, clientData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
