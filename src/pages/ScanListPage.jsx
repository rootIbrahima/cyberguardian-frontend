import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { scanAPI } from '../lib/api'
import { Card, Badge, PageHeader } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'

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

export default function ScanListPage() {
  const navigate = useNavigate()
  const [scans, setScans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    scanAPI.list()
      .then((res) => setScans(res.data || []))
      .catch(() => setScans([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = scans.filter((s) =>
    s.target?.toLowerCase().includes(search.toLowerCase()) ||
    s.typeLabel?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Tous les scans"
        subtitle={`${scans.length} scan${scans.length !== 1 ? 's' : ''} au total`}
      />

      <Card className="p-[22px_26px]">
        {/* Search */}
        <div className="relative mb-5">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            {cloneIcon(Icons.search, { size: 16, color: 'currentColor' })}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par cible ou type…"
            className="w-full pl-10 pr-4 py-2.5 rounded-[9px] border border-gray-200 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <span className="spinner" style={{ width: 20, height: 20, borderTopColor: '#1F5C99', borderColor: 'rgba(31,92,153,0.2)' }} />
            <span className="text-sm text-gray-400">Chargement…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
              {cloneIcon(Icons.scan, { size: 26, color: '#1F5C99' })}
            </div>
            <div className="text-gray-600 font-semibold">
              {search ? 'Aucun résultat pour cette recherche' : 'Aucun scan effectué'}
            </div>
            {!search && (
              <div className="text-sm text-gray-400">Lancez votre premier scan depuis le dashboard.</div>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                {['Cible', 'Score', 'CVE', 'Statut', 'Date'].map((h, i) => (
                  <th
                    key={h}
                    className="pb-3 text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.08em]"
                    style={{ textAlign: i === 0 ? 'left' : i === 4 ? 'right' : 'center' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((scan) => {
                const s = STATUS_MAP[scan.status] || STATUS_MAP.completed
                const typeIcon = TYPE_ICONS[scan.typeLabel] || Icons.domain
                const scoreColor = scan.score >= 80 ? '#10B981' : scan.score >= 50 ? '#F59E0B' : '#EF4444'
                return (
                  <tr
                    key={scan.id}
                    onClick={() => navigate(`/scan-results/${scan.id}`)}
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          {cloneIcon(typeIcon, { size: 17, color: '#1F5C99' })}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-semibold font-mono">{scan.target}</div>
                          <div className="text-[11px] text-gray-400">{scan.typeLabel}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      {scan.score !== null ? (
                        <span className="text-[13px] font-bold font-mono" style={{ color: scoreColor }}>
                          {scan.score}/100
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className="text-[12px] font-bold font-mono"
                        style={{ color: scan.cve > 0 ? '#F59E0B' : '#9CA3AF' }}
                      >
                        {scan.cve ?? 0}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-md inline-block"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="py-3.5 text-right text-xs text-gray-500">{scan.date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
