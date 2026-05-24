import { useNavigate, useLocation } from 'react-router-dom'
import { cloneIcon, Icons } from './Icons'
import { Avatar } from './ui'

/* ─── Nav definitions per role ─── */
const NAV_BY_ROLE = {
  client: {
    principal: [
      { path: '/dashboard',       label: 'Dashboard',       icon: Icons.dashboard },
      { path: '/scan-results',    label: 'Résultats scan',  icon: Icons.results },
    ],
    compte: [],
  },
  expert: {
    principal: [
      { path: '/dashboard',       label: 'Mes missions',    icon: Icons.dashboard },
      { path: '/scan-results',    label: 'Rapports clients',icon: Icons.results },
      { path: '/messages',        label: 'Messagerie',      icon: Icons.message, badge: 2 },
    ],
    compte: [],
  },
  admin: {
    principal: [
      { path: '/admin',           label: 'Administration',  icon: Icons.admin },
      { path: '/dashboard',       label: 'Tableau de bord', icon: Icons.dashboard },
      { path: '/experts',         label: 'Experts',         icon: Icons.experts },
      { path: '/scan-results',    label: 'Tous les scans',  icon: Icons.results },
      { path: '/messages',        label: 'Messages',        icon: Icons.message },
    ],
    compte: [],
  },
}

const ROLE_COLORS = { client: '#2A7ACC', expert: '#10B981', admin: '#F59E0B' }
const ROLE_LABELS = { client: 'Client', expert: 'Expert validé', admin: 'Administrateur' }

function NavButton({ item, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-[11px] px-[14px] py-[10px] rounded-lg border-none cursor-pointer mb-0.5 text-left transition-all duration-150 relative"
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
      {cloneIcon(item.icon, { color: isActive ? '#fff' : 'rgba(255,255,255,0.55)', size: 18 })}
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="bg-red-500 text-white text-[10px] font-bold rounded-[10px] px-[7px] py-[2px] min-w-[20px] text-center leading-[1.2]">
          {item.badge}
        </span>
      )}
    </button>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const user = JSON.parse(localStorage.getItem('cg-user') || '{"name":"Ibrahima LY","role":"client"}')
  const role = (user.role || 'client').toLowerCase()
  const nav  = NAV_BY_ROLE[role] || NAV_BY_ROLE.client

  const handleLogout = () => {
    localStorage.removeItem('cg-token')
    localStorage.removeItem('cg-user')
    navigate('/login')
  }

  const isActive = (path) =>
    location.pathname === path ||
    (path === '/scan-results' && location.pathname.startsWith('/scan-results'))

  const handleNav = (path) => {
    if (path === '/scan-results') {
      const lastId = localStorage.getItem('cg-last-scan')
      navigate(lastId ? `/scan-results/${lastId}` : '/scan-results')
    } else {
      navigate(path)
    }
  }

  return (
    <nav
      className="flex flex-col fixed left-0 top-0 z-10 h-screen"
      style={{
        width: 240,
        background: '#0F1929',
        padding: '24px 0',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pb-7">
        <div
          className="flex items-center justify-center rounded-[9px] flex-shrink-0"
          style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #2A7ACC, #1F5C99)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1) inset',
          }}
        >
          {cloneIcon(Icons.shield, { color: '#fff', size: 20 })}
        </div>
        <div>
          <div className="text-white font-bold text-[15px] tracking-[-0.02em]"></div>
          <div className="text-[10px] uppercase tracking-[0.08em] mt-0.5"
            style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace' }}>
            EASM Platform
          </div>
        </div>
      </div>


      {/* Principal nav */}
      <div className="px-3 pb-2">
        <div className="px-[14px] pb-2 text-[10px] uppercase tracking-[0.1em] font-semibold"
          style={{ color: 'rgba(255,255,255,0.3)' }}>
          Principal
        </div>
        {nav.principal.map((item) => (
          <NavButton
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            onClick={() => handleNav(item.path)}
          />
        ))}
      </div>

      {/* Compte nav (only if non-empty) */}
      {nav.compte.length > 0 && (
        <div className="px-3 py-3">
          <div className="px-[14px] pb-2 text-[10px] uppercase tracking-[0.1em] font-semibold"
            style={{ color: 'rgba(255,255,255,0.3)' }}>
            Compte
          </div>
          {nav.compte.map((item) => (
            <NavButton
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* User footer */}
      <div className="px-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
            onClick={handleLogout}
            className="bg-transparent border-none cursor-pointer p-1 transition-opacity hover:opacity-70"
            style={{ opacity: 0.45, color: '#fff' }}
            title="Déconnexion"
          >
            {cloneIcon(Icons.logout, { size: 18, color: '#fff' })}
          </button>
        </div>
      </div>
    </nav>
  )
}