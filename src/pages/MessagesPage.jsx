import { useState, useEffect, useRef } from 'react'
import { Card, PageHeader, Avatar } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import MessageThread from '../components/MessageThread'
import { messageAPI } from '../lib/api'
import useMobile from '../lib/useMobile'
import useHauteurVisible from '../lib/useHauteurVisible'
import { lireUtilisateur } from '../lib/session'

const POLL_INTERVAL = 5000

// Barre supérieure (52) plus les marges verticales du gabarit (12 + 16).
const CHROME_MOBILE = 80

export default function MessagesPage() {
  const mobile = useMobile()
  const { hauteur: hauteurVisible, decalage } = useHauteurVisible()
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
    // Aucune conversation n'est ouverte d'office : le volet de droite reste sur
    // son écran d'accueil tant que l'utilisateur n'a pas choisi. Ouvrir la
    // première à sa place la marquerait lue sans qu'il l'ait vue.
    setActiveConv((prev) => (prev && conversations.find((c) => c.id === prev.id)) || null)
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

  const LEVEL_COLORS = { 1: '#9CA3AF', 2: '#F59E0B', 3: '#10B981' }

  if (mobile && activeConv) {
    return (
      <div
        className="fixed inset-x-0 z-30 flex flex-col bg-white"
        style={{ top: decalage, height: hauteurVisible }}
      >
        <MessageThread
          key={activeConv.id}
          conversation={activeConv}
          onLevelUp={handleLevelUp}
          onBack={() => setActiveConv(null)}
        />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col"
      // La hauteur suit la fenêtre visuelle plutôt qu'une unité de mise en page :
      // sur iOS, seule la première rétrécit à l'ouverture du clavier.
      style={{ height: mobile ? hauteurVisible - CHROME_MOBILE : 'calc(100vh - 40px)' }}
    >
      {/* Une fois la conversation ouverte sur téléphone, le fil porte déjà le
          nom de l'interlocuteur et le bouton de retour : le titre de page ne
          fait que consommer la hauteur dont le clavier a besoin. */}
      {!(mobile && activeConv) && (
        <PageHeader
          title="Messagerie"
          subtitle={
            (lireUtilisateur().role || 'client') === 'admin'
              ? 'Supervision des conversations client-expert, lecture seule'
              : 'Vos échanges avec les experts'
          }
        />
      )}

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
                      <div className="text-[11px] text-gray-500 flex-shrink-0">{c.last}</div>
                    </div>
                    <div className="text-[11.5px] text-gray-500 font-mono mt-px truncate">{c.subject}</div>
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
              <div className="py-12 px-5 text-center text-gray-500 text-xs">
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
          <div
            className={`flex-col items-center justify-center gap-4 px-8 text-center ${mobile ? 'hidden' : 'flex'}`}
            style={{ background: '#FAFBFC' }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#EFF6FF' }}>
              {cloneIcon(Icons.message, { size: 26, color: '#1F5C99' })}
            </div>
            <div>
              <div className="text-[15px] font-semibold text-slate-800">
                {conversations.length === 0 ? 'Aucune conversation' : 'Sélectionnez une conversation'}
              </div>
              <p className="mt-1.5 max-w-[340px] text-[12.5px] leading-relaxed text-slate-500">
                {conversations.length === 0
                  ? "Contactez un expert depuis la page Experts : l'échange s'ouvrira ici."
                  : 'Choisissez un échange dans la liste pour afficher les messages.'}
              </p>
            </div>
            <div className="mt-1 rounded-[var(--cg-radius)] border border-slate-200 bg-white px-4 py-3 text-left">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Accès progressif au rapport
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-[12px] text-slate-600">
                <li>Niveau 1 · score global et nombre de failles</li>
                <li>Niveau 2 · score détaillé par catégorie</li>
                <li>Niveau 3 · rapport complet pendant 48 h</li>
              </ul>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}