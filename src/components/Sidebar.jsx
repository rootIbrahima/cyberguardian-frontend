import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cloneIcon, Icons } from './Icons'
import { Avatar, Button } from './ui'
import { messageAPI, adminAPI } from '../lib/api'
import { fermerSession, lireUtilisateur } from '../lib/session'

/* ─── Nav definitions per role ─── */
const NAV_BY_ROLE = {
  client: {
    principal: [
      { path: '/dashboard',       label: 'Tableau de bord', icon: Icons.dashboard },
      { path: '/scan-results',    label: 'Mes scans',       icon: Icons.results },
      { path: '/experts',         label: 'Experts',         icon: Icons.experts },
      { path: '/messages',        label: 'Messagerie',      icon: Icons.message },
    ],
    compte: [
      { path: '/register-expert', label: 'Devenir expert',  icon: Icons.apply },
    ],
  },
  expert: {
    principal: [
      { path: '/dashboard',       label: 'Mes missions',    icon: Icons.dashboard },
      { path: '/scan-results',    label: 'Rapports clients',icon: Icons.results },
      { path: '/messages',        label: 'Messagerie',      icon: Icons.message },
    ],
    compte: [],
  },
  admin: {
    principal: [
      { path: '/admin',           label: 'Administration',   icon: Icons.admin },
      { path: '/dashboard',       label: 'Tableau de bord',  icon: Icons.dashboard },
      { path: '/experts',         label: 'Experts',          icon: Icons.experts },
      { path: '/scan-results',    label: 'Tous les scans',   icon: Icons.results },
      { path: '/remediation',     label: 'Correction GitHub', icon: Icons.github },
      { path: '/messages',        label: 'Messagerie',       icon: Icons.message },
    ],
    compte: [],
  },
}

const ROLE_COLORS = { client: '#2A7ACC', expert: '#10B981', admin: '#F59E0B' }
const ROLE_LABELS = { client: 'Client', expert: 'Expert validé', admin: 'Administrateur' }

function NavButton({ item, isActive, onClick, collapsed }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center rounded-lg border-none cursor-pointer mb-0.5 transition-all duration-150 relative ${
        collapsed ? 'justify-center px-0 py-[11px]' : 'gap-[11px] px-[14px] py-[10px] max-lg:py-3 text-left'
      }`}
      style={{
        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 400,
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
    >
      {isActive && (
        <span className="absolute left-[-12px] top-2 bottom-2 w-[3px] bg-blue-500 rounded-r-[3px]" />
      )}
      <span className="relative flex-shrink-0">
        {cloneIcon(item.icon, { color: isActive ? '#fff' : 'rgba(255,255,255,0.55)', size: 18 })}
        {collapsed && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-[#0F1929]" />
        )}
      </span>
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && item.badge > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold rounded-[10px] px-[7px] py-[2px] min-w-[20px] text-center leading-[1.2]">
          {item.badge}
        </span>
      )}
    </button>
  )
}

export default function Sidebar({ collapsed = false, onToggle, mobile = false, ouvert = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread]               = useState(0)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const user = lireUtilisateur()
  const role = (user.role || 'client').toLowerCase()
  const nav  = NAV_BY_ROLE[role] || NAV_BY_ROLE.client

  /* Badge : candidatures en attente (admin) ou messages non lus, rafraîchi toutes les 15s */
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        if (role === 'admin') {
          const res = await adminAPI.pendingExperts()
          if (Array.isArray(res.data)) setUnread(res.data.length)
        } else {
          const res = await messageAPI.conversations()
          if (Array.isArray(res.data)) {
            setUnread(res.data.reduce((total, c) => total + (c.unread || 0), 0))
          }
        }
      } catch { /* backend hors ligne, pas de badge */ }
    }
    fetchUnread()
    const t = setInterval(fetchUnread, 15000)
    return () => clearInterval(t)
  }, [role])

  const badgePath = role === 'admin' ? '/admin' : '/messages'
  const withBadge = (item) =>
    item.path === badgePath && unread > 0 ? { ...item, badge: unread } : item

  /* Échap referme la demande de confirmation de déconnexion, à défaut le tiroir */
  useEffect(() => {
    if (!confirmLogout && !(mobile && ouvert)) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (confirmLogout) setConfirmLogout(false)
      else onToggle?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmLogout, mobile, ouvert, onToggle])

  const handleLogout = () => {
    setConfirmLogout(false)
    fermerSession()
    navigate('/login')
  }

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/scan-results' && location.pathname.startsWith('/scan-results'))

  // Sur petit écran, rejouer la page courante ne déclenche aucun changement
  // d'URL : le tiroir doit se refermer de lui-même
  const handleNav = (path) => {
    navigate(path)
    if (mobile) onToggle?.()
  }

  return (
    <nav
      className="flex flex-col fixed left-0 top-0 cg-hauteur-fenetre overflow-y-auto overflow-x-hidden"
      style={{
        width: mobile ? 264 : collapsed ? 68 : 240,
        zIndex: mobile ? 20 : 10,
        background: '#0F1929',
        padding: '16px 0 24px',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        // Escamotée hors écran plutôt que démontée : l'animation de glissement
        // reste possible, et « visibility » la sort du parcours de tabulation
        transform:  mobile ? (ouvert ? 'translateX(0)' : 'translateX(-100%)') : 'none',
        visibility: mobile && !ouvert ? 'hidden' : 'visible',
        transition: 'width 0.2s ease, transform 0.22s ease, visibility 0.22s',
      }}
    >
      {/* Marque, puis commande de repli */}
      <div className={`flex pb-5 ${collapsed ? 'flex-col items-center gap-2.5 px-0' : 'items-center gap-2.5 pl-[26px] pr-3'}`}>
        <button
          onClick={() => handleNav('/dashboard')}
          title="Retour au tableau de bord"
          className={`flex items-center gap-2.5 border-none bg-transparent p-0 text-left cursor-pointer ${collapsed ? '' : 'min-w-0 flex-1'}`}
        >
          <span
            className="flex items-center justify-center rounded-[9px] flex-shrink-0"
            style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #2A7ACC, #1F5C99)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.1) inset',
            }}
          >
            {cloneIcon(Icons.shield, { color: '#fff', size: 19 })}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block text-white text-[14px] font-bold tracking-[-0.02em] leading-tight">
                CyberGuardian
              </span>
              <span className="block text-[9.5px] uppercase tracking-[0.09em] leading-tight mt-px"
                style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
                EASM Platform
              </span>
            </span>
          )}
        </button>
        <button
          onClick={onToggle}
          title={mobile ? 'Fermer le menu' : collapsed ? 'Déplier le menu' : 'Replier le menu'}
          className="flex items-center justify-center rounded-lg border-none cursor-pointer flex-shrink-0 transition-colors"
          style={{ width: 32, height: 32, background: 'transparent', color: 'rgba(255,255,255,0.55)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          {mobile ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
        </button>
      </div>

      {/* Principal nav */}
      <div className="px-3 pb-2">
        {!collapsed && (
          <div className="px-[14px] pb-2 text-[10px] uppercase tracking-[0.1em] font-semibold"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            Principal
          </div>
        )}
        {nav.principal.map((item) => (
          <NavButton
            key={item.path}
            item={withBadge(item)}
            isActive={isActive(item.path)}
            onClick={() => handleNav(item.path)}
            collapsed={collapsed}
          />
        ))}
      </div>

      {/* Compte nav (only if non-empty) */}
      {nav.compte.length > 0 && (
        <div className="px-3 py-3" style={collapsed ? { borderTop: '1px solid rgba(255,255,255,0.06)' } : undefined}>
          {!collapsed && (
            <div className="px-[14px] pb-2 text-[10px] uppercase tracking-[0.1em] font-semibold"
              style={{ color: 'rgba(255,255,255,0.3)' }}>
              Compte
            </div>
          )}
          {nav.compte.map((item) => (
            <NavButton
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
              onClick={() => handleNav(item.path)}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* User footer */}
      <div className={collapsed ? 'pt-3 flex flex-col items-center gap-2' : 'px-4 pt-3'}
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {collapsed ? (
          <>
            <span title={`${user.name}, ${ROLE_LABELS[role] || role}`}>
              <Avatar name={user.name} color={ROLE_COLORS[role] || '#2A7ACC'} size={32} />
            </span>
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border cursor-pointer transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              title="Se déconnecter"
            >
              {cloneIcon(Icons.logout, { size: 16, color: 'currentColor' })}
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2.5 py-1.5 px-1">
            <Avatar
              name={user.name}
              color={ROLE_COLORS[role] || '#2A7ACC'}
              size={34}
            />
            <div className="flex-1 min-w-0">
              <div className="text-white text-[13px] font-medium truncate">{user.name}</div>
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {ROLE_LABELS[role] || role}
              </div>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border cursor-pointer transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              title="Se déconnecter"
            >
              {cloneIcon(Icons.logout, { size: 16, color: 'currentColor' })}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation de déconnexion, clic extérieur ou Échap pour annuler.
          Rendue dans le corps du document : la barre latérale porte un transform
          en mode tiroir, et un ancêtre transformé devient le bloc conteneur de
          ses descendants en position fixe. La fenêtre se serait centrée dans les
          240 px de la barre au lieu de l'écran. */}
      {confirmLogout && createPortal(
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="bg-white w-full max-w-[360px] p-5 shadow-xl"
            style={{ borderRadius: 'var(--cg-radius)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[15px] font-bold text-slate-900">Se déconnecter ?</div>
            <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
              Votre session sera fermée. Reconnectez-vous pour retrouver vos scans
              et vos conversations.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" size="sm" onClick={() => setConfirmLogout(false)}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleLogout}>
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  )
}