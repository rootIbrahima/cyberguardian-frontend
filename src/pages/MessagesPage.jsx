import { useState, useEffect, useRef } from 'react'
import { Card, PageHeader, Avatar } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import MessageThread from '../components/MessageThread'
import { MOCK_CONVERSATIONS } from '../lib/constants'
import { messageAPI } from '../lib/api'

const POLL_INTERVAL = 5000

export default function MessagesPage() {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS)
  const [activeConv, setActiveConv]       = useState(MOCK_CONVERSATIONS[0])
  const [search, setSearch]               = useState('')
  const pollRef = useRef(null)

  /* ─── Poll conversations list every 5s ─── */
  useEffect(() => {
    const fetchConvs = async () => {
      try {
        const res = await messageAPI.conversations()
        if (res.data?.length) setConversations(res.data)
      } catch { /* backend offline — keep mock data */ }
    }

    fetchConvs()
    pollRef.current = setInterval(fetchConvs, POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [])

  /* ─── Keep activeConv in sync with conversations list ─── */
  useEffect(() => {
    setActiveConv((prev) =>
      conversations.find((c) => c.id === prev.id) || conversations[0]
    )
  }, [conversations])

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

  const LEVEL_LABELS = { 1: 'Demande reçue', 2: 'Mission acceptée', 3: 'Contrat signé' }
  const LEVEL_COLORS = { 1: '#9CA3AF', 2: '#F59E0B', 3: '#10B981' }

  return (
    <div style={{ height: 'calc(100vh - 56px)' }}>
      <PageHeader title="Messagerie" subtitle="Communications sécurisées avec vos experts · polling 5s" />

      <Card
        className="overflow-hidden"
        style={{
          padding: 0,
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          height: 'calc(100vh - 170px)',
        }}
      >
        {/* ─── Conversation list ─── */}
        <div className="border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-[16px_18px] border-b border-gray-200">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              {cloneIcon(Icons.search, { size: 16, color: '#9CA3AF' })}
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une conversation…"
                className="border-none outline-none text-[13px] flex-1 bg-transparent placeholder-gray-400"
              />
            </div>
          </div>

          {/* Poll indicator */}
          <div className="flex items-center gap-2 px-[18px] py-1.5 border-b border-gray-100"
            style={{ background: '#F9FAFB' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"
              style={{ boxShadow: '0 0 0 3px rgba(16,185,129,0.15)' }} />
            <span className="text-[10px] text-gray-400">Actualisation automatique toutes les 5 secondes</span>
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
                    <div className="flex items-center gap-1.5 mt-px">
                      <span className="text-[11.5px] text-blue-700 font-mono">{c.subject}</span>
                      <span className="text-[9px] px-1.5 py-px rounded font-semibold"
                        style={{ background: LEVEL_COLORS[c.level] + '20', color: LEVEL_COLORS[c.level] }}>
                        N{c.level}
                      </span>
                    </div>
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
            {filtered.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-xs">Aucune conversation trouvée</div>
            )}
          </div>
        </div>

        {/* ─── Thread ─── */}
        {activeConv ? (
          <MessageThread
            key={activeConv.id}
            conversation={activeConv}
            onLevelUp={handleLevelUp}
          />
        ) : (
          <div className="flex items-center justify-center text-gray-400 text-sm">
            Sélectionnez une conversation
          </div>
        )}
      </Card>
    </div>
  )
}