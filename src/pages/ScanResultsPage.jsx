import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Card, Badge, Button, PageHeader, SeverityBadge, Skeleton, RelativeTime, CopyValue, toast } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import { scanAPI, API_BASE } from '../lib/api'

/* ─── Markdown renderer (LLM responses) ─── */
function parseBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p)
}

function renderMd(text) {
  if (!text) return null
  const lines  = text.split('\n')
  const result = []
  let listBuf  = []

  const flushList = () => {
    if (!listBuf.length) return
    result.push(
      <ul key={`ul-${result.length}`} className="mt-1 mb-2 flex flex-col gap-[3px]">
        {listBuf.map((item, j) => (
          <li key={j} className="flex gap-2 items-start text-slate-700">
            <span className="text-blue-500 mt-[2px] flex-shrink-0">•</span>
            <span>{parseBold(item)}</span>
          </li>
        ))}
      </ul>
    )
    listBuf = []
  }

  lines.forEach((raw, i) => {
    const line = raw.trimEnd()

    // Heading: ## Title or **Title** alone on a line
    if (/^#{1,3}\s/.test(line)) {
      flushList()
      const txt = line.replace(/^#{1,3}\s+/, '')
      result.push(<div key={i} className="font-semibold text-slate-800 text-[13.5px] mt-3 mb-0.5">{parseBold(txt)}</div>)
      return
    }
    if (/^\*\*[^*]+\*\*[:：]?\s*$/.test(line.trim())) {
      flushList()
      result.push(<div key={i} className="font-semibold text-slate-800 text-[13.5px] mt-3 mb-0.5">{line.replace(/\*\*/g, '')}</div>)
      return
    }

    // List item: * item or - item
    if (/^[\*\-]\s/.test(line.trim())) {
      listBuf.push(line.replace(/^[\s\*\-]+/, ''))
      return
    }

    // Empty line, paragraph break
    if (!line.trim()) {
      flushList()
      if (result.length && result[result.length - 1]?.type !== 'br') {
        result.push(<br key={`br-${i}`} />)
      }
      return
    }

    // Normal line
    flushList()
    result.push(<span key={i} className="block leading-relaxed">{parseBold(line)}</span>)
  })

  flushList()
  return <div className="flex flex-col gap-0.5">{result}</div>
}

/* ─── Score Ring ─── */
function ScoreRing({ score, size = 110, stroke = 9 }) {
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color  = score >= 80 ? '#1A7A4A' : score >= 50 ? '#854F0B' : '#991B1B'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
    </svg>
  )
}

/* ─── Issue styles ─── */
const ISSUE_STYLES = {
  red:    { border: '#FEE2E2', bg: '#FEF2F2' },
  orange: { border: '#FED7AA', bg: '#FFF7ED' },
  yellow: { border: '#FEF3C7', bg: '#FEFCE8' },
  blue:   { border: '#BFDBFE', bg: '#EFF6FF' },
}


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
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
      {cloneIcon(Icons.checkCircle, { size: 28, color: '#10B981' })}
      <span className="text-sm">{msg}</span>
    </div>
  )
  const ErrState = ({ err }) => (
    <div className="text-xs text-slate-400 bg-slate-50 rounded-[var(--cg-radius)] p-4 font-mono">{err}</div>
  )
  const NaState = ({ note }) => {
    const detectedLang = (results.langage || info.language || '').trim()
    const isNpmRepo    = isJsTs
    const msg = detectedLang
      ? `Bandit et Safety non applicables : projet ${detectedLang}${isNpmRepo ? ', npm audit utilisé à la place' : ''}`
      : note
    return (
      <div className="flex items-start gap-3 py-5 px-4 rounded-lg" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <span className="text-blue-500 text-[16px] flex-shrink-0 mt-px">ℹ</span>
        <span className="text-[13px] text-blue-700 leading-relaxed">{msg}</span>
      </div>
    )
  }

  return (
    <Card className="p-4 sm:p-[22px_24px] mb-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #111827, #374151)' }}>
          {cloneIcon(Icons.github, { color: '#fff', size: 18 })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold">Résultats GitHub Scan</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
            {scan?.target} · {results.langage || info.language || 'N/A'} · {scan?.score ?? 0}/{scoreMax}
          </div>
        </div>
        <Badge color={total > 0 ? 'red' : 'green'}>{total} finding{total !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5 border-b border-slate-100 pb-3">
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
        bandit.length === 0 ? <EmptyState msg={`Aucune vulnérabilité détectée${banditLoc ? `, ${banditLoc} lignes analysées` : ''}`} /> :
        <div className="flex flex-col gap-3">
          {banditLoc > 0 && <div className="text-[11px] text-slate-400 mb-1">{banditLoc} lignes de code analysées</div>}
          {bandit.map((f, i) => (
            <div key={i} className="p-3.5 rounded-[9px]"
              style={{ background: '#FEF2F2', border: '1px solid #FEE2E2' }}>
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <span className="text-[13px] font-semibold text-slate-900">{f.issue}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <SeverityBadge level={f.severity} />
                  {f.cwe && <span className="text-[10px] text-slate-400 font-mono">{f.cwe}</span>}
                </div>
              </div>
              <div className="font-mono text-[11px] text-slate-500 mb-1.5">
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
              ? `${safetyPkg} dépendances vérifiées, aucune CVE connue${safetyFile ? ` (${safetyFile})` : ''}`
              : 'Aucun fichier requirements.txt trouvé'
          } />
        ) : (
          <div className="flex flex-col gap-3">
            {safetyFile && <div className="text-[11px] text-slate-400 mb-1">{safetyFile} · {safetyPkg} dépendances</div>}
            {(() => {
              const PRIO_COLOR = { 'URGENTE': '#DC2626', 'ÉLEVÉE': '#EA580C', 'À SURVEILLER': '#CA8A04', 'FAIBLE': '#6B7280' }
              const PRIO_RANK  = { 'URGENTE': 0, 'ÉLEVÉE': 1, 'À SURVEILLER': 2, 'FAIBLE': 3 }
              return [...safety].sort((a, b) => (PRIO_RANK[a.priority] ?? 4) - (PRIO_RANK[b.priority] ?? 4)).map((f, i) => (
                <div key={i} className="p-3.5 rounded-[9px]"
                  style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <div>
                      <span className="font-mono text-[13px] font-bold text-slate-900">{f.package}</span>
                      <span className="font-mono text-[12px] text-slate-500 ml-2">v{f.version}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {f.priority && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ background: (PRIO_COLOR[f.priority] || '#6B7280') + '18', color: PRIO_COLOR[f.priority] || '#6B7280' }}
                          title="Priorité combinée gravité (CVSS) × probabilité d'exploitation (EPSS)">
                          {f.priority}
                        </span>
                      )}
                      <SeverityBadge level={f.severity} />
                      <span className="text-[10px] font-mono text-red-600 font-semibold">{f.cve}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600">{f.desc}</div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      → <span className="font-mono">pip install {f.package} --upgrade</span>
                    </span>
                    {f.epss != null && (
                      <span className="text-[10.5px] text-slate-400 font-mono"
                        title="Probabilité d'exploitation dans les 30 jours (EPSS, FIRST.org)">
                        EPSS {(f.epss * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))
            })()}
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
              const s      = f.severity?.toLowerCase() || 'low'
              const sevBg  = { critical: '#FEF2F2', high: '#FFF7ED', moderate: '#FEFCE8', low: '#F9FAFB' }
              const sevBdr = { critical: '#FEE2E2', high: '#FED7AA', moderate: '#FEF3C7', low: '#E5E7EB' }
              const lvl    = s === 'moderate' ? 'MEDIUM' : s.toUpperCase()
              return (
                <div key={i} className="p-3.5 rounded-[9px]"
                  style={{ background: sevBg[s] || '#F9FAFB', border: `1px solid ${sevBdr[s] || '#E5E7EB'}` }}>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="font-mono text-[13px] font-bold text-slate-900">{f.package}</span>
                    <SeverityBadge level={lvl} />
                  </div>
                  <div className="text-xs text-slate-700 mb-1">{f.issue}</div>
                  {f.range && <div className="text-[11px] text-slate-400 font-mono">Versions affectées : {f.range}</div>}
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
              <div className="font-mono text-[11px] text-slate-500 mb-1.5">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
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
              <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100 text-[12.5px]">
                <span className="text-slate-500">{label}</span>
                <span className="font-mono font-semibold text-slate-800">{String(value)}</span>
              </div>
            ))}
            {info.description && (
              <div className="col-span-2 pt-2 text-[12px] text-slate-600 italic">"{info.description}"</div>
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
      // Appel direct plutôt qu'axios : la réponse est un flux SSE lu au fil de
      // l'eau. Le jeton doit donc être joint à la main, l'intercepteur d'axios
      // ne s'applique pas ici.
      const resp = await fetch(`${API_BASE}/scans/${id}/ask`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${localStorage.getItem('cg-token') || ''}`,
        },
        body:    JSON.stringify({ question: q }),
      })
      if (!resp.ok) {
        throw new Error(resp.status === 401
          ? 'Session expirée, reconnectez-vous pour interroger l\'assistant.'
          : `Le service d'analyse a répondu ${resp.status}.`)
      }

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
    } catch (err) {
      // Le message précis évite un « indisponible » opaque : une session
      // expirée et un service injoignable n'appellent pas la même réaction.
      setConversations((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          answer: err?.message || "Assistant injoignable, vérifiez que le serveur est démarré.",
          date:   new Date().toLocaleString('fr-FR'),
        }
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
      toast.error('Rapport PDF non disponible : backend hors ligne.')
    } finally {
      timers.forEach(clearTimeout)
      setPdfLoading(false)
      setPdfStep(0)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton w="30%" h={14} />
        <Card className="p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
          <Skeleton w={110} h={110} rounded className="flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex gap-2"><Skeleton w={80} h={22} className="rounded-md" /><Skeleton w={120} h={22} className="rounded-md" /></div>
            <Skeleton w="50%" h={24} />
            <Skeleton w="70%" h={14} />
            <div className="flex gap-6"><Skeleton w={60} h={12} /><Skeleton w={60} h={12} /><Skeleton w={60} h={12} /></div>
          </div>
          <div className="hidden sm:flex flex-col gap-2 flex-shrink-0"><Skeleton w={148} h={36} className="rounded-[var(--cg-radius)]" /><Skeleton w={148} h={36} className="rounded-[var(--cg-radius)]" /></div>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-6 space-y-3"><Skeleton w="40%" h={14} /><Skeleton h={8} className="rounded-full" /><Skeleton w="80%" h={12} /><Skeleton w="60%" h={12} /></Card>
          <Card className="p-6 space-y-3"><Skeleton w="40%" h={14} /><Skeleton h={48} /><Skeleton h={48} /></Card>
        </div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 rounded-[var(--cg-radius)] flex items-center justify-center" style={{ background: '#EFF6FF' }}>
          {cloneIcon(Icons.scan, { size: 24, color: '#1F5C99' })}
        </div>
        <div className="text-slate-700 font-semibold">Aucun scan disponible</div>
        <div className="text-[13px] text-slate-400 text-center max-w-xs">
          Lancez votre premier scan depuis le dashboard pour voir les résultats ici.
        </div>
        <Button variant="primary" onClick={() => navigate('/dashboard')} className="mt-1">
          Aller au dashboard
        </Button>
      </div>
    )
  }

  const isGithub   = scan?.type === 'github'
  const scoreMax   = isGithub ? (scan?.results?.score_max ?? 30) : 100
  const score      = scan?.score ?? 0
  const scorePct   = Math.round((score / scoreMax) * 100)
  const scoreColor = scorePct >= 80 ? '#1A7A4A' : scorePct >= 50 ? '#854F0B' : '#991B1B'

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate('/scan-results')}
        className="flex items-center gap-1.5 text-slate-500 text-[12.5px] mb-2 bg-transparent border-none cursor-pointer p-0 hover:text-slate-700 transition-colors"
      >
        {cloneIcon(Icons.arrowLeft, { size: 14, color: 'currentColor' })}
        Tous les scans
      </button>

      <PageHeader title="Résultats du scan" subtitle={`${scan?.target} · ${scan?.date || ''}`} />

      {/* Target hero card */}
      <Card className="p-5 sm:p-7 mb-5 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6">
        <div className="relative flex-shrink-0 self-center sm:self-auto" style={{ width: 110, height: 110 }}>
          <ScoreRing score={scorePct} size={110} stroke={9} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[30px] font-bold font-mono tracking-[-0.03em]" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="text-[10px] text-slate-400">/ {scoreMax}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <Badge color="blue" icon={isGithub ? Icons.github : Icons.domain}>
              {isGithub ? 'GitHub' : scan?.typeLabel || 'Domaine'}
            </Badge>
            <Badge color={scorePct >= 80 ? 'green' : scorePct >= 50 ? 'orange' : 'red'}>
              {scorePct >= 80 ? 'Bon · Surveillance recommandée' : scorePct >= 50 ? 'Niveau moyen · Action requise' : 'Critique · Action urgente'}
            </Badge>
          </div>
          <CopyValue value={scan?.target} className="text-[24px] font-bold font-mono tracking-[-0.02em] text-slate-900 break-all" />
          <div className="text-[13px] text-slate-500 mt-1 flex items-center gap-1.5">
            Analysé <RelativeTime date={scan?.date} /> · {isGithub
              ? 'Bandit · Safety · TruffleHog'
              : ['DNS', 'SSL/TLS', 'Headers', 'Ports', 'Réputation']
                  .filter((_, i) => [scan?.results?.dns, scan?.results?.ssl, scan?.results?.headers,
                                     scan?.results?.ports?.score != null,
                                     scan?.results?.reputation?.score != null][i])
                  .join(' · ')}
          </div>
          <div className="flex gap-6 mt-3.5 text-xs flex-wrap">
            {!isGithub && (
              <>
                <div><span className="text-slate-400">Problèmes</span> <strong className="font-mono ml-1" style={{ color: '#EF4444' }}>{scan?.vulns ?? 0}</strong></div>
                <div><span className="text-slate-400">CVE</span> <strong className="font-mono ml-1" style={{ color: '#F59E0B' }}>{scan?.cve ?? 0}</strong></div>
              </>
            )}
            {isGithub && (
              <>
                <div><span className="text-slate-400">Bandit</span> <strong className="font-mono ml-1 text-red-500">{scan?.results?.bandit?.findings?.length ?? 0}</strong></div>
                <div><span className="text-slate-400">Safety CVE</span> <strong className="font-mono ml-1 text-orange-500">{scan?.results?.safety?.findings?.length ?? 0}</strong></div>
                <div><span className="text-slate-400">Secrets</span> <strong className="font-mono ml-1" style={{ color: '#8B5CF6' }}>{scan?.results?.trufflehog?.findings?.length ?? 0}</strong></div>
                <div><span className="text-slate-400">Langue</span> <strong className="font-mono ml-1 text-blue-600">{scan?.results?.langage || scan?.results?.github_info?.language || '—'}</strong></div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
          <Button variant="primary" icon={pdfLoading ? null : Icons.download} onClick={handleDownloadPDF} disabled={pdfLoading}>
            {pdfLoading
              ? <><span className="spinner mr-2" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />{PDF_STEPS[pdfStep]}</>
              : 'Télécharger PDF'}
          </Button>
          <Button variant="secondary" icon={Icons.experts} onClick={() => navigate('/experts')}>
            Contacter un expert
          </Button>
          {isGithub && (
            <Button variant="secondary" icon={Icons.github} onClick={() => navigate('/settings')}>
              Demander une remédiation assistée
            </Button>
          )}
        </div>
      </Card>

      {/* GitHub findings */}
      {isGithub && <GitHubSection scan={scan} />}

      {/* Breakdown + Issues (EASM only) */}
      {!isGithub && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[18px] mb-5">
          {/* Détail du score pondéré + SSL, données réelles du backend */}
          <Card className="p-4 sm:p-[22px_24px]">
            <div className="text-sm font-semibold mb-4">Détail du score</div>
            {(() => {
              const ssl       = scan?.results?.ssl
              const breakdown = scan?.results?.score_detail?.breakdown ?? []
              if (!ssl && breakdown.length === 0) return <div className="text-sm text-slate-400">Données non disponibles.</div>

              const barColor = (pct) => pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'

              const rows = ssl ? [
                { label: 'Version TLS',     value: ssl.tls_version  || '—',                 detail: ssl.tls_version === 'TLSv1.3' ? 'Optimal' : 'Mettre à jour recommandé' },
                { label: 'Certificat',      value: ssl.valid ? 'Valide' : 'Invalide',        detail: ssl.issued_by || '—' },
                { label: 'Expiration',      value: ssl.expiry_date  || '—',                  detail: ssl.expired ? 'Expiré !' : `${ssl.days_until_expiry} jours restants` },
                { label: 'Auto-signé',      value: ssl.self_signed  ? 'Oui' : 'Non',         detail: ssl.self_signed ? 'Non approuvé par les navigateurs' : 'CA reconnue' },
              ] : []

              return (
                <div className="flex flex-col gap-4">
                  {/* Une barre par critère pondéré (DNS 25 · SSL 25 · Headers 20) */}
                  {breakdown.length > 0 ? breakdown.map((b) => {
                    const pct = (b.points / b.max) * 100
                    return (
                      <div key={b.criterion}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[13px] font-medium">{b.label}</span>
                          <span className="text-[13px] font-bold font-mono" style={{ color: barColor(pct) }}>{b.points}/{b.max}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: barColor(pct) }} />
                        </div>
                      </div>
                    )
                  }) : ssl && (
                    <div>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[13px] font-medium">Score SSL/TLS</span>
                        <span className="text-[13px] font-bold font-mono" style={{ color: barColor((ssl.score ?? 0) / 25 * 100) }}>{ssl.score ?? 0}/25</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(ssl.score ?? 0) / 25 * 100}%`, background: barColor((ssl.score ?? 0) / 25 * 100) }} />
                      </div>
                    </div>
                  )}
                  {ssl && (
                    <>
                      <div className="text-[11.5px] text-slate-500 -mt-1">Grade SSL {ssl.grade} · {ssl.cipher_suite || '—'}</div>
                      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                        {rows.map((r) => (
                          <div key={r.label} className="flex justify-between items-center text-[12px]">
                            <span className="text-slate-500 font-medium">{r.label}</span>
                            <div className="text-right">
                              <span className="font-mono font-semibold text-slate-800">{r.value}</span>
                              <span className="text-slate-400 ml-2 text-[11px]">{r.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}
          </Card>

          {/* Issues, données réelles du backend */}
          <Card className="p-4 sm:p-[22px_24px] flex flex-col">
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
                      <div className="text-sm text-slate-500">Aucun problème détecté sur les critères évalués</div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 overflow-auto">
                      {issues.map((iss, idx) => {
                        const st = ISSUE_STYLES[iss.color] || ISSUE_STYLES.yellow
                        return (
                          <div key={idx} className="p-3 rounded-[9px]"
                            style={{ border: `1px solid ${st.border}`, background: st.bg }}>
                            <div className="flex justify-between items-start gap-2.5 mb-1">
                              <div className="text-[13px] font-semibold text-slate-900">{iss.title}</div>
                              <SeverityBadge level={iss.severity} />
                            </div>
                            <div className="text-xs text-slate-600 leading-relaxed">{iss.desc}</div>
                            <div className="text-[10.5px] text-slate-400 mt-1.5 font-mono">{iss.tool}</div>
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
        const SEV_BG  = { CRITICAL: '#FEF2F2', HIGH: '#FFF7ED', MEDIUM: '#FEFCE8', LOW: '#F9FAFB' }
        const SEV_BDR = { CRITICAL: '#FEE2E2', HIGH: '#FED7AA', MEDIUM: '#FEF3C7', LOW: '#E5E7EB' }
        const SEV_CHI = { CRITICAL: '#EF4444', HIGH: '#F97316', MEDIUM: '#F59E0B', LOW: '#6B7280' }
        const PRIO_COLOR = { 'URGENTE': '#DC2626', 'ÉLEVÉE': '#EA580C', 'À SURVEILLER': '#CA8A04', 'FAIBLE': '#6B7280' }
        const PRIO_RANK  = { 'URGENTE': 0, 'ÉLEVÉE': 1, 'À SURVEILLER': 2, 'FAIBLE': 3 }
        const sortedCves = [...cves].sort((a, b) => (PRIO_RANK[a.priority] ?? 4) - (PRIO_RANK[b.priority] ?? 4))
        return (
          <Card className="p-4 sm:p-[22px_24px] mb-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)' }}>
                {cloneIcon(Icons.alert, { color: '#EF4444', size: 18 })}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold">CVE identifiées</div>
                {banner && (
                  <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">Serveur détecté : {banner}</div>
                )}
              </div>
              <Badge color="red">{cves.length} CVE</Badge>
            </div>
            <div className="flex flex-col gap-2.5">
              {sortedCves.map((cve, i) => (
                <div key={i} className="p-3 rounded-[9px]"
                  style={{ background: SEV_BG[cve.severity] || '#F9FAFB', border: `1px solid ${SEV_BDR[cve.severity] || '#E5E7EB'}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-slate-800 leading-snug break-words">{cve.title}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {cve.priority && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                          style={{ background: (PRIO_COLOR[cve.priority] || '#6B7280') + '18', color: PRIO_COLOR[cve.priority] || '#6B7280' }}
                          title="Priorité combinée gravité (CVSS) × probabilité d'exploitation (EPSS)">
                          {cve.priority}
                        </span>
                      )}
                      {cve.cvss && (
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
                          style={{ background: (SEV_CHI[cve.severity] || '#6B7280') + '18', color: SEV_CHI[cve.severity] || '#6B7280' }}>
                          CVSS {cve.cvss}
                        </span>
                      )}
                      <SeverityBadge level={cve.severity} />
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2.5 font-mono text-[11px] text-slate-400">
                    <span>{cve.id}</span>
                    {cve.epss != null && (
                      <span title="Probabilité d'exploitation dans les 30 jours (EPSS, FIRST.org)">
                        · EPSS {(cve.epss * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      })()}

      {/* AI Report */}
      <Card className="p-5 sm:p-7 mb-5">
        <div className="flex items-center gap-3 mb-[18px]">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: '#1F5C99' }}>
            {cloneIcon(Icons.results, { color: '#fff', size: 20 })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold">Analyse du rapport</div>
            <div className="text-xs text-slate-500 mt-0.5">Posez vos questions sur les résultats de ce scan</div>
          </div>
        </div>

        <div className="text-[13.5px] text-slate-700 leading-[1.7] break-words p-4 sm:p-[18px_20px] bg-slate-50 rounded-[var(--cg-radius)] border border-slate-100 mb-4">
          <strong className="text-slate-900">Rapport automatique</strong>
          <br />
          Le scan de{' '}
          <code className="bg-white px-1.5 py-px rounded border border-gray-200 text-[12px] font-mono break-all">{scan?.target}</code>{' '}
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
                  lines.push(<><strong style={{ color: '#EF4444' }}>⚠ {secrets} secret{secrets > 1 ? 's' : ''} exposé{secrets > 1 ? 's' : ''} détecté{secrets > 1 ? 's' : ''}</strong>, ceci est la priorité absolue. Révoquez immédiatement les tokens concernés sur les plateformes correspondantes (GitHub, AWS, etc.) et ajoutez ces fichiers au <code className="bg-white px-1 rounded border border-gray-200 text-[11px]">.gitignore</code>.</>)
                }

                if (cveCount > 0) {
                  const pkgManager = npmF.length > 0 ? 'npm audit fix' : 'pip install --upgrade'
                  const urgent = safetyF.filter((f) => f.priority === 'URGENTE').length
                  lines.push(<><strong>{cveCount} CVE</strong> détectée{cveCount > 1 ? 's' : ''} dans les dépendances. Exécutez <code className="bg-white px-1 rounded border border-gray-200 text-[11px] font-mono">{pkgManager}</code> pour corriger les vulnérabilités automatiquement corrigeables.</>)
                  if (urgent > 0) {
                    lines.push(<><strong style={{ color: '#DC2626' }}>{urgent} CVE en priorité URGENTE</strong>, gravité élevée ET forte probabilité d'exploitation (croisement CVSS × EPSS). À corriger en premier, avant les autres.</>)
                  } else {
                    lines.push(<>Les CVE sont classées par priorité combinée <strong>CVSS × EPSS</strong> (gravité croisée avec la probabilité d'exploitation réelle) dans l'onglet Safety, traitez d'abord celles marquées « ÉLEVÉE ».</>)
                  }
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

            /* ── EASM (DNS + SSL + Headers + CVE) report ───────── */
            const ssl     = scan?.results?.ssl
            const dns     = scan?.results?.dns
            const whois   = scan?.results?.whois
            const headers = scan?.results?.headers
            const issues  = scan?.issues ?? []
            const cves    = scan?.results?.cves ?? []
            const server  = scan?.results?.server_banner || ''

            if (!ssl) return 'Aucune donnée disponible pour ce scan.'

            const lines = []

            // DNS anti-phishing, le critère le plus lourd du score (25 pts)
            if (dns) {
              if (!dns.dmarc_present) {
                lines.push(<><strong style={{ color: '#DC2626' }}>DMARC absent</strong>, n'importe qui peut envoyer un email en se faisant passer pour <strong>@{scan?.target}</strong>. Ajoutez un enregistrement TXT <code className="bg-white px-1 rounded border border-gray-200 text-[11px] font-mono">v=DMARC1; p=quarantine;</code> sur <code className="bg-white px-1 rounded border border-gray-200 text-[11px] font-mono break-all">_dmarc.{scan?.target}</code>.</>)
              } else if (dns.dmarc_policy === 'none') {
                lines.push(<>DMARC est présent mais en mode surveillance seule (<strong>p=none</strong>) : les emails usurpés sont quand même livrés. Passez à p=quarantine puis p=reject.</>)
              }
              if (!dns.spf_present) {
                lines.push(<><strong style={{ color: '#DC2626' }}>SPF absent</strong>, aucun contrôle sur les serveurs autorisés à envoyer des emails pour votre domaine.</>)
              }
              if (dns.spf_present && dns.dmarc_present && dns.dmarc_policy !== 'none') {
                lines.push(<>La protection anti-phishing DNS est bien configurée (SPF + DMARC{dns.dkim_present ? ' + DKIM' : ''}{dns.dnssec_enabled ? ' + DNSSEC' : ''}) : score DNS <strong>{dns.score}/25</strong>.</>)
              }
              if (!dns.dnssec_enabled) {
                lines.push(<><strong>DNSSEC non activé</strong>, vos réponses DNS ne sont pas signées et restent exposées à l'empoisonnement de cache. Activez DNSSEC chez votre hébergeur DNS.</>)
              }
            }

            // WHOIS : expiration du domaine (priorité absolue si expiré/proche)
            if (whois?.found && whois.days_until_expiry != null) {
              if (whois.days_until_expiry < 0) {
                lines.push(<><strong style={{ color: '#DC2626' }}>Domaine expiré</strong> depuis {Math.abs(whois.days_until_expiry)} jours, il peut être racheté par un tiers qui prendrait le contrôle du site et des emails. Renouvelez-le immédiatement.</>)
              } else if (whois.days_until_expiry <= 30) {
                lines.push(<><strong>Le domaine expire dans {whois.days_until_expiry} jours</strong> (registrar {whois.registrar || 'N/A'}). Renouvelez-le sans tarder pour éviter une interruption de service et un risque de détournement.</>)
              }
            }

            // En-têtes de sécurité HTTP (20 pts)
            if (headers) {
              const missing = headers.headers_missing ?? []
              if (missing.length > 0) {
                lines.push(<><strong>{missing.length} en-tête{missing.length > 1 ? 's' : ''} de sécurité HTTP manquant{missing.length > 1 ? 's' : ''}</strong> ({missing.slice(0, 3).join(', ')}{missing.length > 3 ? '…' : ''}) : protection incomplète contre le XSS, le clickjacking et le SSL stripping. Score headers : <strong>{headers.score}/20</strong>.</>)
              } else if (headers.reachable) {
                lines.push(<>Tous les en-têtes de sécurité HTTP sont en place, score headers <strong>{headers.score}/20</strong>.</>)
              }
            }

            // Ports réseau (15 pts)
            const ports = scan?.results?.ports
            if (ports?.score != null) {
              const ouverts   = ports.open_ports ?? []
              const sensibles = ouverts.filter((p) => p.severity === 'CRITIQUE' || p.severity === 'HAUT')
              if (sensibles.length > 0) {
                lines.push(<><strong style={{ color: '#DC2626' }}>{sensibles.length} service{sensibles.length > 1 ? 's' : ''} sensible{sensibles.length > 1 ? 's' : ''} exposé{sensibles.length > 1 ? 's' : ''} sur internet</strong> ({sensibles.map((p) => `${p.port} ${p.service}`).join(', ')}). Un service d'administration ou une base de données joignable publiquement est une porte d'entrée directe. Score ports : <strong>{ports.score}/15</strong>.</>)
              } else if (ouverts.length > 0) {
                lines.push(<>{ouverts.length} port{ouverts.length > 1 ? 's' : ''} ouvert{ouverts.length > 1 ? 's' : ''} ({ouverts.map((p) => `${p.port} ${p.service}`).join(', ')}), tous attendus pour un service web. Score ports : <strong>{ports.score}/15</strong>.</>)
              } else if (ports.reachable) {
                lines.push(<>Aucun port sensible ouvert parmi les {ports.ports_scanned} testés, score ports <strong>{ports.score}/15</strong>.</>)
              }
            }

            // Réputation (15 pts) : historique, et non configuration
            const rep = scan?.results?.reputation
            if (rep?.score != null) {
              if (rep.vt_malveillant > 0) {
                lines.push(<><strong style={{ color: '#DC2626' }}>Signalé comme malveillant par {rep.vt_malveillant} moteur{rep.vt_malveillant > 1 ? 's' : ''} de sécurité</strong> sur {rep.vt_total_moteurs} consultés. Vos emails risquent d'être bloqués et votre site signalé aux visiteurs. Demandez une réévaluation après avoir traité l'origine du signalement.</>)
              }
              if (rep.abuse_score >= 25) {
                lines.push(<><strong>Adresse IP signalée pour abus</strong> (indice {rep.abuse_score}/100, {rep.abuse_signalements} signalement{rep.abuse_signalements > 1 ? 's' : ''} sur 90 jours{rep.abuse_fournisseur ? `, hébergeur ${rep.abuse_fournisseur}` : ''}). Si l'adresse est partagée, demandez-en une dédiée ; sinon vérifiez qu'aucune machine du réseau n'est compromise.</>)
              }
              if (rep.vt_malveillant === 0 && rep.abuse_score < 25) {
                lines.push(<>Réputation saine sur {rep.sources?.join(' et ') || 'les sources consultées'}, aucun signalement significatif. Score réputation : <strong>{rep.score}/15</strong>.</>)
              }
            }

            // Serveur détecté
            if (server) {
              lines.push(<>Serveur détecté : <strong>{server}</strong>.</>)
            }

            // CVE : priorité croisée CVSS × EPSS
            const cveUrgent   = cves.filter((c) => c.priority === 'URGENTE')
            const cveCritical = cves.filter((c) => ['CRITICAL','CRITIQUE'].includes((c.severity || '').toUpperCase()))
            const cveHigh     = cves.filter((c) => ['HIGH','HAUT'].includes((c.severity || '').toUpperCase()))
            const epssTxt = (c) => c.epss != null ? `, EPSS ${(c.epss * 100).toFixed(1)}%` : ''

            if (cveUrgent.length > 0) {
              lines.push(
                <><strong style={{ color: '#DC2626' }}>⚠ {cveUrgent.length} CVE en priorité URGENTE</strong>, gravité élevée croisée avec une forte probabilité d'exploitation réelle (CVSS × EPSS). À corriger en premier.{' '}
                {cveUrgent.slice(0, 3).map((c, i) => (
                  <span key={i}><br />• <strong>{c.id}</strong> (CVSS {c.cvss}{epssTxt(c)}) : {(c.title || '').slice(0, 90)}{(c.title || '').length > 90 ? '…' : ''}</span>
                ))}</>
              )
            }

            if (cveCritical.length > 0) {
              lines.push(
                <><strong style={{ color: '#DC2626' }}>{cveCritical.length} CVE CRITIQUE{cveCritical.length > 1 ? 'S' : ''}</strong> (gravité) détectée{cveCritical.length > 1 ? 's' : ''} sur {server || 'ce serveur'}.{' '}
                {cveCritical.slice(0, 3).map((c, i) => (
                  <span key={i}><br />• <strong>{c.id}</strong> (CVSS {c.cvss}{epssTxt(c)}) : {(c.title || '').slice(0, 90)}{(c.title || '').length > 90 ? '…' : ''}</span>
                ))}</>
              )
            }

            if (cveHigh.length > 0) {
              lines.push(
                <><strong style={{ color: '#EA580C' }}>{cveHigh.length} CVE HAUTE{cveHigh.length > 1 ? 'S' : ''}</strong> identifiée{cveHigh.length > 1 ? 's' : ''}.{' '}
                {cveHigh.slice(0, 2).map((c, i) => (
                  <span key={i}><br />• <strong>{c.id}</strong> (CVSS {c.cvss}{epssTxt(c)}) : {(c.title || '').slice(0, 90)}{(c.title || '').length > 90 ? '…' : ''}</span>
                ))}</>
              )
            }

            if (cves.length === 0) {
              lines.push(<>Aucune CVE connue détectée pour ce serveur.</>)
            }

            // SSL
            if (!ssl.valid) {
              lines.push(<>Le certificat SSL est <strong>invalide</strong>, les navigateurs bloqueront l'accès au site. Installez un certificat signé par une autorité reconnue (Let's Encrypt est gratuit).</>)
            } else if (ssl.expired) {
              lines.push(<>Le certificat SSL est <strong>expiré</strong>. Les visiteurs verront une alerte de sécurité. Renouvelez-le immédiatement.</>)
            } else if (ssl.days_until_expiry <= 30) {
              lines.push(<>Le certificat expire dans <strong>{ssl.days_until_expiry} jours</strong>. Anticipez le renouvellement pour éviter une interruption de service.</>)
            } else {
              lines.push(<>Le certificat SSL est valide, émis par <strong>{ssl.issued_by || 'une CA reconnue'}</strong>, et expire le <strong>{ssl.expiry_date}</strong> ({ssl.days_until_expiry} jours).</>)
            }

            if (ssl.self_signed) {
              lines.push(<>Le certificat est <strong>auto-signé</strong>, non approuvé par les navigateurs. Remplacez-le par un certificat d'une CA publique.</>)
            }

            if (ssl.tls_version && ['TLSv1', 'TLSv1.1'].includes(ssl.tls_version)) {
              lines.push(<>La version <strong>{ssl.tls_version}</strong> est obsolète et vulnérable. Activez uniquement TLS 1.2 et TLS 1.3 sur votre serveur.</>)
            } else if (ssl.tls_version) {
              lines.push(<>La version <strong>{ssl.tls_version}</strong> est utilisée, {ssl.tls_version === 'TLSv1.3' ? 'configuration optimale.' : 'TLS 1.3 serait préférable pour une sécurité maximale.'}</>)
            }

            if (issues.length === 0 && cves.length === 0) {
              lines.push(<>Aucun problème détecté. La configuration est correcte. Maintenez le renouvellement automatique du certificat actif.</>)
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
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-slate-600">
                    Q
                  </div>
                  <div className="flex-1 min-w-0 break-words px-3 py-2 rounded-[var(--cg-radius)] bg-slate-100 text-[13px] text-slate-800">
                    {c.question}
                  </div>
                </div>
                <div className="flex items-start gap-2.5 pl-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-white"
                    style={{ background: '#1F5C99' }}>
                    CG
                  </div>
                  <div className="flex-1 min-w-0 break-words px-3 py-2 rounded-[var(--cg-radius)] text-[13px] text-slate-700 leading-relaxed"
                    style={{ background: '#F3F8FD', border: '1px solid #E8F1FA' }}>
                    {c.answer
                      ? <>{renderMd(c.answer)}{askingAI && i === conversations.length - 1 && <span className="inline-block w-[2px] h-[13px] bg-blue-400 ml-0.5 animate-pulse" />}</>
                      : <span className="flex items-center gap-1.5 text-slate-400"><span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#1F5C99', borderColor: 'rgba(31,92,153,0.2)' }} />Analyse en cours…</span>
                    }
                    {c.date && <div className="text-[10px] text-slate-400 mt-1.5">{c.date}</div>}
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
            placeholder="Poser une question sur votre rapport…"
            className="flex-1 min-w-0 px-4 py-[11px] rounded-[var(--cg-radius)] border border-slate-300 text-[13.5px] outline-none transition-all focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
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
            const dns     = scan?.results?.dns
            const whois   = scan?.results?.whois
            const headers = scan?.results?.headers
            const ports   = scan?.results?.ports
            const rep     = scan?.results?.reputation
            const cves    = scan?.results?.cves ?? []
            const suggestions = []
            /* Les constats les plus graves passent devant : un service exposé ou
               un signalement de réputation prime sur une bonne pratique manquante */
            const portSensible = (ports?.open_ports ?? []).find(
              (p) => p.severity === 'CRITIQUE' || p.severity === 'HAUT')
            if (portSensible)
              suggestions.push(`Le port ${portSensible.port} (${portSensible.service}) est ouvert, que faire ?`)
            if (rep?.vt_malveillant > 0)
              suggestions.push('Pourquoi mon site est-il signalé comme malveillant ?')
            else if (rep?.abuse_score >= 25)
              suggestions.push('Mon adresse IP est signalée pour abus, comment régulariser ?')
            if (whois?.found && whois.days_until_expiry != null && whois.days_until_expiry <= 30)
                                                            suggestions.push('Que se passe-t-il si mon domaine expire ?')
            if (dns && !dns.dmarc_present)                  suggestions.push('C\'est grave le DMARC absent ?')
            if (dns && !dns.spf_present)                    suggestions.push('Comment configurer SPF sur mon DNS ?')
            if (dns && !dns.dnssec_enabled)                 suggestions.push('À quoi sert DNSSEC et comment l\'activer ?')
            if (headers?.headers_missing?.length > 0)       suggestions.push('Comment ajouter les en-têtes de sécurité manquants ?')
            if (cves.some((c) => c.priority === 'URGENTE'))  suggestions.push('Quelle CVE urgente dois-je corriger en premier ?')
            else if (cves.length > 0)                       suggestions.push('Quelles CVE dois-je corriger en priorité ?')
            if (ssl && !ssl.valid)                          suggestions.push('Comment obtenir un certificat SSL gratuit ?')
            if (ssl && ssl.self_signed)                     suggestions.push('Comment remplacer un certificat auto-signé ?')
            if (ssl && ssl.days_until_expiry <= 30)         suggestions.push('Comment renouveler un certificat SSL ?')
            suggestions.push(`Comment améliorer le score de ${scan?.target} ?`)
            if (issues.length === 0)                        suggestions.push('Comment maintenir cette posture de sécurité ?')
            return suggestions.slice(0, 3)
          })().map((q) => (
            <button key={q} onClick={() => setQuestion(q)}
              className="px-3 py-1 rounded-[16px] border border-slate-200 bg-white text-[11.5px] text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors">
              {q}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}