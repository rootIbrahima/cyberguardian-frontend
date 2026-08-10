import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Avatar, Badge, Button, toast } from './ui'
import { cloneIcon, Icons } from './Icons'
import { messageAPI, messageErreur } from '../lib/api'

/* ─── Compte à rebours 48h depuis la signature du contrat ─── */
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
      setRemaining(`${h}h ${m.toString().padStart(2, '0')}`)
    }
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [isoStart])

  return remaining
}

/* ─── Barre contextuelle unique, une seule ligne, jamais d'empilement ─── */
function ContextBar({ conversation, preview, isClient, isAdmin, signing, onSign, onOpenReport }) {
  const countdown = useCountdown(conversation.level === 3 ? conversation.missionStart : null)

  if (preview?.access === 'expired') {
    return (
      <div className="px-4 sm:px-[22px] py-2 flex items-center gap-2 border-b text-xs"
        style={{ background: '#FEF2F2', borderColor: '#FEE2E2', color: '#B91C1C' }}>
        {cloneIcon(Icons.clock, { size: 13, color: '#EF4444' })}
        Accès au rapport expiré (48h){isClient && ', signez un nouveau contrat pour le renouveler'}.
      </div>
    )
  }

  if (conversation.level === 2) {
    const detail = (preview?.breakdown || [])
      .map((b) => `${b.label.split(' ')[0]} ${b.points}/${b.max}`)
      .join(' · ')
    return (
      <div className="px-4 sm:px-[22px] py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-b border-gray-100 bg-white text-xs text-gray-500">
        <span className="flex-1 sm:truncate">
          {detail ? <>Partagé avec l'expert : <span className="font-mono text-gray-700">{detail}</span></>
                  : "L'expert voit le score détaillé par catégorie."}
        </span>
        {isClient && (
          <Button variant="primary" size="sm" icon={Icons.check} onClick={onSign} disabled={signing}>
            {signing ? 'Signature…' : 'Signer le contrat'}
          </Button>
        )}
      </div>
    )
  }

  if (conversation.level === 3 && preview?.access === 'full' && preview.scan_id) {
    return (
      <div className="px-4 sm:px-[22px] py-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-b border-gray-100 bg-white text-xs text-gray-500">
        <span className="flex-1 sm:truncate">
          Rapport complet partagé : score <span className="font-mono text-gray-700">{preview.scan.score}/100</span>
          {countdown && countdown !== 'Expiré' && <> · expire dans <span className="font-mono text-gray-700">{countdown}</span></>}
        </span>
        {!isAdmin && (
          <Button variant="secondary" size="sm" icon={Icons.eye} onClick={onOpenReport}>
            Ouvrir le rapport
          </Button>
        )}
      </div>
    )
  }

  return null
}

/* ─── Invitation à noter, dans le fil, comme un message système ─── */
function RatingPrompt({ onRate }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="text-center mt-1">
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-gray-200">
        <span className="text-[11.5px] text-gray-500">Mission terminée ? Évaluez votre expert</span>
        <div className="flex gap-px" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => onRate(n)}
              onMouseEnter={() => setHover(n)}
              className="p-0.5 bg-transparent border-none cursor-pointer"
              title={`${n}/5`}
            >
              {cloneIcon(Icons.star, {
                size: 15,
                fill:  n <= hover ? '#F59E0B' : 'none',
                color: n <= hover ? '#F59E0B' : '#D1D5DB',
              })}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Composant principal ─── */
export default function MessageThread({ conversation, onLevelUp, onBack }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [signing, setSigning]   = useState(false)
  const [rated, setRated]       = useState(0)
  const [envoi, setEnvoi]       = useState(false)
  const scrollRef  = useRef(null)
  const dernierId  = useRef(null)   // dernier message connu, pour ne demander que la suite
  const colleEnBas = useRef(true)   // la lecture suit-elle le bas du fil ?

  const role     = (JSON.parse(localStorage.getItem('cg-user') || '{}').role || 'client').toLowerCase()
  const isClient = role === 'client'
  const isAdmin  = role === 'admin'

  // Vue du scan filtrée par le niveau d'accès, le backend applique les règles N1/N2/N3
  const [preview, setPreview] = useState(null)
  useEffect(() => {
    messageAPI.scanPreview(conversation.id)
      .then((res) => setPreview(res.data))
      .catch(() => setPreview(null))
  }, [conversation.id, conversation.level])

  /* Fil complet au montage */
  const chargerTout = useCallback(async () => {
    try {
      const res = await messageAPI.messages(conversation.id)
      if (Array.isArray(res.data)) {
        setMessages(res.data)
        dernierId.current = res.data.length ? res.data[res.data.length - 1].id : 0
      }
    } catch { /* backend hors ligne, on conserve l'état courant */ }
  }, [conversation.id])

  /* Rafraîchissement : seulement ce qui est arrivé depuis. Sans nouveau message,
     l'état n'est pas remplacé, donc pas de rendu ni de saut de défilement. */
  const chargerSuite = useCallback(async () => {
    if (dernierId.current === null) return chargerTout()
    try {
      const res = await messageAPI.messagesApres(conversation.id, dernierId.current)
      if (Array.isArray(res.data) && res.data.length) {
        setMessages((prev) => [...prev, ...res.data])
        dernierId.current = res.data[res.data.length - 1].id
      }
    } catch { /* backend hors ligne, on conserve l'état courant */ }
  }, [conversation.id, chargerTout])

  useEffect(() => {
    chargerTout()
    const t = setInterval(chargerSuite, 5000)
    return () => clearInterval(t)
  }, [chargerTout, chargerSuite])

  /* Suit la position de lecture : le rafraîchissement ne doit pas arracher
     l'utilisateur au passage de l'historique qu'il est en train de relire. */
  const surDefilement = () => {
    const el = scrollRef.current
    if (el) colleEnBas.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  useEffect(() => {
    const el = scrollRef.current
    if (el && colleEnBas.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || envoi) return
    setInput('')
    setEnvoi(true)
    colleEnBas.current = true   // on suit toujours son propre message
    try {
      await messageAPI.send(conversation.id, text)
      await chargerSuite()
    } catch (err) {
      // Le texte revient dans le champ : le perdre en le faisant passer pour
      // envoyé est pire que de demander à l'utilisateur de réessayer.
      setInput(text)
      toast.error(messageErreur(err, "Message non envoyé : vérifiez votre connexion et réessayez."))
    } finally {
      setEnvoi(false)
    }
  }

  const signContract = async () => {
    if (signing) return
    setSigning(true)
    try {
      await messageAPI.signContract(conversation.id)
      await chargerSuite()
      if (onLevelUp) onLevelUp(conversation.id, 3)
    } catch {
      toast.error('Signature impossible : seul le client peut signer le contrat.')
    }
    setSigning(false)
  }

  const rateMission = async (stars) => {
    try {
      await messageAPI.rate(conversation.id, stars)
      setRated(stars)
      toast.success(`Note ${stars}/5 enregistrée : la réputation de l'expert est mise à jour.`)
      chargerSuite()
    } catch (err) {
      toast.error(messageErreur(err, 'Notation impossible.'))
    }
  }

  const canRate = isClient && conversation.level === 3 && !conversation.rating && !rated

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* En-tête */}
      <div className="flex items-center gap-3 px-4 sm:px-[22px] py-3.5 border-b border-gray-200">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Revenir à la liste des conversations"
            className="-ml-1.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-gray-500 active:bg-gray-100"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
        )}
        <Avatar name={conversation.expert.name} color={conversation.expert.color} size={40} />
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-semibold truncate">{conversation.expert.name}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {conversation.expert.specialty} · <span className="font-mono">{conversation.subject}</span>
          </div>
        </div>
        <span className="hidden sm:inline-flex">
          <Badge color={conversation.level === 3 ? 'green' : conversation.level === 2 ? 'orange' : 'gray'} icon={Icons.lock}>
            {conversation.level === 1 ? 'Demande reçue' : conversation.level === 2 ? 'Mission acceptée' : 'Contrat signé'}
          </Badge>
        </span>
      </div>

      {/* Barre contextuelle, une seule, selon l'état */}
      <ContextBar
        conversation={conversation}
        preview={preview}
        isClient={isClient}
        isAdmin={isAdmin}
        signing={signing}
        onSign={signContract}
        onOpenReport={() => navigate(`/scan-results/${preview?.scan_id}`)}
      />

      {/* Fil de messages */}
      <div ref={scrollRef}
        onScroll={surDefilement}
        className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col gap-3.5"
        style={{ background: '#F5F6FA' }}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-400">
            {cloneIcon(Icons.message, { size: 28, color: '#D1D5DB' })}
            <span className="text-[13px]">Aucun message pour le moment</span>
            <span className="text-[11.5px]">
              {isClient ? 'Présentez votre besoin à l\'expert pour démarrer.' : 'Répondez au client pour accepter la mission.'}
            </span>
          </div>
        )}
        {messages.map((m, i) => {
          if (m.from === 'system') {
            return (
              <div key={i} className="text-center">
                <span className="text-[11px] px-3.5 py-1 rounded-full inline-block text-gray-500 bg-white border border-gray-200">
                  {m.text}
                </span>
              </div>
            )
          }
          return (
            <div key={i}
              className="flex gap-2.5 max-w-[88%] sm:max-w-[75%]"
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
        {canRate && messages.length > 0 && <RatingPrompt onRate={rateMission} />}
      </div>

      {/* Saisie, l'admin supervise en lecture seule */}
      <div className="px-4 sm:px-[22px] py-3.5 border-t border-gray-200 bg-white">
        {isAdmin ? (
          <div className="flex items-center gap-2 text-[12px] text-gray-500 py-1.5">
            {cloneIcon(Icons.eye, { size: 14, color: '#9CA3AF' })}
            Supervision : lecture seule
          </div>
        ) : (
          <div className="flex gap-2.5 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Écrire un message…"
              className="flex-1 min-w-0 px-4 py-[11px] rounded-[10px] border border-gray-300 text-[13.5px] outline-none transition-all focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
            />
            <Button variant="primary" icon={Icons.send} onClick={send} disabled={!input.trim() || envoi} className="flex-shrink-0">
              <span className="hidden sm:inline">Envoyer</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
