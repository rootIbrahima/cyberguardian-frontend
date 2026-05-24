import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'

import LoginPage          from './pages/LoginPage'
import DashboardPage      from './pages/DashboardPage'
import ScanProgressPage   from './pages/ScanProgressPage'
import ScanResultsPage    from './pages/ScanResultsPage'
import ScanListPage       from './pages/ScanListPage'
import ExpertsPage        from './pages/ExpertsPage'
import MessagesPage       from './pages/MessagesPage'
import RegisterExpertPage from './pages/RegisterExpertPage'
import AdminPage          from './pages/AdminPage'

/* ─── Helpers ─── */
function getUser() {
  try { return JSON.parse(localStorage.getItem('cg-user') || '{}') } catch { return {} }
}
function getRole() {
  return (getUser().role || 'client').toLowerCase()
}

/* Home route per role after login */
const HOME_BY_ROLE = { client: '/dashboard', expert: '/dashboard', admin: '/admin' }

/* ─── Auth guard ─── */
function RequireAuth() {
  const token = localStorage.getItem('cg-token')
  const location = useLocation()
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
}

/* ─── Role guard — blocks route and shows access denied ─── */
function RequireRole({ roles }) {
  const role = getRole()
  if (!roles.includes(role)) {
    return (
      <div className="flex items-center justify-center h-[60vh] flex-col gap-3">
        <div className="text-4xl">🔒</div>
        <div className="text-gray-700 font-semibold text-lg">Accès non autorisé</div>
        <div className="text-sm text-gray-400 text-center max-w-xs">
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

/* ─── Scan progress — full dark screen, no sidebar ─── */
function ProgressLayout() {
  return <Outlet />
}

/* ─── Main layout with sidebar ─── */
function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main
        className="flex-1 min-h-screen"
        style={{ marginLeft: 240, padding: '28px 36px 60px', maxWidth: 1440, width: '100%' }}
      >
        <div className="page-anim">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

/* ─── Smart home redirect ─── */
function HomeRedirect() {
  const role = getRole()
  return <Navigate to={HOME_BY_ROLE[role] || '/dashboard'} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated */}
        <Route element={<RequireAuth />}>

          {/* Scan progress — full screen, no sidebar */}
          <Route path="/scan-progress/:id" element={<ScanProgressPage />} />

          {/* Layout with sidebar */}
          <Route element={<AppLayout />}>

            {/* ── All authenticated roles ── */}
            <Route element={<RequireRole roles={['client', 'expert', 'admin']} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* ── CLIENT + ADMIN only ── */}
            <Route element={<RequireRole roles={['client', 'admin']} />}>
              <Route path="/experts"          element={<ExpertsPage />} />
              <Route path="/register-expert"  element={<RegisterExpertPage />} />
            </Route>

            {/* ── All authenticated roles ── */}
            <Route element={<RequireRole roles={['client', 'expert', 'admin']} />}>
              <Route path="/scan-results"     element={<ScanListPage />} />
              <Route path="/scan-results/:id" element={<ScanResultsPage />} />
              <Route path="/messages"         element={<MessagesPage />} />
            </Route>

            {/* ── ADMIN only ── */}
            <Route element={<RequireRole roles={['admin']} />}>
              <Route path="/admin" element={<AdminPage />} />
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