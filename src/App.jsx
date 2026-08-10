import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import { Toaster, HeaderTools } from './components/ui'
import { cloneIcon, Icons } from './components/Icons'
import useMobile from './lib/useMobile'
import { lireJeton, lireUtilisateur, majUtilisateur } from './lib/session'
import { authAPI } from './lib/api'

import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import DashboardPage      from './pages/DashboardPage'
import ScanProgressPage   from './pages/ScanProgressPage'
import ScanResultsPage    from './pages/ScanResultsPage'
import ScanListPage       from './pages/ScanListPage'
import ExpertsPage        from './pages/ExpertsPage'
import MessagesPage       from './pages/MessagesPage'
import RegisterExpertPage from './pages/RegisterExpertPage'
import AdminPage          from './pages/AdminPage'
import RemediationPage    from './pages/RemediationPage'
import SettingsPage       from './pages/SettingsPage'

/* ─── Helpers ─── */
function getUser() {
  return lireUtilisateur()
}
function getRole() {
  return (getUser().role || 'client').toLowerCase()
}

/* Home route per role after login */
const HOME_BY_ROLE = { client: '/dashboard', expert: '/dashboard', admin: '/admin' }

/* ─── Auth guard ─── */
function RequireAuth() {
  const token = lireJeton()
  const location = useLocation()
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />
  return (
    <>
      <SynchroProfil />
      <Outlet />
    </>
  )
}

/* ─── Profil confronté au serveur ───
   Le rôle était figé au moment de la connexion et jamais revérifié : un client
   promu expert continuait de voir l'interface client, et un expert révoqué
   gardait la sienne, jusqu'à une déconnexion manuelle. Les gardes de route
   lisent ce rôle, l'écran affiché ne correspondait plus au compte réel.

   Un écart déclenche un rechargement : rare par nature, et cela évite de
   propager l'information à la main dans les huit endroits qui la lisent. */
function SynchroProfil() {
  useEffect(() => {
    let monte = true
    authAPI.me()
      .then((res) => {
        if (!monte || !res.data) return
        const local = lireUtilisateur()
        if (local.role === res.data.role && local.name === res.data.name) return
        majUtilisateur({ name: res.data.name, email: res.data.email, role: res.data.role })
        window.location.reload()
      })
      .catch(() => { /* jeton invalide : l'intercepteur ferme déjà la session */ })
    return () => { monte = false }
  }, [])
  return null
}

/* ─── Role guard, blocks route and shows access denied ─── */
function RequireRole({ roles }) {
  const role = getRole()
  if (!roles.includes(role)) {
    return (
      <div className="flex items-center justify-center h-[60vh] flex-col gap-3 px-4">
        {cloneIcon(Icons.lock, { size: 32, color: '#9CA3AF' })}
        <div className="text-gray-700 font-semibold text-lg">Accès non autorisé</div>
        <div className="text-sm text-gray-500 text-center max-w-xs">
          Votre rôle <strong>{role}</strong> ne permet pas d'accéder à cette page.
        </div>
        <button
          onClick={() => window.history.back()}
          className="mt-2 px-4 py-2 text-sm text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          ← Retour
        </button>
      </div>
    )
  }
  return <Outlet />
}

/* ─── Scan progress, full dark screen, no sidebar ─── */
function ProgressLayout() {
  return <Outlet />
}

/* ─── Barre supérieure des petits écrans ───
   La barre latérale y est escamotée : sans ce point d'entrée permanent,
   la navigation deviendrait inaccessible une fois le tiroir refermé. */
function MobileBar({ onMenu }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-[15] flex h-[52px] items-center gap-3 border-b border-slate-200 bg-white px-4">
      <button
        onClick={onMenu}
        aria-label="Ouvrir le menu de navigation"
        className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-lg border-none bg-transparent text-slate-600 active:bg-slate-100"
      >
        <Menu size={20} strokeWidth={2} />
      </button>
      <button
        onClick={() => navigate('/dashboard')}
        title="Retour au tableau de bord"
        className="flex items-center gap-2 border-none bg-transparent p-0 cursor-pointer"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: 'linear-gradient(135deg, #2A7ACC, #1F5C99)' }}
        >
          {cloneIcon(Icons.shield, { color: '#fff', size: 15 })}
        </span>
        <span className="text-[14px] font-bold tracking-[-0.02em] text-slate-900">CyberGuardian</span>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <HeaderTools />
      </div>
    </header>
  )
}

/* ─── Main layout with sidebar ─── */
function AppLayout() {
  const location = useLocation()
  const mobile   = useMobile()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('cg-sidebar') === 'min')
  const [tiroir, setTiroir]       = useState(false)

  const toggleSidebar = () => setCollapsed((c) => {
    localStorage.setItem('cg-sidebar', c ? 'max' : 'min')
    return !c
  })

  // Le tiroir se referme à chaque navigation, sinon il recouvre la page
  // que l'on vient justement d'ouvrir
  useEffect(() => { setTiroir(false) }, [location.pathname])

  // Défilement du corps figé tant que le tiroir est ouvert : sans cela le
  // contenu glisse derrière le voile au moindre mouvement du doigt
  useEffect(() => {
    document.body.style.overflow = mobile && tiroir ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobile, tiroir])

  // La messagerie occupe tout l'espace disponible, sans bride de largeur
  const isMessages = location.pathname === '/messages'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        collapsed={!mobile && collapsed}
        onToggle={mobile ? () => setTiroir(false) : toggleSidebar}
        mobile={mobile}
        ouvert={tiroir}
      />

      {mobile && tiroir && (
        <div
          className="fixed inset-0 z-[19] bg-slate-900/50"
          onClick={() => setTiroir(false)}
          aria-hidden="true"
        />
      )}

      <main
        className="flex-1 min-h-screen w-full min-w-0"
        style={{
          marginLeft: mobile ? 0 : collapsed ? 68 : 240,
          maxWidth: isMessages ? 'none' : 1440,
          transition: 'margin-left 0.2s ease',
        }}
      >
        {mobile && <MobileBar onMenu={() => setTiroir(true)} />}
        <div
          className="page-anim"
          style={{
            padding: mobile
              ? (isMessages ? '12px 12px 16px' : '18px 16px 48px')
              : (isMessages ? '20px 24px 20px' : '28px 36px 60px'),
          }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}

/* ─── Titre de l'onglet ───
   Un titre unique pour toute l'application rend l'historique du navigateur
   illisible et deux onglets impossibles à distinguer. */
const TITRES = {
  '/login':           'Connexion',
  '/register':        'Créer un compte',
  '/dashboard':       'Tableau de bord',
  '/scan-results':    'Tous les scans',
  '/experts':         'Experts',
  '/messages':        'Messagerie',
  '/settings':        'Paramètres',
  '/register-expert': 'Devenir expert',
  '/admin':           'Administration',
  '/remediation':     'Correction GitHub',
}

function TitreDocument() {
  const { pathname } = useLocation()
  useEffect(() => {
    const section =
      TITRES[pathname] ||
      (pathname.startsWith('/scan-results/')  ? 'Résultats du scan' :
       pathname.startsWith('/scan-progress/') ? 'Analyse en cours'  : null)
    document.title = section ? `${section} · CyberGuardian` : 'CyberGuardian — EASM Platform'
  }, [pathname])
  return null
}

/* ─── Smart home redirect ─── */
function HomeRedirect() {
  const role = getRole()
  return <Navigate to={HOME_BY_ROLE[role] || '/dashboard'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <TitreDocument />
      <Toaster />
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Authenticated */}
        <Route element={<RequireAuth />}>

          {/* Scan progress, full screen, no sidebar */}
          <Route path="/scan-progress/:id" element={<ScanProgressPage />} />

          {/* Layout with sidebar */}
          <Route element={<AppLayout />}>

            {/* ── All authenticated roles ── */}
            <Route element={<RequireRole roles={['client', 'expert', 'admin']} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* ── CLIENT + ADMIN only ── */}
            <Route element={<RequireRole roles={['client', 'admin']} />}>
              <Route path="/experts" element={<ExpertsPage />} />
            </Route>

            {/* ── CLIENT only, un admin ou un expert ne candidate pas ── */}
            <Route element={<RequireRole roles={['client']} />}>
              <Route path="/register-expert" element={<RegisterExpertPage />} />
            </Route>

            {/* ── All authenticated roles ── */}
            <Route element={<RequireRole roles={['client', 'expert', 'admin']} />}>
              <Route path="/scan-results"     element={<ScanListPage />} />
              <Route path="/scan-results/:id" element={<ScanResultsPage />} />
              <Route path="/messages"         element={<MessagesPage />} />
              <Route path="/settings"         element={<SettingsPage />} />
            </Route>

            {/* ── ADMIN only ── */}
            <Route element={<RequireRole roles={['admin']} />}>
              <Route path="/admin"       element={<AdminPage />} />
              <Route path="/remediation" element={<RemediationPage />} />
            </Route>

          </Route>
        </Route>

        {/* Smart home → redirect based on role */}
        <Route path="/" element={<RequireAuth />}>
          <Route index element={<HomeRedirect />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}