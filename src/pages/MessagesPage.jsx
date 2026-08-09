import { useState, useEffect, useRef } from 'react'
import { Card, PageHeader, Avatar } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import MessageThread from '../components/MessageThread'
import { messageAPI } from '../lib/api'
import useMobile from '../lib/useMobile'

const POLL_INTERVAL = 5000

export default function MessagesPage() {
  const mobile = useMobile()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv]       = useState(null)
  const [search, setSearch]               = useState('')
  const [loaded, setLoaded]               = useState(false)
  const pollRef = useRef(null)

  /* ─── Poll conversations list every 5s ─── */
  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const res = await messageAPI.conversations()
        if (Array.isArray(res.data)) setConversations(res.data)
      } catch { /* backend hors ligne */ }
      finally { setLoaded(true) }
    }

    fetchConvs()
    pollRef.current = setInterval(fetchConvs, POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [])

  /* ─── Keep activeConv in sync with conversations list ─── */
  useEffect(() => {
    setActiveConv((prev) => {
      const encore = prev && conversations.find((c) => c.id === prev.id)
      if (encore) return encore
      // Sur téléphone, liste et fil se partagent le même espace : on affiche la
      // liste tant qu'aucune conversation n'a été choisie explicitement.
      return mobile ? null : conversations[0] || null
    })
  }, [conversations, mobile])

  /* ─── Level upgrade from MessageThread (contract signed) ─── */
  const handleLevelUp = (convId, newLevel) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, level: newLevel, missionStart: new Date().toISOString() }
          : c
      )
    )
  }

  const filtered = conversations.filter(
    (c) =>
      c.expert.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
  )

  const LEVEL_COLORS = { 1: '#9CA3AF', 2: '#F59E0B', 3: '#10B981' }

  return (
    <div
      className={`flex flex-col ${mobile ? 'cg-hauteur-messagerie' : ''}`}
      style={mobile ? undefined : { height: 'calc(100vh - 40px)' }}
    >
      <PageHeader
        title="Messagerie"
        subtitle={
          (JSON.parse(localStorage.getItem('cg-user') || '{}').role || 'client') === 'admin'
            ? 'Supervision des conversations client-expert, lecture seule'
            : 'Vos échanges avec les experts'
        }
      />

      <Card className="overflow-hidden flex-1 p-0 grid min-h-0 lg:grid-cols-[320px_1fr]">
        {/* ─── Conversation list ─── */}
        <div
          className={`border-r border-gray-200 flex-col ${mobile && activeConv ? 'hidden' : 'flex'}`}
          style={{ minHeight: 0 }}
        >
          {/* Search */}
          <div className="p-[16px_18px] border-b border-gray-200">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              {cloneIcon(Icons.search, { size: 16, color: '#9CA3AF' })}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une conversation…"
                className="border-none outline-none text-[13px] flex-1 min-w-0 bg-transparent placeholder-gray-400"
              />
            </div>
          </div>

          <div className="overflow-auto flex-1">
            {filtered.map((c) => {
              const isActive = activeConv?.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConv(c)}
                  className="p-[14px_18px] border-b border-gray-100 cursor-pointer flex gap-3 transition-colors hover:bg-gray-50"
                  style={{
                    background: isActive ? '#F3F8FD' : 'transparent',
                    borderLeft: `3px solid ${isActive ? '#1F5C99' : 'transparent'}`,
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar name={c.expert.name} color={c.expert.color} size={40} />
                    {/* Level dot */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ background: LEVEL_COLORS[c.level] }}
                    >
                      {c.level}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="text-[13.5px] font-semibold truncate">{c.expert.name}</div>
                      <div className="text-[11px] text-gray-400 flex-shrink-0">{c.last}</div>
                    </div>
                    <div className="text-[11.5px] text-gray-400 font-mono mt-px truncate">{c.subject}</div>
                    <div className="flex justify-between items-center mt-1 gap-1.5">
                      <div className="text-xs text-gray-500 truncate flex-1">{c.preview}</div>
                      {c.unread > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-[10px] px-[7px] py-[2px] min-w-[20px] text-center flex-shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {loaded && filtered.length === 0 && (
              <div className="py-12 px-5 text-center text-gray-400 text-xs">
                {search ? 'Aucune conversation trouvée'
                        : 'Aucune conversation. Contactez un expert depuis la page Experts pour démarrer.'}
              </div>
            )}
          </div>
        </div>

        {/* ─── Thread ─── */}
        {activeConv ? (
          <MessageThread
            key={activeConv.id}
            conversation={activeConv}
            onLevelUp={handleLevelUp}
            onBack={mobile ? () => setActiveConv(null) : null}
          />
        ) : (
          <div className={`flex-col items-center justify-center gap-2 text-gray-400 ${mobile ? 'hidden' : 'flex'}`}>
            {cloneIcon(Icons.message, { size: 30, color: '#D1D5DB' })}
            <span className="text-sm">
              {conversations.length === 0 ? 'Aucune conversation pour le moment' : 'Sélectionnez une conversation'}
            </span>
          </div>
        )}
      </Card>
    </div>
  )
}