import { Star, Phone, MapPin, Globe, ExternalLink } from 'lucide-react'
import { STATUS_CONFIG, CATEGORIES } from '../../lib/constants'

// ─── Stars ────────────────────────────────────────────────────────────────
export function StarRating({ score, size = 14, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange?.(n)}
          className={onChange ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          title={`${n} stelle`}
        >
          <Star
            size={size}
            className={n <= score ? 'star-filled fill-accent-500' : 'star-empty'}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return null
  return <span className={`status-${status}`}>{cfg.label}</span>
}

// ─── Status Selector ──────────────────────────────────────────────────────
export function StatusSelect({ value, onChange, className = '' }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`select ${className}`}>
      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
        <option key={k} value={k}>{v.label}</option>
      ))}
    </select>
  )
}

// ─── Category Badge ───────────────────────────────────────────────────────
export function CategoryBadge({ category }) {
  const cfg = CATEGORIES[category]
  if (!cfg) return null
  const colors = {
    orange: 'bg-orange-500/15 text-orange-300',
    green: 'bg-green-500/15 text-green-300',
    blue: 'bg-blue-500/15 text-blue-300',
    purple: 'bg-purple-500/15 text-purple-300',
  }
  return (
    <span className={`badge ${colors[cfg.color] || 'bg-slate-700 text-slate-300'}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin"
    />
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mb-4">
        <Icon size={24} className="text-slate-500" />
      </div>
      <p className="font-display font-semibold text-slate-300">{title}</p>
      {subtitle && <p className="text-slate-500 text-sm mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'brand', trend }) {
  const colors = {
    brand:  'text-brand-400 bg-brand-500/10',
    green:  'text-green-400 bg-green-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
  }
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="font-display font-bold text-2xl text-slate-100 mt-0.5">{value}</p>
        {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`card w-full ${widths[size]} animate-slide-up shadow-2xl shadow-slate-950/50`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
          <h2 className="font-display font-semibold text-lg text-slate-100">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Page Header ─────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-100">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  const styles = {
    success: 'bg-green-500/20 border-green-500/30 text-green-300',
    error:   'bg-red-500/20 border-red-500/30 text-red-300',
    info:    'bg-brand-500/20 border-brand-500/30 text-brand-300',
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 border rounded-xl px-4 py-3 text-sm font-medium animate-slide-up shadow-lg ${styles[type]}`}>
      {message}
    </div>
  )
}
