import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { scanAPI } from '../lib/api'
import { Card, PageHeader, RelativeTime, toast, SkeletonCard, ScoreDelta, ServeurInjoignable } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'

const STATUS_MAP = {
  completed: { label: 'Terminé',  bg: '#D1FAE5', color: '#059669' },
  running:   { label: 'En cours', bg: '#E8F1FA', color: '#1F5C99' },
  critical:  { label: 'Critique', bg: '#FEE2E2', color: '#EF4444' },
}

// Colonnes triables du tableau. Le tri par date s'appuie sur l'identifiant,
// strictement croissant, plutôt que sur la date d'affichage qu'il faudrait
// analyser à chaque comparaison.
const COLONNES = [
  { cle: 'cible', label: 'Cible',  align: 'left',   tri: (a, b) => (a.scan.target || '').localeCompare(b.scan.target || '') },
  { cle: 'score', label: 'Score',  align: 'center', tri: (a, b) => (a.scan.score ?? -1) - (b.scan.score ?? -1) },
  { cle: 'cve',   label: 'CVE',    align: 'center', tri: (a, b) => (a.scan.cve ?? 0) - (b.scan.cve ?? 0) },
  { cle: null,    label: 'Statut', align: 'center' },
  { cle: 'date',  label: 'Date',   align: 'center', tri: (a, b) => a.scan.id - b.scan.id },
  { cle: null,    label: '',       align: 'right'  },
]

const TAILLES_PAGE = [10, 25, 50]

const TYPE_ICONS = {
  Domaine: Icons.domain,
  IP:      Icons.ip,
  URL:     Icons.url,
  GitHub:  Icons.github,
}

/* Relancer et supprimer, partagés par le tableau et par la liste en cartes */
function ScanActions({ scan, deletingId, rerunningId, confirmDeleteId, onRerun, onDelete }) {
  const isDeleting      = deletingId === scan.id
  const isRerunning     = rerunningId === scan.id
  const isPendingDelete = confirmDeleteId === scan.id

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={(e) => onRerun(e, scan)}
        disabled={isRerunning || isDeleting}
        title="Relancer le scan"
        className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-blue-50 disabled:opacity-40"
      >
        {isRerunning ? (
          <span className="spinner" style={{ width: 13, height: 13, borderTopColor: '#1F5C99', borderColor: 'rgba(31,92,153,0.2)' }} />
        ) : (
          cloneIcon(Icons.refresh, { size: 14, color: '#1F5C99' })
        )}
      </button>

      {isPendingDelete ? (
        <button
          onClick={(e) => onDelete(e, scan.id)}
          className="text-[11px] font-semibold px-2 py-1 rounded-md transition-colors"
          style={{ background: '#FEE2E2', color: '#DC2626' }}
        >
          Confirmer
        </button>
      ) : (
        <button
          onClick={(e) => onDelete(e, scan.id)}
          disabled={isDeleting || isRerunning}
          title="Supprimer le scan"
          className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-red-50 disabled:opacity-40"
        >
          {isDeleting ? (
            <span className="spinner" style={{ width: 13, height: 13, borderTopColor: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }} />
          ) : (
            cloneIcon(Icons.trash, { size: 14, color: '#EF4444' })
          )}
        </button>
      )}
    </div>
  )
}

export default function ScanListPage() {
  const navigate = useNavigate()
  const [scans, setScans]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [horsLigne, setHorsLigne]   = useState(false)
  const [search, setSearch]         = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [tri, setTri]         = useState({ cle: 'date', sens: 'desc' })
  const [page, setPage]       = useState(1)
  const [parPage, setParPage] = useState(TAILLES_PAGE[0])
  const [rerunningId, setRerunningId]         = useState(null)
  const [deletingId, setDeletingId]           = useState(null)

  const loadScans = useCallback(() => {
    setLoading(true)
    scanAPI.list()
      .then((res) => { setScans(res.data || []); setHorsLigne(false) })
      .catch(() => { setScans([]); setHorsLigne(true) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadScans() }, [loadScans])

  // Rester en page 4 après une recherche qui ne rend que trois résultats
  // afficherait une liste vide sans explication.
  useEffect(() => { setPage(1) }, [search, tri, parPage])

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

  // Évolution du score par cible (relances comprises), pour le badge de tendance.
  // Regroupé sur l'ensemble des scans, pas seulement ceux filtrés par la recherche.
  const historyByTarget = scans.reduce((acc, s) => {
    if (s.score === null || s.score === undefined) return acc
    ;(acc[s.target] ||= []).push(s)
    return acc
  }, {})

  // Dérivés calculés une fois : le tableau et les cartes affichent la même chose
  const lignes = filtered.map((scan) => {
    const isGithub = scan.type === 'github'
    const scoreMax = isGithub ? (scan.results?.score_max ?? 30) : 100
    // Delta affiché uniquement sur le scan le plus récent d'une cible, comparé à
    // celui juste avant lui (pas au tout premier de l'historique).
    const histo = (historyByTarget[scan.target] || []).slice().sort((a, b) => a.id - b.id)
    const rang  = histo.findIndex((h) => h.id === scan.id)
    return {
      scan,
      statut:     STATUS_MAP[scan.status] || STATUS_MAP.completed,
      typeIcon:   TYPE_ICONS[scan.typeLabel] || Icons.domain,
      scoreMax,
      scoreColor: scan.score >= (scoreMax * 0.8) ? '#10B981' : scan.score >= (scoreMax * 0.5) ? '#F59E0B' : '#EF4444',
      delta:      rang === histo.length - 1 && rang > 0 ? scan.score - histo[rang - 1].score : null,
    }
  })

  const colonneTriee = COLONNES.find((c) => c.cle === tri.cle)
  const triees = colonneTriee
    ? [...lignes].sort((a, b) => (tri.sens === 'asc' ? 1 : -1) * colonneTriee.tri(a, b))
    : lignes

  const pages   = Math.max(1, Math.ceil(triees.length / parPage))
  const courante = Math.min(page, pages)
  const debut   = (courante - 1) * parPage
  const visibles = triees.slice(debut, debut + parPage)

  const trierPar = (cle) => setTri((t) => ({
    cle,
    // Un nouveau critère part du plus pertinent : le plus récent, le plus haut.
    sens: t.cle === cle && t.sens === 'desc' ? 'asc' : 'desc',
  }))

  const actionsCommunes = {
    deletingId, rerunningId, confirmDeleteId,
    onRerun: handleRerun, onDelete: handleDelete,
  }

  return (
    <div>
      <PageHeader
        title="Tous les scans"
        subtitle={`${scans.length} scan${scans.length !== 1 ? 's' : ''} au total`}
      />

      <Card className="p-4 sm:p-[22px_26px]">
        {/* Search */}
        <div className="relative mb-5">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
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
        ) : horsLigne ? (
          <ServeurInjoignable quoi="vos scans" onReessayer={loadScans} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
              {cloneIcon(Icons.scan, { size: 26, color: '#1F5C99' })}
            </div>
            <div className="text-gray-600 font-semibold">
              {search ? 'Aucun résultat pour cette recherche' : 'Aucun scan effectué'}
            </div>
            {!search && (
              <div className="text-sm text-gray-500">Lancez votre premier scan depuis le dashboard.</div>
            )}
          </div>
        ) : (
          <>
            {/* Liste en cartes sous 640 px : quatre colonnes ne tiennent pas dans
                les 296 px utiles d'un téléphone de 360 px, même en en masquant deux */}
            <div className="flex flex-col gap-2 sm:hidden">
              {visibles.map(({ scan, statut, typeIcon, scoreMax, scoreColor, delta }) => (
                <div
                  key={scan.id}
                  onClick={() => navigate(`/scan-results/${scan.id}`)}
                  className="rounded-[var(--cg-radius)] border border-gray-200 p-3.5 transition-colors active:bg-gray-50"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      {cloneIcon(typeIcon, { size: 17, color: '#1F5C99' })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold font-mono truncate">{scan.target}</div>
                      <div className="text-[11px] text-gray-500">
                        {scan.typeLabel} · <RelativeTime date={scan.date} />
                      </div>
                    </div>
                    {scan.score !== null ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[13px] font-bold font-mono" style={{ color: scoreColor }}>
                          {scan.score}/{scoreMax}
                        </span>
                        {delta !== null && <ScoreDelta value={delta} />}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 flex-shrink-0">—</span>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-2.5">
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: statut.bg, color: statut.color }}
                    >
                      {statut.label}
                    </span>
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: scan.cve > 0 ? '#F59E0B' : '#9CA3AF' }}
                    >
                      {scan.cve ?? 0} CVE
                    </span>
                    <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                      <ScanActions scan={scan} {...actionsCommunes} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <table className="hidden w-full border-collapse sm:table">
              <thead>
                <tr className="border-b border-gray-200">
                  {COLONNES.map((c, i) => (
                    <th
                      key={i}
                      className="pb-3 text-[10.5px] font-bold text-gray-500 uppercase tracking-[0.08em]"
                      style={{ textAlign: c.align }}
                    >
                      {c.tri ? (
                        <button
                          onClick={() => trierPar(c.cle)}
                          title={`Trier par ${c.label.toLowerCase()}`}
                          className="inline-flex items-center gap-1 border-none bg-transparent p-0 uppercase tracking-[0.08em] text-[10.5px] font-bold transition-colors hover:text-gray-600"
                          style={{ color: tri.cle === c.cle ? '#1F5C99' : 'inherit', cursor: 'pointer' }}
                        >
                          {c.label}
                          {tri.cle !== c.cle
                            ? <ChevronsUpDown size={12} strokeWidth={2.5} className="opacity-40" />
                            : tri.sens === 'asc'
                              ? <ChevronUp   size={12} strokeWidth={2.5} />
                              : <ChevronDown size={12} strokeWidth={2.5} />}
                        </button>
                      ) : c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibles.map(({ scan, statut, typeIcon, scoreMax, scoreColor, delta }) => (
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
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold font-mono truncate max-w-[240px] xl:max-w-[420px]"
                            title={scan.target}>
                            {scan.target}
                          </div>
                          <div className="text-[11px] text-gray-500">{scan.typeLabel}</div>
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 text-center">
                      {scan.score !== null ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-[13px] font-bold font-mono" style={{ color: scoreColor }}>
                            {scan.score}/{scoreMax}
                          </span>
                          {delta !== null && (
                            <span title="Évolution par rapport au scan précédent de cette cible">
                              <ScoreDelta value={delta} />
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
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
                        style={{ background: statut.bg, color: statut.color }}
                      >
                        {statut.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 text-center text-xs text-slate-500">
                      <RelativeTime date={scan.date} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                      <ScanActions scan={scan} {...actionsCommunes} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination : la liste s'allonge d'un scan à chaque relance, et
                dérouler cent lignes pour retrouver un actif n'a pas de sens. */}
            <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                <span>
                  {debut + 1}–{Math.min(debut + parPage, triees.length)} sur {triees.length}
                </span>
                <span className="text-gray-300">·</span>
                <label className="flex items-center gap-1.5">
                  <select
                    value={parPage}
                    onChange={(e) => setParPage(Number(e.target.value))}
                    className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[12px] outline-none focus:border-blue-600"
                  >
                    {TAILLES_PAGE.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  par page
                </label>
              </div>

              {pages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(courante - 1)}
                    disabled={courante === 1}
                    title="Page précédente"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-35"
                  >
                    <ChevronLeft size={15} strokeWidth={2} />
                  </button>
                  <span className="px-2 text-[12.5px] text-gray-600">
                    Page <strong className="font-mono">{courante}</strong> sur <span className="font-mono">{pages}</span>
                  </span>
                  <button
                    onClick={() => setPage(courante + 1)}
                    disabled={courante === pages}
                    title="Page suivante"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-35"
                  >
                    <ChevronRight size={15} strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
