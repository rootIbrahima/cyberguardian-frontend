import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Card, Badge, Button, PageHeader } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import { scanAPI } from '../lib/api'

/* ─── Score Ring ─── */
function ScoreRing({ score, size = 110, stroke = 9 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  )
}

/* ─── Issue styles ─── */
const ISSUE_STYLES = {
  red:    { border: '#FEE2E2', bg: '#FEF2F2' },
  orange: { border: '#FED7AA', bg: '#FFF7ED' },
  yellow: { border: '#FEF3C7', bg: '#FEFCE8' },
}

const SEVERITY_BADGE = { HIGH: 'red', CRITICAL: 'red', MEDIUM: 'orange', LOW: 'yellow' }

/* ─── GitHub Findings Section ─── */
function GitHubSection({ scan }) {
  const [tab, setTab] = useState('bandit')

  const results    = scan?.results ?? {}
  const info       = results.github_info ?? {}
  const language   = (results.langage ?? info.language ?? '').toLowerCase()
  const isPython   = language === 'python'
  const isJsTs     = language === 'javascript' || language === 'typescript'

  const bandit     = results.bandit?.findings     ?? []
  const banditLoc  = results.bandit?.loc          ?? 0
  const banditErr  = results.bandit?.error        ?? ''
  const banditNote = results.bandit?.note         ?? ''
  const safety     = results.safety?.findings     ?? []
  const safetyPkg  = results.safety?.packages_checked ?? 0
  const safetyFile = results.safety?.requirements_file ?? ''
  const safetyErr  = results.safety?.error        ?? ''
  const safetyNote = results.safety?.note         ?? ''
  const truffle    = results.trufflehog?.findings ?? []
  const truffleErr = results.trufflehog?.error    ?? ''
  const npm        = results.npm_audit?.findings  ?? []
  const npmErr     = results.npm_audit?.error     ?? ''
  const npmSummary = results.npm_audit?.summary   ?? null
  const scoreMax   = results.score_max            ?? 30

  const total = bandit.length + safety.length + truffle.length + npm.length

  const TABS = [
    { key: 'bandit',    label: 'Bandit',     count: isPython ? bandit.length : null, color: '#EF4444', na: !isPython  },
    { key: 'safety',    label: 'Safety',     count: isPython ? safety.length : null, color: '#F59E0B', na: !isPython  },
    { key: 'npm',       label: 'npm audit',  count: isJsTs   ? npm.length    : null, color: '#22C55E', na: false, show: isJsTs },
    { key: 'trufflehog',label: 'TruffleHog', count: truffle.length,                 color: '#8B5CF6', na: false },
    { key: 'info',      label: 'Infos repo', count: null,                           color: '#3B8FDB', na: false },
  ].filter((t) => t.show !== false)

  const EmptyState = ({ msg }) => (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
      {cloneIcon(Icons.checkCircle, { size: 28, color: '#10B981' })}
      <span className="text-sm">{msg}</span>
    </div>
  )
  const ErrState = ({ err }) => (
    <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-4 font-mono">{err}</div>
  )
  const NaState = ({ note }) => {
    const detectedLang = (results.langage || info.language || '').trim()
    const isNpmRepo    = isJsTs
    const msg = detectedLang
      ? `Bandit et Safety non applicables — projet ${detectedLang}${isNpmRepo ? ' — npm audit utilisé à la place' : ''}`
      : note
    return (
      <div className="flex items-start gap-3 py-5 px-4 rounded-lg" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <span className="text-blue-500 text-[16px] flex-shrink-0 mt-px">ℹ</span>
        <span className="text-[13px] text-blue-700 leading-relaxed">{msg}</span>
      </div>
    )
  }

  return (
    <Card className="p-[22px_24px] mb-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #111827, #374151)' }}>
          {cloneIcon(Icons.github, { color: '#fff', size: 18 })}
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold">Résultats GitHub Scan</div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">
            {scan?.target} · {results.langage || info.language || 'N/A'} · {scan?.score ?? 0}/{scoreMax}
          </div>
        </div>
        <Badge color={total > 0 ? 'red' : 'green'}>{total} finding{total !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 border-b border-gray-100 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: tab === t.key ? t.color + '18' : 'transparent',
              color: tab === t.key ? t.color : '#6B7280',
              border: `1px solid ${tab === t.key ? t.color + '40' : 'transparent'}`,
            }}
          >
            {t.label}
            {t.na
              ? <span className="text-[10px] px-1.5 py-px rounded-full font-bold" style={{ background: '#E5E7EB', color: '#9CA3AF' }}>N/A</span>
              : t.count !== null && (
                <span className="text-[10px] px-1.5 py-px rounded-full font-bold"
                  style={{ background: t.color + '20', color: t.color }}>
                  {t.count}
                </span>
              )
            }
          </button>
        ))}
      </div>

      {/* Bandit */}
      {tab === 'bandit' && (
        banditErr  ? <ErrState err={banditErr} /> :
        banditNote ? <NaState note={banditNote} /> :
        bandit.length === 0 ? <EmptyState msg={`Aucune vulnérabilité détectée${banditLoc ? ` — ${banditLoc} lignes analysées` : ''}`} /> :
        <div className="flex flex-col gap-3">
          {banditLoc > 0 && <div className="text-[11px] text-gray-400 mb-1">{banditLoc} lignes de code analysées</div>}
          {bandit.map((f, i) => (
            <div key={i} className="p-3.5 rounded-[9px]"
              style={{ background: '#FEF2F2', border: '1px solid #FEE2E2' }}>
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <span className="text-[13px] font-semibold text-gray-900">{f.issue}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge color={SEVERITY_BADGE[f.severity] || 'gray'}>{f.severity}</Badge>
                  {f.cwe && <span className="text-[10px] text-gray-400 font-mono">{f.cwe}</span>}
                </div>
              </div>
              <div className="font-mono text-[11px] text-gray-500 mb-1.5">
                {f.file} · ligne {f.line}
              </div>
              {f.code && (
                <div className="font-mono text-[11.5px] px-3 py-2 rounded-md"
                  style={{ background: '#1e1e2e', color: '#f38ba8' }}>
                  {f.code}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Safety */}
      {tab === 'safety' && (
        safetyErr  ? <ErrState err={safetyErr} /> :
        safetyNote ? <NaState note={safetyNote} /> :
        safety.length === 0 ? (
          <EmptyState msg={
            safetyPkg > 0
              ? `${safetyPkg} dépendances vérifiées — aucune CVE connue${safetyFile ? ` (${safetyFile})` : ''}`
              : 'Aucun fichier requirements.txt trouvé'
          } />
        ) : (
          <div className="flex flex-col gap-3">
            {safetyFile && <div className="text-[11px] text-gray-400 mb-1">{safetyFile} · {safetyPkg} dépendances</div>}
            {safety.map((f, i) => (
              <div key={i} className="p-3.5 rounded-[9px]"
                style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <div>
                    <span className="font-mono text-[13px] font-bold text-gray-900">{f.package}</span>
                    <span className="font-mono text-[12px] text-gray-500 ml-2">v{f.version}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge color={SEVERITY_BADGE[f.severity] || 'gray'}>{f.severity}</Badge>
                    <span className="text-[10px] font-mono text-red-600 font-semibold">{f.cve}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600">{f.desc}</div>
                <div className="mt-2 text-[11px] text-gray-400">
                  → <span className="font-mono">pip install {f.package} --upgrade</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* npm audit */}
      {tab === 'npm' && (
        npmErr ? <ErrState err={npmErr} /> :
        npm.length === 0 ? (
          <EmptyState msg={npmSummary ? 'Aucune vulnérabilité npm détectée' : 'Aucun package.json trouvé ou npm non disponible'} />
        ) : (
          <div className="flex flex-col gap-3">
            {npmSummary && (
              <div className="flex gap-4 text-[11px] font-mono mb-1">
                {[['critical','#EF4444'],['high','#F97316'],['moderate','#F59E0B'],['low','#6B7280']].map(([k,c]) => (
                  npmSummary[k] > 0 && (
                    <span key={k} className="font-semibold" style={{ color: c }}>
                      {npmSummary[k]} {k}
                    </span>
                  )
                ))}
              </div>
            )}
            {npm.map((f, i) => {
              const sevColor = { critical: '#EF4444', high: '#F97316', moderate: '#F59E0B', low: '#6B7280' }
              const sevBg    = { critical: '#FEF2F2', high: '#FFF7ED', moderate: '#FEFCE8', low: '#F9FAFB' }
              const sevBorder= { critical: '#FEE2E2', high: '#FED7AA', moderate: '#FEF3C7', low: '#E5E7EB' }
              const s = f.severity?.toLowerCase() || 'low'
              return (
                <div key={i} className="p-3.5 rounded-[9px]"
                  style={{ background: sevBg[s] || '#F9FAFB', border: `1px solid ${sevBorder[s] || '#E5E7EB'}` }}>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="font-mono text-[13px] font-bold text-gray-900">{f.package}</span>
                    <Badge color={s === 'critical' || s === 'high' ? 'red' : s === 'moderate' ? 'orange' : 'gray'}>
                      {f.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-700 mb-1">{f.issue}</div>
                  {f.range && <div className="text-[11px] text-gray-400 font-mono">Versions affectées : {f.range}</div>}
                  {f.fix && <div className="text-[11px] text-green-600 mt-1 font-semibold">→ Correctif disponible : npm audit fix</div>}
                </div>
              )
            })}
          </div>
        )
      )}

      {/* TruffleHog */}
      {tab === 'trufflehog' && (
        truffleErr ? <ErrState err={truffleErr} /> :
        truffle.length === 0 ? <EmptyState msg="Aucun secret exposé détecté" /> :
        <div className="flex flex-col gap-3">
          {truffle.map((f, i) => (
            <div key={i} className="p-3.5 rounded-[9px]"
              style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[13px] font-semibold" style={{ color: '#6D28D9' }}>{f.type}</span>
                <Badge color={f.verified ? 'red' : 'orange'}>
                  {f.verified ? 'Secret vérifié actif' : 'Possible secret'}
                </Badge>
              </div>
              <div className="font-mono text-[11px] text-gray-500 mb-1.5">
                {f.file} · ligne {f.line}
              </div>
              <div className="font-mono text-[11.5px] px-3 py-2 rounded-md"
                style={{ background: '#1e1e2e', color: '#cba6f7' }}>
                {f.value}
              </div>
              {f.verified && (
                <div className="mt-2 text-xs text-red-600 font-semibold">
                  Ce secret est actif. Révoquez-le immédiatement sur la plateforme concernée.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Infos repo */}
      {tab === 'info' && (
        info.error ? <ErrState err={info.error} /> : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {[
              { label: 'Visibilité',      value: info.visibility ?? '—' },
              { label: 'Langage',         value: info.language   ?? '—' },
              { label: 'Licence',         value: info.license    ?? '—' },
              { label: 'Branche défaut',  value: info.default_branch ?? '—' },
              { label: 'Branches',        value: info.branches   ?? '—' },
              { label: 'Contributeurs',   value: info.contributors ?? '—' },
              { label: 'Stars',           value: info.stars      ?? '—' },
              { label: 'Forks',           value: info.forks      ?? '—' },
              { label: 'Issues ouvertes', value: info.open_issues ?? '—' },
              { label: 'Taille',          value: info.size_kb ? `${info.size_kb} KB` : '—' },
              { label: 'Créé le',         value: info.created_at ?? '—' },
              { label: 'Mis à jour',      value: info.updated_at ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 text-[12.5px]">
                <span className="text-gray-500">{label}</span>
                <span className="font-mono font-semibold text-gray-800">{String(value)}</span>
              </div>
            ))}
            {info.description && (
              <div className="col-span-2 pt-2 text-[12px] text-gray-600 italic">"{info.description}"</div>
            )}
          </div>
        )
      )}
    </Card>
  )
}

/* ─── Main Page ─── */
export default function ScanResultsPage() {
  const { id }   = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [scan, setScan]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [question, setQuestion] = useState('')
  const [conversations, setConversations] = useState([])
  const [askingAI, setAskingAI] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfStep, setPdfStep]   = useState(0)

  const PDF_STEPS = ['Connexion…', 'Analyse IA en cours…', 'Rédaction du rapport…', 'Mise en forme du PDF…']

  useEffect(() => {
    if (!id || id === 'demo') { setLoading(false); return }
    scanAPI.get(id)
      .then((res) => {
        setScan(res.data)
        setConversations(res.data?.conversations || [])
        localStorage.setItem('cg-last-scan', id)
      })
      .catch(() => setScan(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleAskAI = async () => {
    if (!question.trim() || askingAI) return
    setAskingAI(true)
    const q = question
    setQuestion('')

    // Ajoute l'entrée immédiatement avec réponse vide
    setConversations((prev) => [...prev, { question: q, answer: '', date: '' }])

    try {
      const resp = await fetch(`http://localhost:8001/scans/${id}/ask`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ question: q }),
      })

      const reader  = resp.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))
          if (data.token) {
            setConversations((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                answer: updated[updated.length - 1].answer + data.token,
              }
              return updated
            })
          }
          if (data.done) {
            setConversations((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                date: new Date().toLocaleString('fr-FR'),
              }
              return updated
            })
          }
          if (data.error) {
            setConversations((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = { ...updated[updated.length - 1], answer: `Erreur : ${data.error}`, date: new Date().toLocaleString('fr-FR') }
              return updated
            })
          }
        }
      }
    } catch {
      setConversations((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], answer: 'Service IA indisponible.', date: new Date().toLocaleString('fr-FR') }
        return updated
      })
    } finally {
      setAskingAI(false)
    }
  }

  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    setPdfStep(0)
    const timers = [
      setTimeout(() => setPdfStep(1), 1500),
      setTimeout(() => setPdfStep(2), 6000),
      setTimeout(() => setPdfStep(3), 14000),
    ]
    try {
      const res = await scanAPI.downloadPDF(id || 1)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a   = document.createElement('a')
      a.href    = url
      a.download = `cyberguardian-rapport-${scan?.target || 'scan'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Rapport PDF non disponible — backend hors ligne.')
    } finally {
      timers.forEach(clearTimeout)
      setPdfLoading(false)
      setPdfStep(0)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="spinner" style={{ width: 24, height: 24, borderTopColor: '#1F5C99', borderColor: 'rgba(31,92,153,0.2)' }} />
        <span className="ml-3 text-gray-500 text-sm">Chargement du rapport…</span>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1" style={{ background: '#EFF6FF' }}>
          {cloneIcon(Icons.scan, { size: 28, color: '#1F5C99' })}
        </div>
        <div className="text-gray-700 font-semibold text-[15px]">Aucun scan disponible</div>
        <div className="text-sm text-gray-400 text-center max-w-xs">
          Lancez votre premier scan depuis le dashboard pour voir les résultats ici.
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer border-none"
          style={{ background: '#1F5C99' }}
        >
          Aller au dashboard
        </button>
      </div>
    )
  }

  const isGithub   = scan?.type === 'github'
  const scoreMax   = isGithub ? (scan?.results?.score_max ?? 30) : 100
  const score      = scan?.score ?? 0
  const scorePct   = Math.round((score / scoreMax) * 100)
  const scoreColor = scorePct >= 80 ? '#10B981' : scorePct >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate('/scan-results')}
        className="flex items-center gap-1.5 text-gray-500 text-[12.5px] mb-2 bg-transparent border-none cursor-pointer p-0 hover:text-gray-700 transition-colors"
      >
        {cloneIcon(Icons.arrowLeft, { size: 14, color: 'currentColor' })}
        Tous les scans
      </button>

      <PageHeader title="Résultats du scan" subtitle={`${scan?.target} · ${scan?.date || ''}`} />

      {/* Target hero card */}
      <Card className="p-7 mb-5 flex items-center gap-6">
        <div className="relative flex-shrink-0" style={{ width: 110, height: 110 }}>
          <ScoreRing score={scorePct} size={110} stroke={9} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[30px] font-bold font-mono tracking-[-0.03em]" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="text-[10px] text-gray-400">/ {scoreMax}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <Badge color="blue" icon={isGithub ? Icons.github : Icons.domain}>
              {isGithub ? 'GitHub' : scan?.typeLabel || 'Domaine'}
            </Badge>
            <Badge color={scorePct >= 80 ? 'green' : scorePct >= 50 ? 'orange' : 'red'}>
              {scorePct >= 80 ? 'Bon · Surveillance recommandée' : scorePct >= 50 ? 'Niveau moyen · Action requise' : 'Critique · Action urgente'}
            </Badge>
          </div>
          <div className="text-[26px] font-bold font-mono tracking-[-0.02em]">{scan?.target}</div>
          <div className="text-[13px] text-gray-500 mt-1">
            Analysé le {scan?.date} · {isGithub ? 'Analyse GitHub complète — Bandit · Safety · TruffleHog' : 'Analyse SSL/TLS complète'}
          </div>
          <div className="flex gap-6 mt-3.5 text-xs flex-wrap">
            {!isGithub && (
              <>
                <div><span className="text-gray-400">Problèmes</span> <strong className="font-mono ml-1" style={{ color: '#EF4444' }}>{scan?.vulns ?? 0}</strong></div>
                <div><span className="text-gray-400">CVE</span> <strong className="font-mono ml-1" style={{ color: '#F59E0B' }}>{scan?.cve ?? 0}</strong></div>
              </>
            )}
            {isGithub && (
              <>
                <div><span className="text-gray-400">Bandit</span> <strong className="font-mono ml-1 text-red-500">{scan?.results?.bandit?.findings?.length ?? 0}</strong></div>
                <div><span className="text-gray-400">Safety CVE</span> <strong className="font-mono ml-1 text-orange-500">{scan?.results?.safety?.findings?.length ?? 0}</strong></div>
                <div><span className="text-gray-400">Secrets</span> <strong className="font-mono ml-1" style={{ color: '#8B5CF6' }}>{scan?.results?.trufflehog?.findings?.length ?? 0}</strong></div>
                <div><span className="text-gray-400">Langue</span> <strong className="font-mono ml-1 text-blue-600">{scan?.results?.langage || scan?.results?.github_info?.language || '—'}</strong></div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="primary" icon={pdfLoading ? null : Icons.download} onClick={handleDownloadPDF} disabled={pdfLoading}>
            {pdfLoading
              ? <><span className="spinner mr-2" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />{PDF_STEPS[pdfStep]}</>
              : 'Télécharger PDF'}
          </Button>
          <Button variant="secondary" icon={Icons.experts} onClick={() => navigate('/experts')}>
            Contacter un expert
          </Button>
        </div>
      </Card>

      {/* GitHub findings */}
      {isGithub && <GitHubSection scan={scan} />}

      {/* Breakdown + Issues (EASM only) */}
      {!isGithub && (
        <div className="grid grid-cols-2 gap-[18px] mb-5">
          {/* SSL breakdown — données réelles du backend */}
          <Card className="p-[22px_24px]">
            <div className="text-sm font-semibold mb-4">Résultats SSL/TLS</div>
            {(() => {
              const ssl = scan?.results?.ssl
              if (!ssl) return <div className="text-sm text-gray-400">Données SSL non disponibles.</div>
              const pts = ssl.score ?? 0
              const max = 25
              const pct = (pts / max) * 100
              const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'
              const rows = [
                { label: 'Score SSL',       value: `${pts} / ${max} pts`,                   detail: `Grade ${ssl.grade}` },
                { label: 'Version TLS',     value: ssl.tls_version  || '—',                 detail: ssl.tls_version === 'TLSv1.3' ? 'Optimal' : 'Mettre à jour recommandé' },
                { label: 'Certificat',      value: ssl.valid ? 'Valide' : 'Invalide',        detail: ssl.issued_by || '—' },
                { label: 'Expiration',      value: ssl.expiry_date  || '—',                  detail: ssl.expired ? 'Expiré !' : `${ssl.days_until_expiry} jours restants` },
                { label: 'Auto-signé',      value: ssl.self_signed  ? 'Oui' : 'Non',         detail: ssl.self_signed ? 'Non approuvé par les navigateurs' : 'CA reconnue' },
              ]
              return (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[13px] font-medium">Score SSL/TLS</span>
                      <span className="text-[13px] font-bold font-mono" style={{ color }}>{pts}/{max}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="text-[11.5px] text-gray-500 mt-1.5">Grade {ssl.grade} · {ssl.cipher_suite || '—'}</div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                    {rows.slice(1).map((r) => (
                      <div key={r.label} className="flex justify-between items-center text-[12px]">
                        <span className="text-gray-500 font-medium">{r.label}</span>
                        <div className="text-right">
                          <span className="font-mono font-semibold text-gray-800">{r.value}</span>
                          <span className="text-gray-400 ml-2 text-[11px]">{r.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </Card>

          {/* Issues — données réelles du backend */}
          <Card className="p-[22px_24px] flex flex-col">
            {(() => {
              const issues = scan?.issues ?? []
              return (
                <>
                  <div className="flex justify-between items-center mb-3.5">
                    <div className="text-sm font-semibold">Problèmes détectés</div>
                    <Badge color={issues.length > 0 ? 'red' : 'green'}>
                      {issues.length > 0 ? `${issues.length} problème${issues.length > 1 ? 's' : ''}` : 'Aucun problème'}
                    </Badge>
                  </div>
                  {issues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8">
                      {cloneIcon(Icons.checkCircle, { size: 36, color: '#10B981' })}
                      <div className="text-sm text-gray-500">Aucun problème SSL détecté</div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 overflow-auto">
                      {issues.map((iss, idx) => {
                        const st = ISSUE_STYLES[iss.color] || ISSUE_STYLES.yellow
                        return (
                          <div key={idx} className="p-3 rounded-[9px]"
                            style={{ border: `1px solid ${st.border}`, background: st.bg }}>
                            <div className="flex justify-between items-start gap-2.5 mb-1">
                              <div className="text-[13px] font-semibold text-gray-900">{iss.title}</div>
                              <Badge color={iss.color}>{iss.severity}</Badge>
                            </div>
                            <div className="text-xs text-gray-600 leading-relaxed">{iss.desc}</div>
                            <div className="text-[10.5px] text-gray-500 mt-1.5 font-mono">{iss.tool}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )
            })()}
          </Card>
        </div>
      )}

      {/* CVE Section */}
      {!isGithub && (() => {
        const cves   = scan?.results?.cves ?? []
        const banner = scan?.results?.server_banner ?? ''
        if (cves.length === 0) return null
        const SEV_COLOR = { CRITICAL: '#EF4444', HIGH: '#EF4444', MEDIUM: '#F59E0B', LOW: '#6B7280' }
        const SEV_BG    = { CRITICAL: '#FEF2F2', HIGH: '#FEF2F2', MEDIUM: '#FFF7ED', LOW: '#F9FAFB' }
        const SEV_BORDER= { CRITICAL: '#FEE2E2', HIGH: '#FEE2E2', MEDIUM: '#FED7AA', LOW: '#E5E7EB' }
        return (
          <Card className="p-[22px_24px] mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)' }}>
                {cloneIcon(Icons.alert, { color: '#EF4444', size: 18 })}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold">CVE identifiées</div>
                {banner && (
                  <div className="text-xs text-gray-500 font-mono mt-0.5">Serveur détecté : {banner}</div>
                )}
              </div>
              <Badge color="red">{cves.length} CVE</Badge>
            </div>
            <div className="flex flex-col gap-2.5">
              {cves.map((cve, i) => (
                <div key={i} className="p-3 rounded-[9px]"
                  style={{ background: SEV_BG[cve.severity] || '#F9FAFB', border: `1px solid ${SEV_BORDER[cve.severity] || '#E5E7EB'}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-[12.5px] font-medium text-gray-800 leading-snug">{cve.title}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {cve.cvss && (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
                          style={{ background: (SEV_COLOR[cve.severity] || '#6B7280') + '18', color: SEV_COLOR[cve.severity] || '#6B7280' }}>
                          CVSS {cve.cvss}
                        </span>
                      )}
                      <Badge color={cve.severity === 'HIGH' || cve.severity === 'CRITICAL' ? 'red' : cve.severity === 'MEDIUM' ? 'orange' : 'gray'}>
                        {cve.severity}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-1.5 font-mono text-[11px] text-gray-400">{cve.id}</div>
                </div>
              ))}
            </div>
          </Card>
        )
      })()}

      {/* AI Report */}
      <Card className="p-7 mb-5">
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
            {cloneIcon(Icons.sparkles, { color: '#fff', size: 20 })}
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold">Analyse par intelligence artificielle</div>
            <div className="text-xs text-gray-500 mt-0.5">Posez vos questions sur les résultats de ce scan</div>
          </div>
        </div>

        <div className="text-[13.5px] text-gray-700 leading-[1.7] p-[18px_20px] bg-gray-50 rounded-[10px] border border-gray-100 mb-4">
          <strong className="text-gray-900">Rapport automatique</strong>
          <br />
          Le scan de{' '}
          <code className="bg-white px-1.5 py-px rounded border border-gray-200 text-[12px] font-mono">{scan?.target}</code>{' '}
          révèle une posture de sécurité{' '}
          <strong style={{ color: scoreColor }}>
            {scorePct >= 80 ? `bonne (${score}/${scoreMax})` : scorePct >= 50 ? `moyenne (${score}/${scoreMax})` : `critique (${score}/${scoreMax})`}
          </strong>
          {scorePct < 80 ? ' qui nécessite votre attention.' : '.'}
          <br /><br />
          {(() => {
            /* ── GitHub report ─────────────────────────────────── */
            if (isGithub) {
              const r          = scan?.results ?? {}
              const lang       = r.langage || r.github_info?.language || 'N/A'
              const banditF    = r.bandit?.findings    ?? []
              const safetyF    = r.safety?.findings    ?? []
              const truffleF   = r.trufflehog?.findings ?? []
              const npmF       = r.npm_audit?.findings  ?? []
              const banditHigh = banditF.filter((f) => f.severity === 'HIGH').length
              const secrets    = truffleF.length
              const cveCount   = safetyF.length + npmF.length

              const lines = []

              if (score === scoreMax) {
                lines.push(<>Le dépôt <strong>{lang}</strong> obtient un score parfait de <strong>{score}/{scoreMax}</strong>. Aucune vulnérabilité critique détectée.</>)
                lines.push(<>Continuez à surveiller les dépendances régulièrement et activez les alertes Dependabot sur GitHub pour être notifié automatiquement lors de nouvelles CVE.</>)
              } else {
                lines.push(<>Le dépôt est principalement écrit en <strong>{lang}</strong>. Score de sécurité : <strong style={{ color: scoreColor }}>{score}/{scoreMax}</strong>.</>)

                if (secrets > 0) {
                  lines.push(<><strong style={{ color: '#EF4444' }}>⚠ {secrets} secret{secrets > 1 ? 's' : ''} exposé{secrets > 1 ? 's' : ''} détecté{secrets > 1 ? 's' : ''}</strong> — ceci est la priorité absolue. Révoquez immédiatement les tokens concernés sur les plateformes correspondantes (GitHub, AWS, etc.) et ajoutez ces fichiers au <code className="bg-white px-1 rounded border border-gray-200 text-[11px]">.gitignore</code>.</>)
                }

                if (cveCount > 0) {
                  const pkgManager = npmF.length > 0 ? 'npm audit fix' : 'pip install --upgrade'
                  lines.push(<><strong>{cveCount} CVE</strong> détectée{cveCount > 1 ? 's' : ''} dans les dépendances. Exécutez <code className="bg-white px-1 rounded border border-gray-200 text-[11px] font-mono">{pkgManager}</code> pour corriger les vulnérabilités automatiquement corrigeables.</>)
                }

                if (banditHigh > 0) {
                  lines.push(<><strong>{banditHigh} problème{banditHigh > 1 ? 's' : ''} critique{banditHigh > 1 ? 's' : ''}</strong> de code Python détecté{banditHigh > 1 ? 's' : ''} par Bandit (mots de passe codés en dur, injection SQL, eval sur entrée utilisateur…). Consultez l'onglet Bandit pour les détails et les corrections.</>)
                }

                if (secrets === 0 && cveCount === 0 && banditF.length === 0 && npmF.length === 0) {
                  lines.push(<>Aucune vulnérabilité critique détectée dans les catégories analysées. Maintenez cette posture en activant les mises à jour automatiques de dépendances.</>)
                }
              }

              return lines.map((line, i) => (
                <span key={i}>{line}{i < lines.length - 1 && <><br /><br /></>}</span>
              ))
            }

            /* ── EASM (SSL) report ─────────────────────────────── */
            const ssl    = scan?.results?.ssl
            const issues = scan?.issues ?? []

            if (!ssl) return 'Aucune donnée SSL disponible pour ce scan.'

            const lines = []

            if (!ssl.valid) {
              lines.push(<>Le certificat SSL est <strong>invalide</strong> — les navigateurs bloqueront l'accès au site. Installez un certificat signé par une autorité reconnue (Let's Encrypt est gratuit).</>)
            } else if (ssl.expired) {
              lines.push(<>Le certificat SSL est <strong>expiré</strong>. Les visiteurs verront une alerte de sécurité. Renouvelez-le immédiatement.</>)
            } else if (ssl.days_until_expiry <= 30) {
              lines.push(<>Le certificat expire dans <strong>{ssl.days_until_expiry} jours</strong>. Anticipez le renouvellement pour éviter une interruption de service.</>)
            } else {
              lines.push(<>Le certificat SSL est valide, émis par <strong>{ssl.issued_by || 'une CA reconnue'}</strong>, et expire le <strong>{ssl.expiry_date}</strong> ({ssl.days_until_expiry} jours).</>)
            }

            if (ssl.self_signed) {
              lines.push(<>Le certificat est <strong>auto-signé</strong> — non approuvé par les navigateurs. Remplacez-le par un certificat d'une CA publique.</>)
            }

            if (ssl.tls_version && ['TLSv1', 'TLSv1.1'].includes(ssl.tls_version)) {
              lines.push(<>La version <strong>{ssl.tls_version}</strong> est obsolète et vulnérable. Activez uniquement TLS 1.2 et TLS 1.3 sur votre serveur.</>)
            } else if (ssl.tls_version) {
              lines.push(<>La version <strong>{ssl.tls_version}</strong> est utilisée — {ssl.tls_version === 'TLSv1.3' ? 'configuration optimale.' : 'TLS 1.3 serait préférable pour une sécurité maximale.'}</>)
            }

            if (issues.length === 0) {
              lines.push(<>Aucun problème SSL détecté. La configuration est correcte. Maintenez le renouvellement automatique du certificat actif.</>)
            }

            return lines.map((line, i) => (
              <span key={i}>{line}{i < lines.length - 1 && <><br /><br /></>}</span>
            ))
          })()}
        </div>

        {conversations.length > 0 && (
          <div className="flex flex-col gap-3 mb-4">
            {conversations.map((c, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-gray-600">
                    Q
                  </div>
                  <div className="flex-1 px-3 py-2 rounded-[9px] bg-gray-100 text-[13px] text-gray-800">
                    {c.question}
                  </div>
                </div>
                <div className="flex items-start gap-2.5 pl-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)' }}>
                    IA
                  </div>
                  <div className="flex-1 px-3 py-2 rounded-[9px] text-[13px] text-gray-700 leading-relaxed"
                    style={{ background: '#F3F8FD', border: '1px solid #E8F1FA' }}>
                    {c.answer
                      ? <>{c.answer}{askingAI && i === conversations.length - 1 && <span className="inline-block w-[2px] h-[13px] bg-purple-400 ml-0.5 animate-pulse" />}</>
                      : <span className="flex items-center gap-1.5 text-gray-400"><span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#8B5CF6', borderColor: 'rgba(139,92,246,0.2)' }} />En train de réfléchir…</span>
                    }
                    {c.date && <div className="text-[10px] text-gray-400 mt-1.5">{c.date}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            placeholder="Poser une question à l'IA sur votre rapport…"
            className="flex-1 px-4 py-[11px] rounded-[10px] border border-gray-300 text-[13.5px] outline-none transition-all focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
          />
          <Button variant="primary" icon={askingAI ? null : Icons.send} onClick={handleAskAI} disabled={askingAI}>
            {askingAI ? <><span className="spinner mr-2" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />En cours…</> : 'Envoyer'}
          </Button>
        </div>

        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          {(() => {
            const ssl    = scan?.results?.ssl
            const issues = scan?.issues ?? []
            if (isGithub) {
              const r      = scan?.results ?? {}
              const ghSugg = []
              if ((r.trufflehog?.findings ?? []).length > 0)  ghSugg.push('Comment révoquer un token exposé sur GitHub ?')
              if ((r.safety?.findings    ?? []).length > 0)   ghSugg.push('Comment mettre à jour les dépendances Python vulnérables ?')
              if ((r.npm_audit?.findings ?? []).length > 0)   ghSugg.push('Comment corriger les vulnérabilités npm ?')
              if ((r.bandit?.findings    ?? []).length > 0)   ghSugg.push("Comment corriger une injection SQL dans le code ?")
              if (ghSugg.length === 0) ghSugg.push('Comment maintenir un score de sécurité GitHub parfait ?', 'Quels outils de CI/CD recommandes-tu pour la sécurité ?')
              return ghSugg.slice(0, 3)
            }
            const suggestions = [`Comment améliorer le score SSL de ${scan?.target} ?`]
            if (ssl && !ssl.valid)                          suggestions.push('Comment obtenir un certificat SSL gratuit ?')
            if (ssl && ssl.tls_version === 'TLSv1.1')      suggestions.push('Comment désactiver TLS 1.1 ?')
            if (ssl && ssl.self_signed)                     suggestions.push('Comment remplacer un certificat auto-signé ?')
            if (ssl && ssl.days_until_expiry <= 30)         suggestions.push('Comment renouveler un certificat SSL ?')
            if (issues.length === 0)                        suggestions.push('Comment maintenir une bonne posture SSL ?')
            return suggestions.slice(0, 3)
          })().map((q) => (
            <button key={q} onClick={() => setQuestion(q)}
              className="px-3 py-1 rounded-[16px] border border-gray-200 bg-white text-[11.5px] text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
              {q}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}