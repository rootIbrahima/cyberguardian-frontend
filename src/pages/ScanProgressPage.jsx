import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { scanAPI } from '../lib/api'
import { MCP_TOOLS } from '../lib/constants'
import { cloneIcon, Icons } from '../components/Icons'

const STEP_DELAYS = {
  easm:   { start: 200,  duration: 3200 },
  github: { start: 200,  duration: 18000 },
  score:  { start: 3400, duration: 600 },
  report: { start: 4000, duration: 2400 },
}

function ToolLine({ tool, status }) {
  const icons = {
    pending: <span className="w-4 h-4 rounded-full border border-gray-600 flex-shrink-0" />,
    running: (
      <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
        <span className="spinner" style={{ width: 12, height: 12, borderTopColor: '#3B8FDB', borderColor: 'rgba(59,143,219,0.3)' }} />
      </span>
    ),
    done: (
      <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
        {cloneIcon(Icons.check, { size: 10, color: '#fff' })}
      </span>
    ),
    skip: <span className="w-4 h-4 rounded-full bg-gray-700 flex-shrink-0" />,
  }

  const textColor = {
    pending: 'rgba(255,255,255,0.3)',
    running: '#fff',
    done:    'rgba(255,255,255,0.7)',
    skip:    'rgba(255,255,255,0.2)',
  }

  return (
    <div className="flex items-center gap-3 py-[5px]">
      {icons[status]}
      <span className="font-mono text-[12px] transition-colors duration-300" style={{ color: textColor[status] }}>
        {tool.name}
      </span>
      {status !== 'pending' && status !== 'skip' && (
        <span className="text-[11px] flex-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {tool.label}
        </span>
      )}
      {status === 'done' && (
        <span className="text-[10px] font-mono text-green-500 ml-auto">ok</span>
      )}
      {status === 'running' && (
        <span className="text-[10px] font-mono text-blue-400 ml-auto animate-pulse">en cours</span>
      )}
    </div>
  )
}

export default function ScanProgressPage() {
  const { id }     = useParams()
  const location   = useLocation()
  const navigate   = useNavigate()

  const target    = location.state?.target    || 'cible inconnue'
  const assetType = location.state?.assetType || 'domain'

  const isGithub = assetType === 'github'

  const relevantTools = MCP_TOOLS.filter((t) =>
    t.types.includes(assetType) || t.group === 'score' || t.group === 'report'
  )

  const [toolStatuses, setToolStatuses] = useState(() =>
    Object.fromEntries(relevantTools.map((t) => [t.name, 'pending']))
  )
  const [phase, setPhase]     = useState('scan')
  const [elapsed, setElapsed] = useState(0)
  const [apiDone, setApiDone] = useState(false)

  const pollRef   = useRef(null)
  const timerRef  = useRef(null)
  const startTime = useRef(Date.now())

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(((Date.now() - startTime.current) / 1000).toFixed(1))
    }, 100)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    const timeouts = []

    const mainTools = relevantTools.filter((t) => t.group === 'easm' || t.group === 'github')
    const step = isGithub ? 1800 : 400
    mainTools.forEach((tool, i) => {
      timeouts.push(setTimeout(() => {
        setToolStatuses((prev) => ({ ...prev, [tool.name]: 'running' }))
      }, i * step))
      timeouts.push(setTimeout(() => {
        setToolStatuses((prev) => ({ ...prev, [tool.name]: 'done' }))
      }, i * step + step - 100))
    })

    const allMainDone = mainTools.length * step

    const scoreTools = relevantTools.filter((t) => t.group === 'score')
    scoreTools.forEach((tool, i) => {
      timeouts.push(setTimeout(() => {
        setToolStatuses((prev) => ({ ...prev, [tool.name]: 'running' }))
        setTimeout(() => setToolStatuses((prev) => ({ ...prev, [tool.name]: 'done' })), 400)
      }, allMainDone + i * 450))
    })

    const reportOffset = allMainDone + scoreTools.length * 450 + 200
    timeouts.push(setTimeout(() => {
      setPhase('report')
      const reportTool = relevantTools.find((t) => t.group === 'report')
      if (reportTool) {
        setToolStatuses((prev) => ({ ...prev, [reportTool.name]: 'running' }))
        setTimeout(() => {
          setToolStatuses((prev) => ({ ...prev, [reportTool.name]: 'done' }))
          setPhase('done')
        }, 2200)
      }
    }, reportOffset))

    return () => timeouts.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!id || id === 'demo') return
    pollRef.current = setInterval(async () => {
      try {
        const res = await scanAPI.status(id)
        if (res.data?.status === 'completed' || res.data?.status === 'critical') {
          setApiDone(true)
        }
      } catch { /* backend might not be running */ }
    }, 5000)
    return () => clearInterval(pollRef.current)
  }, [id])

  useEffect(() => {
    if (phase === 'done' || apiDone) {
      const t = setTimeout(() => {
        navigate(`/scan-results/${id}`, { state: { target, assetType } })
      }, 800)
      return () => clearTimeout(t)
    }
  }, [phase, apiDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const doneCount = Object.values(toolStatuses).filter((s) => s === 'done').length
  const progress  = Math.round((doneCount / relevantTools.length) * 100)

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#0F1929' }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2A7ACC, #1F5C99)', boxShadow: '0 0 30px rgba(59,143,219,0.3)' }}
          >
            {cloneIcon(Icons.shield, { color: '#fff', size: 20 })}
          </div>
          <div>
            <div className="text-white font-bold text-[15px] tracking-[-0.01em]">CyberGuardian, Analyse en cours</div>
            <div className="font-mono text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isGithub ? 'Analyse de dépôt GitHub' : 'Analyse de surface d\'attaque externe'}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-mono text-[13px] text-white">{elapsed}s</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isGithub ? 'estimé : 20-30s' : 'estimé : 3-5s'}
            </div>
          </div>
        </div>

        {/* Target badge */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg mb-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {cloneIcon(Icons.scan, { size: 16, color: '#3B8FDB' })}
          <span className="font-mono text-[13px] text-white">{target}</span>
          <span
            className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded"
            style={{ background: 'rgba(59,143,219,0.15)', color: '#6AADE6' }}
          >
            {assetType.toUpperCase()}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span>{doneCount}/{relevantTools.length} modules terminés</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: phase === 'done' ? '#10B981' : 'linear-gradient(90deg, #1F5C99, #3B8FDB)',
              }}
            />
          </div>
        </div>

        {/* Terminal */}
        <div
          className="rounded-xl p-5 overflow-auto font-mono"
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.06)',
            maxHeight: 340,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-3 text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              cyberguardian, scanner, {target}
            </span>
          </div>

          <div className="text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {'>'} Démarrage de l'analyse…
          </div>

          {relevantTools.map((tool) => (
            <ToolLine key={tool.name} tool={tool} status={toolStatuses[tool.name] || 'pending'} />
          ))}

          {phase === 'report' && (
            <div className="mt-3 text-[11px]" style={{ color: '#6AADE6' }}>
              <div className="flex items-center gap-2">
                <span className="spinner" style={{ width: 10, height: 10, borderTopColor: '#6AADE6', borderColor: 'rgba(106,173,230,0.3)' }} />
                Génération du rapport d'analyse…
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-green-400 text-[12px] font-mono">
                Analyse terminée en {elapsed}s : Redirection vers les résultats…
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
