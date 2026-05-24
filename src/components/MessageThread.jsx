import { useState, useRef, useEffect } from 'react'
import { Avatar, Badge, Button, Card } from './ui'
import { cloneIcon, Icons } from './Icons'
import { messageAPI } from '../lib/api'
import { MOCK_MESSAGES, SCORE_CATEGORIES } from '../lib/constants'

/* ─── 48h countdown from missionStart ─── */
function useCountdown(isoStart) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!isoStart) return
    const calc = () => {
      const start = new Date(isoStart).getTime()
      const diff  = 48 * 3600000 - (Date.now() - start)
      if (diff <= 0) { setRemaining('Expiré'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setRemaining(`${h}h ${m.toString().padStart(2, '0')}min`)
    }
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [isoStart])

  return remaining
}

/* ─── Level banners ─── */
function LevelBanner({ level, subject, onSignContract, missionStart }) {
  const countdown = useCountdown(level === 3 ? missionStart : null)

  if (level === 1) {
    return (
      <div className="px-[22px] py-3 flex items-center gap-2 text-xs"
        style={{ background: '#F5F6FA', borderBottom: '1px solid #E5E7EB' }}>
        {cloneIcon(Icons.lock, { size: 13, color: '#6B7280' })}
        <span className="text-gray-500">
          <strong className="text-gray-700">Niveau 1</strong> — L'expert voit le score global et le nombre de failles pour{' '}
          <span className="font-mono text-gray-700">{subject}</span>.
          Acceptez la mission pour lui donner accès au détail.
        </span>
      </div>
    )
  }

  if (level === 2) {
    return (
      <div className="px-[22px] py-2.5 flex items-center gap-3"
        style={{ background: '#F3F8FD', borderBottom: '1px solid #E8F1FA' }}>
        {cloneIcon(Icons.lock, { size: 13, color: '#1F5C99' })}
        <span className="text-xs text-blue-700 flex-1">
          <strong>Niveau 2</strong> — L'expert voit le score détaillé par catégorie.
          Signez le contrat numérique pour lui donner accès au rapport complet (Niveau 3, 48h).
        </span>
        <button
          onClick={onSignContract}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: '#1F5C99', color: '#fff' }}
        >
          {cloneIcon(Icons.check, { size: 13, color: '#fff' })}
          Signer le contrat numérique
        </button>
      </div>
    )
  }

  if (level === 3) {
    return (
      <div className="px-[22px] py-2.5 flex items-center gap-3"
        style={{ background: '#F0FDF4', borderBottom: '1px solid #D1FAE5' }}>
        {cloneIcon(Icons.checkCircle, { size: 13, color: '#059669' })}
        <span className="text-xs text-green-700 flex-1">
          <strong>Niveau 3 · Accès complet débloqué</strong> — L'expert a accès à votre rapport complet et peut intervenir.
        </span>
        {countdown && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: countdown === 'Expiré' ? '#FEE2E2' : '#D1FAE5', border: `1px solid ${countdown === 'Expiré' ? '#FCA5A5' : '#A7F3D0'}` }}>
            {cloneIcon(Icons.clock, { size: 12, color: countdown === 'Expiré' ? '#EF4444' : '#059669' })}
            <span className="text-[11px] font-semibold font-mono"
              style={{ color: countdown === 'Expiré' ? '#EF4444' : '#059669' }}>
              {countdown === 'Expiré' ? 'Accès expiré' : `Expire dans ${countdown}`}
            </span>
          </div>
        )}
      </div>
    )
  }

  return null
}

/* ─── Level 1 restricted preview ─── */
function Level1Preview({ scan }) {
  const score = 50
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <div className="mx-4 my-3 p-4 rounded-xl" style={{ background: '#F5F6FA', border: '1px solid #E5E7EB' }}>
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-3">
        Aperçu partagé avec l'expert (Niveau 1)
      </div>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-[32px] font-bold font-mono" style={{ color }}>{score}</div>
          <div className="text-[10px] text-gray-400">score / 100</div>
        </div>
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex gap-4 text-xs">
            <div><span className="text-gray-400">Secteur</span> <strong className="ml-1">Université / Éducation</strong></div>
            <div><span className="text-gray-400">Failles</span> <strong className="ml-1 text-red-500">8</strong></div>
            <div><span className="text-gray-400">CVE</span> <strong className="ml-1 text-orange-500">2</strong></div>
          </div>
          <div className="text-[11px] text-gray-500">
            L'expert ne voit pas encore le détail des failles ni le rapport IA.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Level 2 category breakdown ─── */
function Level2Preview() {
  return (
    <div className="mx-4 my-3 p-4 rounded-xl" style={{ background: '#F3F8FD', border: '1px solid #E8F1FA' }}>
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-3">
        Détail partagé avec l'expert (Niveau 2)
      </div>
      <div className="flex flex-col gap-2">
        {SCORE_CATEGORIES.map((c) => {
          const pct   = (c.pts / c.max) * 100
          const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'
          return (
            <div key={c.label} className="flex items-center gap-2 text-xs">
              <span className="text-gray-600 font-medium" style={{ width: 80 }}>{c.label}</span>
              <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden border border-gray-200">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="font-mono font-semibold text-gray-700" style={{ minWidth: 38, textAlign: 'right' }}>
                {c.pts}/{c.max}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Main component ─── */
export default function MessageThread({ conversation, onLevelUp }) {
  const [messages, setMessages]   = useState(MOCK_MESSAGES)
  const [input, setInput]         = useState('')
  const [signing, setSigning]     = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const msg = { from: 'client', time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), text: input }
    setMessages((prev) => [...prev, msg])
    setInput('')
    try { await messageAPI.send(conversation.id, input) } catch {}
  }

  const signContract = async () => {
    setSigning(true)
    try { await messageAPI.signContract(conversation.id) } catch {}
    const contractMsg = {
      from: 'system',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      text: '✅ Contrat numérique signé — L\'expert a désormais accès au rapport complet (Niveau 3) pendant 48h. L\'audit trail est enregistré.',
    }
    setMessages((prev) => [...prev, contractMsg])
    setSigning(false)
    if (onLevelUp) onLevelUp(conversation.id, 3)
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-[22px] py-3.5 border-b border-gray-200">
        <Avatar name={conversation.expert.name} color={conversation.expert.color} size={40} />
        <div className="flex-1">
          <div className="text-[14.5px] font-semibold">{conversation.expert.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            En ligne · {conversation.expert.specialty}
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <Badge color="blue">Sujet · {conversation.subject}</Badge>
          <Badge color={conversation.level === 3 ? 'green' : conversation.level === 2 ? 'orange' : 'gray'} icon={Icons.lock}>
            Niveau {conversation.level} · {conversation.level === 1 ? 'Demande reçue' : conversation.level === 2 ? 'Mission acceptée' : 'Contrat signé'}
          </Badge>
        </div>
      </div>

      {/* Level banner */}
      <LevelBanner
        level={conversation.level}
        subject={conversation.subject}
        onSignContract={signContract}
        missionStart={conversation.missionStart}
      />

      {/* Preview cards based on level */}
      {conversation.level >= 1 && conversation.level < 3 && (
        <div className="bg-gray-50 border-b border-gray-100">
          {conversation.level === 1 && <Level1Preview />}
          {conversation.level === 2 && <Level2Preview />}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef}
        className="flex-1 overflow-auto p-6 flex flex-col gap-3.5"
        style={{ background: '#F5F6FA' }}>
        {messages.map((m, i) => {
          /* System message (contract signed) */
          if (m.from === 'system') {
            return (
              <div key={i} className="text-center">
                <span className="text-[11.5px] px-4 py-1.5 rounded-full inline-block"
                  style={{ background: '#D1FAE5', color: '#059669', border: '1px solid #A7F3D0' }}>
                  {m.text}
                </span>
              </div>
            )
          }
          return (
            <div key={i}
              className="flex gap-2.5 max-w-[75%]"
              style={{
                flexDirection: m.from === 'client' ? 'row-reverse' : 'row',
                alignSelf: m.from === 'client' ? 'flex-end' : 'flex-start',
              }}>
              {m.from === 'expert' && (
                <Avatar name={conversation.expert.name} color={conversation.expert.color} size={32} />
              )}
              <div>
                <div className="px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                  style={{
                    borderRadius: m.from === 'client' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                    background: m.from === 'client' ? '#1F5C99' : '#fff',
                    color: m.from === 'client' ? '#fff' : '#111827',
                    border: m.from === 'expert' ? '1px solid #E5E7EB' : 'none',
                  }}>
                  {m.text}
                </div>
                <div className="text-[10.5px] text-gray-400 mt-1"
                  style={{ textAlign: m.from === 'client' ? 'right' : 'left', paddingLeft: 4, paddingRight: 4 }}>
                  {m.time}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input */}
      <div className="px-[22px] py-3.5 border-t border-gray-200 bg-white">
        <div className="flex gap-2.5 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Écrire un message…"
            className="flex-1 px-4 py-[11px] rounded-[10px] border border-gray-300 text-[13.5px] outline-none transition-all focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
          />
          <Button variant="primary" icon={Icons.send} onClick={send}>Envoyer</Button>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[10.5px] text-gray-400">
          {cloneIcon(Icons.lock, { size: 11, color: '#9CA3AF' })}
          Messagerie chiffrée · Filigrane PDF actif · Audit trail PostgreSQL · Loi sénégalaise 2008-12
        </div>
      </div>
    </div>
  )
}