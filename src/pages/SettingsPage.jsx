import { useState } from 'react'
import { Trash2, AlertTriangle, CheckCircle2, Settings } from 'lucide-react'
import { PageHeader, Modal } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../store/appStore'

export default function SettingsPage() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [done, setDone] = useState(false)
  const queryClient = useQueryClient()
  const { clearRoute } = useAppStore()

  async function handleReset() {
    setResetting(true)
    try {
      await supabase.from('crm_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('new_opening_alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      clearRoute()
      queryClient.invalidateQueries()
      setDone(true)
      setShowConfirm(false)
    } catch(e) {
      console.error(e)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Impostazioni" subtitle="Gestione e manutenzione dell'app" />

      {done && (
        <div className="card border-green-500/20 bg-green-500/5 p-4 mb-6 flex gap-3 text-green-400 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
          <p>Reset completato! Tutti i dati di test sono stati cancellati.</p>
        </div>
      )}

      {/* Reset section */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-semibold text-slate-100">Reset Database</h2>
            <p className="text-sm text-slate-500 mt-1">
              Cancella tutti i clienti, lo storico CRM e gli avvisi nuove aperture. 
              Usa questa funzione per ripulire i dati di test prima di iniziare a usare l'app sul serio.
            </p>
            <button
              onClick={() => { setDone(false); setShowConfirm(true) }}
              className="btn-danger mt-4"
            >
              <Trash2 size={14} /> Reset completo dati
            </button>
          </div>
        </div>
      </div>

      {/* Info section */}
      <div className="card p-5 mt-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Settings size={18} className="text-brand-400" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-slate-100">Info App</h2>
            <div className="text-sm text-slate-500 mt-2 space-y-1">
              <p>Versione: <span className="text-slate-300">1.0.0</span></p>
              <p>Database: <span className="text-slate-300">Supabase (PostgreSQL)</span></p>
              <p>Mappe: <span className="text-slate-300">OpenStreetMap + Leaflet</span></p>
              <p>Routing: <span className="text-slate-300">OpenRouteService</span></p>
              <p>Deploy: <span className="text-slate-300">Vercel</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="Conferma Reset" size="sm">
        <div className="space-y-4">
          <div className="flex gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              Stai per cancellare <strong>tutti i clienti</strong> e lo <strong>storico CRM</strong>. 
              Questa operazione è <strong>irreversibile</strong>.
            </p>
          </div>
          <p className="text-sm text-slate-400">Sei sicuro di voler procedere?</p>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1 justify-center">
              Annulla
            </button>
            <button onClick={handleReset} disabled={resetting} className="btn-danger flex-1 justify-center">
              {resetting ? 'Reset in corso...' : '🗑️ Sì, cancella tutto'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
