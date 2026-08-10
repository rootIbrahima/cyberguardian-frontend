import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Settings, AlertCircle, AlertTriangle, Info, Minus, RotateCw,
         CheckCircle2, XCircle, Copy, Check, TrendingUp, TrendingDown,
         MessageSquare, Handshake, ShieldCheck, Star, UserPlus, BadgeCheck,
         GitPullRequest } from 'lucide-react'
import { cloneIcon } from './Icons'
import { notificationAPI } from '../lib/api'

/* ══════════════════════════════════════════════════════════
   AVATAR
══════════════════════════════════════════════════════════ */
export function Avatar({ name, color, size = 36, initials }) {
  const i = initials || (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
      style={{ width: size, height: size, background: color || 'var(--cg-primary)', fontSize: size * 0.38 }}
    >
      {i}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   BADGE : teinte légère, radius 6px, jamais trop coloré
══════════════════════════════════════════════════════════ */
const BADGE_COLORS = {
  blue:   { bg: '#EFF6FF', fg: '#1D4ED8' },
  green:  { bg: '#F0FDF4', fg: '#1A7A4A' },
  orange: { bg: '#FFF7ED', fg: '#854F0B' },
  red:    { bg: '#FEF2F2', fg: '#991B1B' },
  gray:   { bg: '#F8FAFC', fg: '#64748B' },
  yellow: { bg: '#FEFCE8', fg: '#713F12' },
  purple: { bg: '#F5F3FF', fg: '#5B21B6' },
}

export function Badge({ children, color = 'blue', icon }) {
  const c = BADGE_COLORS[color] || BADGE_COLORS.blue
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap text-[11.5px] leading-none"
      style={{ background: c.bg, color: c.fg, padding: '3px 8px', border: `1px solid ${c.bg}` }}
    >
      {icon && cloneIcon(icon, { size: 11, color: c.fg })}
      {children}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════
   SEVERITY BADGE : icône + couleur sémantique
   Usage : <SeverityBadge level="HIGH" /> ou "CRITIQUE"
══════════════════════════════════════════════════════════ */
const SEV_MAP = {
  CRITICAL: { label: 'Critique', bg: '#FEF2F2', fg: '#991B1B', Icon: AlertCircle },
  CRITIQUE: { label: 'Critique', bg: '#FEF2F2', fg: '#991B1B', Icon: AlertCircle },
  HIGH:     { label: 'Haut',     bg: '#FFF7ED', fg: '#854F0B', Icon: AlertTriangle },
  HAUT:     { label: 'Haut',     bg: '#FFF7ED', fg: '#854F0B', Icon: AlertTriangle },
  MEDIUM:   { label: 'Moyen',    bg: '#FEFCE8', fg: '#713F12', Icon: Info },
  MEDIUM_:  { label: 'Moyen',    bg: '#FEFCE8', fg: '#713F12', Icon: Info },
  MOYEN:    { label: 'Moyen',    bg: '#FEFCE8', fg: '#713F12', Icon: Info },
  LOW:      { label: 'Bas',      bg: '#F8FAFC', fg: '#64748B', Icon: Minus },
  BAS:      { label: 'Bas',      bg: '#F8FAFC', fg: '#64748B', Icon: Minus },
  INFO:     { label: 'Info',     bg: '#EFF6FF', fg: '#1D4ED8', Icon: Info },
}

export function SeverityBadge({ level = 'LOW', showLabel = true }) {
  const key = (level || 'LOW').toUpperCase().replace(/-/g, '_')
  const s   = SEV_MAP[key] || SEV_MAP.LOW
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md font-semibold whitespace-nowrap text-[11px] leading-none"
      style={{ background: s.bg, color: s.fg, padding: '3px 7px' }}
    >
      <s.Icon size={11} strokeWidth={2.5} />
      {showLabel && s.label}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════
   CARD : radius 8px, ombre légère, bordure subtile
══════════════════════════════════════════════════════════ */
export function Card({ children, className = '', style, ...props }) {
  return (
    <div
      className={`bg-white border border-slate-200 ${className}`}
      style={{ borderRadius: 'var(--cg-radius)', boxShadow: 'var(--cg-shadow)', ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   BUTTON : variantes alignées sur la palette brief
══════════════════════════════════════════════════════════ */
const BTN_VARIANTS = {
  primary:   'bg-[#1F5C99] text-white border-transparent hover:bg-[#1a4f87] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed',
  secondary: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:     'bg-transparent text-[#1F5C99] border-transparent hover:bg-blue-50 disabled:opacity-50',
  danger:    'bg-white text-[#991B1B] border-red-200 hover:bg-red-50 disabled:opacity-50',
  success:   'bg-[#1A7A4A] text-white border-transparent hover:bg-[#165f3b] disabled:opacity-50',
}

const BTN_SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-[6px]',
  md: 'px-4 py-2 text-sm gap-2 rounded-[var(--cg-radius)]',
  lg: 'px-5 py-2.5 text-[15px] gap-2 rounded-[var(--cg-radius)]',
}

export function Button({ children, variant = 'primary', icon, size = 'md', onClick, disabled, className = '', type = 'button', style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`inline-flex items-center justify-center font-semibold border transition-all duration-150 active:scale-[0.98] ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
    >
      {icon && cloneIcon(icon, { size: size === 'sm' ? 13 : 15, color: 'currentColor' })}
      {children}
    </button>
  )
}

/* ══════════════════════════════════════════════════════════
   INPUT / LABELED INPUT
══════════════════════════════════════════════════════════ */
export function Input({ value, onChange, placeholder, type = 'text', className = '', style, ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3.5 py-2.5 rounded-[var(--cg-radius)] border border-slate-300 text-sm outline-none transition-all focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/10 bg-white text-slate-900 placeholder-slate-400 ${className}`}
      style={style}
      {...props}
    />
  )
}

export function LabeledInput({ label, icon, value, onChange, placeholder, type = 'text', action, autoComplete }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-[0.01em]">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-slate-500">
            {cloneIcon(icon, { size: 16, color: 'currentColor' })}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full py-2.5 rounded-[var(--cg-radius)] border border-slate-300 text-sm outline-none transition-all focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/10 bg-white text-slate-900 placeholder-slate-400 ${icon ? 'pl-10 pr-10' : 'px-3.5'}`}
        />
        {action && <div className="absolute right-2.5">{action}</div>}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   PAGE HEADER
══════════════════════════════════════════════════════════ */
const NOTIF_TYPES = {
  message:         { Icon: MessageSquare,  bg: '#EFF6FF', fg: '#1D4ED8' },
  mission_level:   { Icon: Handshake,      bg: '#FFF7ED', fg: '#854F0B' },
  contract:        { Icon: ShieldCheck,    bg: '#F0FDF4', fg: '#1A7A4A' },
  rating:          { Icon: Star,           bg: '#FEFCE8', fg: '#713F12' },
  expert_pending:  { Icon: UserPlus,       bg: '#F5F3FF', fg: '#5B21B6' },
  expert_decision: { Icon: BadgeCheck,     bg: '#F0FDF4', fg: '#1A7A4A' },
  remediation:     { Icon: GitPullRequest, bg: '#F8FAFC', fg: '#334155' },
}

function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen]   = useState(false)
  const [items, setItems] = useState([])

  const fetchItems = useCallback(() => {
    notificationAPI.list()
      .then((res) => { if (Array.isArray(res.data)) setItems(res.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchItems()
    const t = setInterval(fetchItems, 6000)
    // Rafraîchit aussi au retour sur l'onglet
    const onFocus = () => fetchItems()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus) }
  }, [fetchItems])

  const unreadCount = items.filter((n) => !n.read).length

  const openItem = (n) => {
    setOpen(false)
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      notificationAPI.markRead(n.id).catch(() => {})
    }
    if (!n.link) return
    if (n.link.startsWith('http')) window.open(n.link, '_blank', 'noopener')
    else navigate(n.link)
  }

  const markAllRead = (e) => {
    e.stopPropagation()
    setItems((prev) => prev.map((x) => ({ ...x, read: true })))
    notificationAPI.markAllRead().catch(() => {})
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchItems() }}
        title="Notifications"
        className="w-9 h-9 rounded-[var(--cg-radius)] border border-slate-200 bg-white flex items-center justify-center text-slate-500 relative hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <Bell size={16} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* clic à l'extérieur pour fermer */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[min(380px,calc(100vw-32px))] bg-white border border-slate-200 rounded-[10px] shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-semibold text-slate-800">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1.5 font-normal text-slate-500">
                    · {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-blue-700 hover:underline cursor-pointer flex-shrink-0"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-auto">
              {items.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <div className="text-[13px] font-medium text-slate-600">Aucune notification</div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
                    Les réponses de vos experts, les décisions sur vos candidatures et les
                    évaluations de mission apparaîtront ici.
                  </p>
                </div>
              ) : (
                items.map((n) => {
                  const t = NOTIF_TYPES[n.type] || { Icon: Bell, bg: '#F8FAFC', fg: '#64748B' }
                  return (
                    <button
                      key={n.id}
                      onClick={() => openItem(n)}
                      className="w-full text-left px-3.5 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start"
                      style={{ background: n.read ? undefined : '#F7FAFE' }}
                    >
                      <span
                        className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ background: t.bg }}
                      >
                        <t.Icon size={15} strokeWidth={2} style={{ color: t.fg }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className={`text-[12.5px] leading-snug ${n.read ? 'font-medium text-slate-600' : 'font-semibold text-slate-900'}`}>
                            {n.title}
                          </span>
                          {!n.read && <span className="mt-1 h-[7px] w-[7px] flex-shrink-0 rounded-full bg-blue-600" />}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block text-[11.5px] leading-snug text-slate-500 line-clamp-2">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1.5 block text-[10.5px] text-slate-500">
                          <RelativeTime date={n.createdAt} />
                        </span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* Cloche et raccourci paramètres. Sur poste de travail ils vivent dans
   l'en-tête de page ; en dessous de 1024 px, ils rejoignent la barre supérieure
   plutôt que d'occuper une ligne entière sous le titre. */
export function HeaderTools() {
  const navigate = useNavigate()
  return (
    <>
      <NotificationBell />
      <button
        onClick={() => navigate('/settings')}
        title="Paramètres du compte"
        className="w-9 h-9 rounded-[var(--cg-radius)] border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <Settings size={16} strokeWidth={2} />
      </button>
    </>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-3 mb-5 sm:mb-6 sm:flex-row sm:justify-between sm:items-start sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-[19px] sm:text-[22px] font-bold tracking-[-0.02em] text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-[12.5px] sm:text-[13px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {/* Sans action propre, la rangée disparaît sous 1024 px : les deux icônes
          sont déjà accessibles depuis la barre supérieure */}
      <div className={`gap-2 items-center flex-shrink-0 ${actions ? 'flex w-full sm:w-auto' : 'hidden lg:flex'}`}>
        {actions}
        <div className="hidden lg:flex gap-2 items-center">
          <HeaderTools />
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SKELETON : placeholder animé pendant le chargement
   Usage : <Skeleton w="100%" h={16} /> ou <Skeleton className="w-32 h-4" />
══════════════════════════════════════════════════════════ */
export function Skeleton({ w, h, className = '', rounded = false }) {
  return (
    <div
      className={`skeleton ${rounded ? 'rounded-full' : ''} ${className}`}
      style={{ width: w, height: h || 14 }}
    />
  )
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <Card className="p-5 space-y-3">
      <Skeleton w="40%" h={16} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} w={i === lines - 1 ? '60%' : '100%'} h={12} />
      ))}
    </Card>
  )
}

/* ══════════════════════════════════════════════════════════
   TOOLTIP : survol pour expliquer métriques ou valeurs
   Usage : <Tooltip tip="Score basé sur TLS + CVE">42/100</Tooltip>
══════════════════════════════════════════════════════════ */
export function Tooltip({ tip, children, side = 'top' }) {
  const posClass = side === 'bottom'
    ? 'top-full mt-2 bottom-auto'
    : 'bottom-full mb-2 top-auto'
  return (
    <span className="relative group inline-flex items-center">
      {children}
      <span
        className={`hidden sm:block absolute left-1/2 -translate-x-1/2 ${posClass} px-2 py-1 text-[11px] bg-slate-900 text-white rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 font-normal tracking-normal`}
      >
        {tip}
        <span
          className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${side === 'bottom' ? 'bottom-full border-b-[4px] border-b-slate-900 border-x-[4px] border-x-transparent' : 'top-full border-t-[4px] border-t-slate-900 border-x-[4px] border-x-transparent'}`}
        />
      </span>
    </span>
  )
}

/* ══════════════════════════════════════════════════════════
   RELATIVE TIME : "il y a 2 h", absolu au survol
   Usage : <RelativeTime date="2026-05-24T14:32:00" />
           <RelativeTime date="24 mai 2026, 14:32" />
══════════════════════════════════════════════════════════ */
function parseDate(dateStr) {
  if (!dateStr) return null
  // Try ISO first
  const d = new Date(dateStr)
  if (!isNaN(d)) return d
  // Try "24 mai 2026, 14:32" French format
  // Le préfixe de quatre lettres est testé en premier : « juin » et « juillet »
  // partagent les trois premières et le backend produit les deux formes,
  // abrégée (« aou. ») comme entière (« juin »).
  const months = {
    jan:0, fev:1, fév:1, feb:1, mar:2, avr:3, apr:3, mai:4, may:4,
    juin:5, jun:5, juil:6, jul:6, aout:7, aou:7, aoû:7, aug:7,
    sep:8, oct:9, nov:10, dec:11, déc:11,
  }
  // Le point de l'abréviation doit être toléré, sinon « 07 aou. 2026 » ne
  // correspond à rien et la date s'affiche brute au lieu de « il y a 2 j ».
  // \w exclut les accents : « déc. » et « fév. » imposent une classe explicite.
  const m = dateStr.match(/(\d{1,2})\s+([^\s.]+)\.?\s+(\d{4})(?:,?\s+(\d{1,2}):(\d{2}))?/)
  if (m) {
    const nom = (m[2] || '').toLowerCase()
    const mon = months[nom.slice(0, 4)] ?? months[nom.slice(0, 3)]
    if (mon !== undefined)
      return new Date(+m[3], mon, +m[1], +(m[4]||0), +(m[5]||0))
  }
  return null
}

function formatRelative(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60)    return 'à l\'instant'
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatAbsolute(date) {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function RelativeTime({ date, className = '' }) {
  const parsed = parseDate(date)
  if (!parsed) return <span className={className}>{date}</span>
  return (
    <Tooltip tip={formatAbsolute(parsed)} side="top">
      <time className={`cursor-default ${className}`} dateTime={parsed.toISOString()}>
        {formatRelative(parsed)}
      </time>
    </Tooltip>
  )
}

/* ══════════════════════════════════════════════════════════
   COPY VALUE : copie au presse-papier avec feedback ✓
   Usage : <CopyValue value="192.168.1.1" />
══════════════════════════════════════════════════════════ */
export function CopyValue({ value, label, className = '' }) {
  const [copied, setCopied] = useState(false)
  const copy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <span className={`inline-flex items-center gap-1.5 group ${className}`}>
      <span className="font-mono text-sm text-slate-700">{label || value}</span>
      <button
        onClick={copy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-100"
        title="Copier"
      >
        {copied
          ? <Check size={12} strokeWidth={2.5} className="text-green-600" />
          : <Copy size={12} strokeWidth={2} className="text-slate-500" />
        }
      </button>
    </span>
  )
}

/* ══════════════════════════════════════════════════════════
   TOAST : notifications légères (success/error/info/warning)
   Usage depuis n'importe où : toast.success('Scan supprimé')
                                toast.error('Échec du serveur')
══════════════════════════════════════════════════════════ */
let _dispatch = null

const TOAST_ICONS = {
  success: <CheckCircle2 size={15} strokeWidth={2} />,
  error:   <XCircle     size={15} strokeWidth={2} />,
  info:    <Info        size={15} strokeWidth={2} />,
  warning: <AlertTriangle size={15} strokeWidth={2} />,
}

const TOAST_STYLES = {
  success: { border: '#BBF7D0', icon: '#1A7A4A', bg: '#F0FDF4' },
  error:   { border: '#FCA5A5', icon: '#991B1B', bg: '#FEF2F2' },
  info:    { border: '#BFDBFE', icon: '#1D4ED8', bg: '#EFF6FF' },
  warning: { border: '#FDE68A', icon: '#854F0B', bg: '#FFFBEB' },
}

function emit(type, message) {
  if (_dispatch) _dispatch({ id: Date.now() + Math.random(), type, message })
}

export const toast = {
  success: (msg) => emit('success', msg),
  error:   (msg) => emit('error',   msg),
  info:    (msg) => emit('info',    msg),
  warning: (msg) => emit('warning', msg),
}

export function Toaster() {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  useEffect(() => {
    _dispatch = (t) => {
      setToasts((prev) => [...prev.slice(-4), t])
      timers.current[t.id] = setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 3500)
    }
    return () => { _dispatch = null }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-5 sm:right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => {
        const st = TOAST_STYLES[t.type] || TOAST_STYLES.info
        return (
          <div
            key={t.id}
            className="toast-enter pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-[var(--cg-radius)] border shadow-md text-[13px] font-medium max-w-full sm:max-w-[320px]"
            style={{ background: st.bg, borderColor: st.border, color: '#1E293B' }}
          >
            <span style={{ color: st.icon, flexShrink: 0 }}>{TOAST_ICONS[t.type]}</span>
            {t.message}
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SCORE DELTA : évolution par rapport au scan précédent de la même cible
   Usage : <ScoreDelta value={9} />   (positif = score amélioré)
══════════════════════════════════════════════════════════ */
export function ScoreDelta({ value }) {
  if (!value) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 font-mono">
        <Minus size={10} strokeWidth={2.5} />
        0
      </span>
    )
  }
  const up = value > 0
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[11px] font-bold font-mono"
      style={{ color: up ? '#10B981' : '#EF4444' }}
    >
      {up ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
      {up ? '+' : ''}{value}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════
   SERVEUR INJOIGNABLE
   Distingue « rien à afficher » de « impossible de charger ».
   Une liste vide annoncée pendant une panne laisse croire à une
   perte de données ; l'utilisateur doit savoir laquelle des deux.
══════════════════════════════════════════════════════════ */
export function ServeurInjoignable({ quoi = 'les données', onReessayer }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: '#FEF2F2' }}>
        <AlertTriangle size={22} strokeWidth={2} style={{ color: '#991B1B' }} />
      </div>
      <div className="text-[14px] font-semibold text-slate-700">Serveur injoignable</div>
      <p className="max-w-sm text-[12.5px] leading-relaxed text-slate-500">
        Impossible de charger {quoi}. Rien n'est perdu : c'est le serveur qui ne répond pas.
      </p>
      {onReessayer && (
        <button
          onClick={onReessayer}
          className="mt-1 inline-flex items-center gap-1.5 rounded-[var(--cg-radius)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <RotateCw size={13} strokeWidth={2} />
          Réessayer
        </button>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   DIVIDER
══════════════════════════════════════════════════════════ */
export function Divider({ className = '' }) {
  return <hr className={`border-slate-200 ${className}`} />
}
