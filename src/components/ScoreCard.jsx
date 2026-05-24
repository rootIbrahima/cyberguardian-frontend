import { Badge } from './ui'

function ScoreRing({ score, size = 120, stroke = 10 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  )
}

export default function ScoreCard({ score = 0, sslScore = null, sslGrade = null }) {
  const level = score >= 80
    ? { label: 'Niveau bon',    color: 'green'  }
    : score >= 50
    ? { label: 'Niveau moyen', color: 'orange' }
    : { label: 'Niveau critique', color: 'red' }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-[11px] font-bold text-gray-400 mb-[18px] uppercase tracking-[0.1em]">Score SSL/TLS</div>

      <div className="relative mb-[18px]" style={{ width: 140, height: 140 }}>
        <ScoreRing score={score} size={140} stroke={10} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold font-mono tracking-[-0.03em]" style={{ fontSize: 36, lineHeight: 1 }}>
            {score}
          </span>
          <span className="text-[11px] text-gray-400 mt-[-2px]">/ 25</span>
        </div>
      </div>

      <Badge color={level.color}>{level.label}</Badge>

      {sslGrade && (
        <div className="mt-3 text-[12px] text-gray-500">
          Grade <span className="font-bold font-mono text-gray-800">{sslGrade}</span>
        </div>
      )}

      <div className="w-full mt-[18px] p-3 rounded-lg bg-gray-50 border border-gray-100 text-left">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">SSL/TLS</span>
          <span className="ml-auto font-mono text-[12px] font-bold text-gray-700">{sslScore ?? score}/25</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-[0.8s] ease-in-out"
            style={{
              width: `${((sslScore ?? score) / 25) * 100}%`,
              background: (sslScore ?? score) >= 20 ? '#10B981' : (sslScore ?? score) >= 12 ? '#F59E0B' : '#EF4444',
            }}
          />
        </div>
      </div>
    </div>
  )
}
