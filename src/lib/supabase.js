import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

// ──────────────────────────────────────────────
// CLIENT QUERIES
// ──────────────────────────────────────────────
export const clientsApi = {
  async getAll({ city, category, status, orderBy = 'created_at' } = {}) {
    let query = supabase.from('clients').select('*').order(orderBy, { ascending: false })
    if (city && city !== 'all') query = query.eq('city', city)
    if (category && category !== 'all') query = query.eq('category', category)
    if (status && status !== 'all') query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase.from('clients').select('*, crm_entries(*)').eq('id', id).single()
    if (error) throw error
    return data
  },

  async create(client) {
    const { data, error } = await supabase.from('clients').insert(client).select().single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },

  async updateStatus(id, status) {
    return clientsApi.update(id, { status })
  },
}

// ──────────────────────────────────────────────
// CRM QUERIES
// ──────────────────────────────────────────────
export const crmApi = {
  async getByClient(clientId) {
    const { data, error } = await supabase
      .from('crm_entries')
      .select('*')
      .eq('client_id', clientId)
      .order('visit_date', { ascending: false })
    if (error) throw error
    return data || []
  },

  async addEntry(entry) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('crm_entries')
      .insert({ ...entry, agent_id: user?.id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getRecentActivity(limit = 20) {
    const { data, error } = await supabase
      .from('crm_entries')
      .select('*, clients(name, city, category)')
      .order('visit_date', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },
}

// ──────────────────────────────────────────────
// ALERTS QUERIES
// ──────────────────────────────────────────────
export const alertsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('new_opening_alerts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async addToCRM(alertId, clientData) {
    const client = await clientsApi.create({ ...clientData, is_new_opening: true, source: 'alert' })
    await supabase.from('new_opening_alerts').update({ added_to_crm: true, client_id: client.id }).eq('id', alertId)
    return client
  },
}

// ──────────────────────────────────────────────
// ROUTES QUERIES
// ──────────────────────────────────────────────
export const routesApi = {
  async save(route) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('routes')
      .insert({ ...route, agent_id: user?.id })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getRecent(limit = 5) {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },
}

// ──────────────────────────────────────────────
// STATS
// ──────────────────────────────────────────────
export const statsApi = {
  async getDashboard() {
    const [{ count: total }, { count: acquired }, { count: toContact }, { count: newAlerts }] =
      await Promise.all([
        supabase.from('clients').select('*', { count: 'exact', head: true }),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'cliente_acquisito'),
        supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'da_contattare'),
        supabase.from('new_opening_alerts').select('*', { count: 'exact', head: true }).eq('added_to_crm', false),
      ])
    return { total: total || 0, acquired: acquired || 0, toContact: toContact || 0, newAlerts: newAlerts || 0 }
  },
}
