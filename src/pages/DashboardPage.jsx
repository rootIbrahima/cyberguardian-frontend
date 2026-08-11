import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ScanForm from '../components/ScanForm'
import ScoreCard from '../components/ScoreCard'
import { Card, Button, PageHeader, Avatar, Skeleton, RelativeTime, ServeurInjoignable } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import { scanAPI, adminAPI, messageAPI } from '../lib/api'
import { lireUtilisateur } from '../lib/session'

const STATUS_MAP = {
  completed: { label: 'Terminé',  bg: '#D1FAE5', color: '#059669' },
  running:   { label: 'En cours', bg: '#E8F1FA', color: '#1F5C99' },
  critical:  { label: 'Critique', bg: '#FEE2E2', color: '#EF4444' },
}

const TYPE_ICONS = {
  Domaine: Icons.domain,
  IP:      Icons.ip,
  URL:     Icons.url,
  GitHub:  Icons.github,
}

function MetricCard({ label, value, sub, color, icon, trend, trendBad }) {
  return (
    <Card className="p-4 sm:p-[20px_22px_18px] flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <div
          className="w-[34px] h-[34px] rounded-lg flex items-center justify-center"
          style={{ background: color + '22' }}
        >
          {cloneIcon(icon, { color, size: 17 })}
        </div>
      </div>
      <div className="text-[24px] sm:text-[28px] font-bold tracking-[-0.02em] leading-none font-mono">{value}</div>
      <div className="flex justify-between items-center">
        <div className="text-[11.5px] text-gray-500">{sub}</div>
        {trend && trend !== '0' && (
          <span className="text-[10.5px] font-bold font-mono" style={{ color: trendBad ? '#EF4444' : '#10B981' }}>
            {trend}
          </span>
        )}
      </div>
    </Card>
  )
}

function ScanRow({ scan }) {
  const navigate  = useNavigate()
  const s         = STATUS_MAP[scan.status] || STATUS_MAP.completed
  const typeIcon  = TYPE_ICONS[scan.typeLabel] || TYPE_ICONS[scan.type] || Icons.domain
  const isGithub  = scan.type === 'github'
  const scoreMax  = isGithub ? (scan.results?.score_max ?? 30) : 100
  const scorePct  = scan.score != null ? Math.round((scan.score / scoreMax) * 100) : null
  const scoreColor = scorePct >= 80 ? '#1A7A4A' : scorePct >= 50 ? '#854F0B' : '#991B1B'

  return (
    <tr
      className="border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
      onClick={() => navigate(`/scan-results/${scan.id}`)}
    >
      <td className="py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--cg-radius)] bg-blue-50 flex items-center justify-center flex-shrink-0">
            {cloneIcon(typeIcon, { size: 16, color: '#1F5C99' })}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-medium font-mono text-slate-800 truncate max-w-[150px] sm:max-w-none">{scan.target}</div>
            <div className="text-[11px] text-slate-500">{scan.typeLabel || scan.type}</div>
          </div>
        </div>
      </td>
      <td className="py-3 text-center">
        {scan.score != null ? (
          <span className="text-[13px] font-bold font-mono" style={{ color: scoreColor }}>
            {scan.score}/{scoreMax}
          </span>
        ) : (
          <span className="text-xs text-slate-500">—</span>
        )}
      </td>
      <td className="py-3 text-center hidden sm:table-cell">
        <span
          className="text-xs font-semibold px-2 py-1 rounded-md inline-flex items-center gap-1"
          style={{ background: s.bg, color: s.color }}
        >
          {s.label}
          {scan.status === 'running' && <span className="pulse-dot ml-1" />}
        </span>
      </td>
      <td className="py-3 text-right">
        <RelativeTime date={scan.date} className="text-xs text-slate-500" />
      </td>
    </tr>
  )
}

const LEVEL_COLORS = { 1: '#9CA3AF', 2: '#F59E0B', 3: '#10B981' }
const LEVEL_LABELS = { 1: 'Demande reçue', 2: 'Mission acceptée', 3: 'Contrat signé' }

function ExpertMissions({ conversations }) {
  const navigate = useNavigate()
  const missions = conversations.filter((c) => c.level >= 2)

  return (
    <Card className="p-4 sm:p-[22px_26px] mb-[22px]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-[15px] font-semibold">Missions en cours</div>
          <div className="text-xs text-gray-500 mt-0.5">{missions.length} mission(s) active(s)</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/messages')}>Voir messages →</Button>
      </div>
      {missions.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">Aucune mission active pour le moment</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {missions.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate('/messages')}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Avatar name={c.expert.name} color={c.expert.color} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold">{c.expert.name}</div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">{c.subject}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className="text-[10.5px] font-bold px-2.5 py-1 rounded-md"
                  style={{ background: LEVEL_COLORS[c.level] + '20', color: LEVEL_COLORS[c.level] }}
                >
                  N{c.level} · {LEVEL_LABELS[c.level]}
                </span>
                {cloneIcon(Icons.message, { size: 15, color: '#9CA3AF' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = lireUtilisateur()
  const role = (user.role || 'client').toLowerCase()

  const [scans, setScans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [horsLigne, setHorsLigne] = useState(false)
  const [stats, setStats]     = useState(null)         // admin uniquement
  const [convs, setConvs]     = useState([])           // expert uniquement

  useEffect(() => {
    scanAPI.list()
      .then((res) => { setScans(res.data || []); setHorsLigne(false) })
      .catch(() => { setScans([]); setHorsLigne(true) })
      .finally(() => setLoading(false))

    if (role === 'admin') {
      adminAPI.stats().then((res) => setStats(res.data)).catch(() => {})
    }
    if (role === 'expert') {
      messageAPI.conversations()
        .then((res) => { if (Array.isArray(res.data)) setConvs(res.data) })
        .catch(() => {})
    }
  }, [role])

  const easmScans   = scans.filter((s) => s.type !== 'github' && s.score !== null)
  const githubScans = scans.filter((s) => s.type === 'github' && s.score !== null)

  const avgEasmScore = easmScans.length
    ? Math.round(easmScans.reduce((sum, s) => sum + s.score, 0) / easmScans.length)
    : 0
  const avgGhScore  = githubScans.length
    ? Math.round(githubScans.reduce((sum, s) => sum + s.score, 0) / githubScans.length)
    : 0

  const lastScan  = easmScans[0]
  const lastGrade = lastScan?.results?.ssl?.grade ?? null
  const totalVulns = scans.reduce((sum, s) => sum + (s.vulns || 0), 0)

  const PAGE_TITLE = { client: 'Tableau de bord', expert: 'Mes missions', admin: 'Tableau de bord' }
  const PAGE_SUB   = {
    client: "Vue d'ensemble de votre posture de sécurité externe",
    expert: "Missions actives et rapports clients assignés",
    admin:  'Supervision globale de la plateforme CyberGuardian',
  }

  const clientMetrics = [
    {
      label: 'Score sécurité moyen',
      value: easmScans.length ? `${avgEasmScore}/100` : '—',
      sub:   easmScans.length ? `Sur ${easmScans.length} scan(s) EASM` : 'Aucun scan EASM',
      color: '#1F5C99', icon: Icons.shield,
    },
    {
      label: 'Score GitHub moyen',
      value: githubScans.length ? `${avgGhScore}/30` : '—',
      sub:   githubScans.length ? `Sur ${githubScans.length} dépôt(s) analysé(s)` : 'Aucun scan GitHub',
      color: '#374151', icon: Icons.github,
    },
    { label: 'Failles détectées', value: String(totalVulns), sub: 'DNS, SSL, headers et code',  color: '#EF4444', icon: Icons.alert },
    { label: 'Scans effectués',   value: String(scans.length), sub: 'Total tous types confondus', color: '#8B5CF6', icon: Icons.scan },
  ]

  const missionsActives = convs.filter((c) => c.level >= 2).length
  const contratsSignes  = convs.filter((c) => c.level === 3).length
  const totalUnread     = convs.reduce((sum, c) => sum + (c.unread || 0), 0)

  const expertMetrics = [
    { label: 'Missions actives',  value: String(missionsActives), sub: `${convs.filter((c) => c.level === 2).length} en attente de contrat`, color: '#10B981', icon: Icons.experts },
    { label: 'Demandes reçues',   value: String(convs.length),    sub: 'Toutes conversations',     color: '#1F5C99', icon: Icons.results },
    { label: 'Contrats signés',   value: String(contratsSignes),  sub: 'Accès rapport complet 48h', color: '#F59E0B', icon: Icons.shield },
    { label: 'Messages non lus',  value: String(totalUnread),     sub: `Sur ${convs.length} conversation(s)`, color: '#EF4444', icon: Icons.message },
  ]

  const adminMetrics = [
    { label: 'Utilisateurs inscrits', value: String(stats?.users ?? '—'),
      sub: stats ? `${stats.clients} client(s) · ${stats.experts} expert(s)` : 'Chargement…',
      color: '#1F5C99', icon: Icons.experts },
    { label: 'Scans totaux',        value: String(scans.length), sub: 'Tous clients',   color: '#10B981', icon: Icons.shield },
    { label: 'Failles détectées',   value: String(totalVulns),   sub: 'Tous scans',     color: '#EF4444', icon: Icons.alert },
    { label: 'Experts en attente',  value: String(stats?.pending ?? '—'), sub: 'Validation requise', color: '#F59E0B', icon: Icons.lock },
  ]

  const metrics = role === 'expert' ? expertMetrics : role === 'admin' ? adminMetrics : clientMetrics
  const displayScans = scans.slice(0, 6)

  return (
    <div>
      <PageHeader title={PAGE_TITLE[role]} subtitle={PAGE_SUB[role]} />

      {role === 'client' && <ScanForm />}
      {role === 'expert' && <ExpertMissions conversations={convs} />}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 mb-[22px]">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Score + Recent scans */}
      <div className={`grid gap-[18px] ${role === 'client' ? 'lg:grid-cols-[300px_minmax(0,1fr)]' : ''}`}>
        {role === 'client' && (
          <Card className="p-5 sm:p-[26px]">
            <ScoreCard
              score={avgEasmScore || 0}
              breakdown={lastScan?.results?.score_detail?.breakdown}
              sslScore={lastScan?.results?.ssl?.score}
              sslGrade={lastGrade}
            />
          </Card>
        )}

        <Card className="p-4 sm:p-[22px_26px]">
          <div className="flex justify-between items-center mb-3.5">
            <div>
              <div className="text-[15px] font-semibold">
                {role === 'admin' ? 'Tous les scans récents' : role === 'expert' ? 'Rapports clients récents' : 'Derniers scans'}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {scans.length > 0
                  ? `${scans.length} scan(s) au total`
                  : "Historique des derniers scans d'actifs"}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/scan-results')}>Voir tout →</Button>
          </div>

          {loading ? (
            <div className="space-y-2.5 py-2">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <Skeleton w={32} h={32} className="rounded-[var(--cg-radius)] flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton w="55%" h={12} />
                    <Skeleton w="30%" h={10} />
                  </div>
                  <Skeleton w={48} h={12} />
                  <Skeleton w={56} h={20} className="rounded-md" />
                  <Skeleton w={64} h={10} />
                </div>
              ))}
            </div>
          ) : horsLigne ? (
            <ServeurInjoignable quoi="vos scans" onReessayer={() => window.location.reload()} />
          ) : displayScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="text-gray-300 text-4xl mb-1">{cloneIcon(Icons.scan, { size: 36, color: '#D1D5DB' })}</div>
              <div className="text-sm font-medium text-gray-500">Aucun scan effectué</div>
              <div className="text-xs text-gray-500">Lancez votre premier scan depuis le formulaire ci-dessus.</div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  {['Cible', 'Score', 'Statut', 'Date'].map((h, i) => (
                    <th
                      key={h}
                      className={`pb-2.5 text-[10.5px] font-bold text-gray-500 uppercase tracking-[0.08em] ${i === 2 ? 'hidden sm:table-cell' : ''}`}
                      style={{ textAlign: i === 0 ? 'left' : i === 3 ? 'right' : 'center' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayScans.map((scan) => (
                  <ScanRow key={scan.id} scan={scan} />
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}