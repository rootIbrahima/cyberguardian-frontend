import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { scanAPI } from '../lib/api'
import { Card, PageHeader, RelativeTime, toast, SkeletonCard } from '../components/ui'
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
  const [scans, setScans]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [rerunningId, setRerunningId]         = useState(null)
  const [deletingId, setDeletingId]           = useState(null)

  const loadScans = useCallback(() => {
    setLoading(true)
    scanAPI.list()
      .then((res) => setScans(res.data || []))
      .catch(() => setScans([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadScans() }, [loadScans])

  // Click outside cancels pending delete confirmation
  useEffect(() => {
    if (!confirmDeleteId) return
    const handler = () => setConfirmDeleteId(null)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [confirmDeleteId])

  const handleDelete = async (e, scanId) => {
    e.stopPropagation()
    if (confirmDeleteId !== scanId) {
      setConfirmDeleteId(scanId)
      return
    }
    setConfirmDeleteId(null)
    setDeletingId(scanId)
    try {
      await scanAPI.delete(scanId)
      setScans((prev) => prev.filter((s) => s.id !== scanId))
      toast.success('Scan supprimé')
    } catch {
      toast.error('Impossible de supprimer le scan')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRerun = async (e, scan) => {
    e.stopPropagation()
    setRerunningId(scan.id)
    try {
      toast.info('Relancement en cours…')
      const res = await scanAPI.rerun(scan.id)
      const newScan = res.data
      navigate(`/scan-results/${newScan.id}`)
    } catch {
      toast.error('Impossible de relancer le scan')
      setRerunningId(null)
    }
  }

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
          <div className="space-y-3">
            {[1,2,3].map(i => <SkeletonCard key={i} lines={1} />)}
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
                {['Cible', 'Score', 'CVE', 'Statut', 'Date', ''].map((h, i) => (
                  <th
                    key={i}
                    className="pb-3 text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.08em]"
                    style={{ textAlign: i === 0 ? 'left' : i === 5 ? 'right' : 'center' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((scan) => {
                const s         = STATUS_MAP[scan.status] || STATUS_MAP.completed
                const typeIcon  = TYPE_ICONS[scan.typeLabel] || Icons.domain
                const isGithub  = scan.type === 'github'
                const scoreMax  = isGithub ? (scan.results?.score_max ?? 30) : 100
                const scoreColor = scan.score >= (scoreMax * 0.8) ? '#10B981' : scan.score >= (scoreMax * 0.5) ? '#F59E0B' : '#EF4444'
                const isDeleting  = deletingId === scan.id
                const isRerunning = rerunningId === scan.id
                const isPendingDelete = confirmDeleteId === scan.id

                return (
                  <tr
                    key={scan.id}
                    onClick={() => navigate(`/scan-results/${scan.id}`)}
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    {/* Cible */}
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

                    {/* Score */}
                    <td className="py-3.5 text-center">
                      {scan.score !== null ? (
                        <span className="text-[13px] font-bold font-mono" style={{ color: scoreColor }}>
                          {scan.score}/{scoreMax}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* CVE */}
                    <td className="py-3.5 text-center">
                      <span
                        className="text-[12px] font-bold font-mono"
                        style={{ color: scan.cve > 0 ? '#F59E0B' : '#9CA3AF' }}
                      >
                        {scan.cve ?? 0}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="py-3.5 text-center">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-md inline-block"
                        style={{ background: s.bg, color: s.color }}
                      >
                        {s.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 text-center text-xs text-slate-400">
                      <RelativeTime date={scan.date} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {/* Relancer */}
                        <button
                          onClick={(e) => handleRerun(e, scan)}
                          disabled={isRerunning || isDeleting}
                          title="Relancer le scan"
                          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-blue-50 disabled:opacity-40"
                        >
                          {isRerunning ? (
                            <span
                              className="spinner"
                              style={{ width: 13, height: 13, borderTopColor: '#1F5C99', borderColor: 'rgba(31,92,153,0.2)' }}
                            />
                          ) : (
                            cloneIcon(Icons.refresh, { size: 14, color: '#1F5C99' })
                          )}
                        </button>

                        {/* Supprimer */}
                        {isPendingDelete ? (
                          <button
                            onClick={(e) => handleDelete(e, scan.id)}
                            className="text-[11px] font-semibold px-2 py-1 rounded-md transition-colors"
                            style={{ background: '#FEE2E2', color: '#DC2626' }}
                          >
                            Confirmer
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleDelete(e, scan.id)}
                            disabled={isDeleting || isRerunning}
                            title="Supprimer le scan"
                            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-red-50 disabled:opacity-40"
                          >
                            {isDeleting ? (
                              <span
                                className="spinner"
                                style={{ width: 13, height: 13, borderTopColor: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}
                              />
                            ) : (
                              cloneIcon(Icons.trash, { size: 14, color: '#EF4444' })
                            )}
                          </button>
                        )}
                      </div>
                    </td>
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
