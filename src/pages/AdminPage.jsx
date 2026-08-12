import { useState, useEffect } from 'react'
import { Card, Badge, Button, PageHeader, Avatar, toast } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import { MOCK_PENDING_EXPERTS } from '../lib/constants'
import { adminAPI, messageErreur } from '../lib/api'

/* ─── État des services ─── */
/* Un webhook déclaré sur la mauvaise URL, un canal e-mail non configuré, un
   serveur d'inférence injoignable : ces pannes ne se voyaient nulle part depuis
   la plateforme, et se diagnostiquaient en SSH. Le bloc reste sur une ligne
   tant que tout va bien — un panneau qui crie en permanence cesse d'être lu —
   et se déploie dès qu'un service manque à l'appel. */

const ETATS = {
  alerte: { fond: '#FEF2F2', bord: '#FECACA', teinte: '#991B1B', icone: 'alertCircle' },
  absent: { fond: '#F8FAFC', bord: '#E2E8F0', teinte: '#475569', icone: 'minus' },
  ok:     { fond: '#F0FDF4', bord: '#D1FAE5', teinte: '#1A7A4A', icone: 'checkCircle' },
}

function SanteSection() {
  const [sante, setSante] = useState(null)
  const [erreur, setErreur] = useState(false)
  const [deplie, setDeplie] = useState(false)

  const charger = () => {
    setSante(null)
    setErreur(false)
    adminAPI.sante()
      .then(({ data }) => { setSante(data); setDeplie(data.alertes > 0) })
      .catch(() => setErreur(true))
  }

  // Chargé à part du reste de la page : les sondes réseau prennent une à deux
  // secondes, les tableaux n'ont pas à les attendre.
  useEffect(charger, [])

  if (erreur) return null
  if (!sante) {
    return (
      <Card className="p-3.5 sm:p-4 mb-6 flex items-center gap-3">
        <span className="spinner" />
        <span className="text-[13px] text-gray-500">Contrôle des services…</span>
      </Card>
    )
  }

  const pire = sante.alertes ? 'alerte' : sante.absents ? 'absent' : 'ok'
  const t = ETATS[pire]
  const resume = sante.alertes
    ? `${sante.alertes} service${sante.alertes > 1 ? 's' : ''} en défaut`
    : sante.absents
      ? `Tous les services actifs fonctionnent · ${sante.absents} non configuré${sante.absents > 1 ? 's' : ''}`
      : `Tous les services fonctionnent · ${sante.controles.length} contrôles`

  return (
    <Card className="mb-6 overflow-hidden" style={{ background: t.fond, borderColor: t.bord }}>
      <div className="flex items-center gap-3 p-3.5 sm:p-4">
        {cloneIcon(Icons[t.icone], { size: 18, color: t.teinte })}
        <div className="flex-1 min-w-0 text-[13.5px] font-semibold" style={{ color: t.teinte }}>
          {resume}
        </div>
        <button onClick={charger} title="Relancer les contrôles" aria-label="Relancer les contrôles"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white/60 cursor-pointer">
          {cloneIcon(Icons.refresh, { size: 15 })}
        </button>
        <button onClick={() => setDeplie(!deplie)}
          className="text-[12px] font-semibold px-2.5 py-1 rounded-lg hover:bg-white/60 cursor-pointer flex-shrink-0"
          style={{ color: t.teinte }}>
          {deplie ? 'Masquer' : 'Détail'}
        </button>
      </div>

      {deplie && (
        <div className="bg-white border-t divide-y divide-gray-100" style={{ borderColor: t.bord }}>
          {sante.controles.map((c) => {
            const e = ETATS[c.etat]
            return (
              <div key={c.cle} className="flex items-start gap-3 px-4 py-3">
                {cloneIcon(Icons[e.icone], { size: 15, color: e.teinte, className: 'mt-0.5 flex-shrink-0' })}
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold">{c.titre}</div>
                  <div className="text-[12.5px] text-gray-600 leading-relaxed">{c.detail}</div>
                  {c.anomalies?.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {c.anomalies.map((a) => (
                        <li key={`${a.cause}-${a.id}`} className="text-[12px] text-gray-500 font-mono">
                          scan {a.id} · {a.cible} · {a.cause}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default function AdminPage() {
  const [pending, setPending]   = useState(MOCK_PENDING_EXPERTS)
  const [approved, setApproved] = useState([])
  const [users, setUsers]       = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(null)
  const [confirmRevokeId, setConfirmRevokeId] = useState(null)

  const refresh = () => {
    Promise.all([
      adminAPI.pendingExperts(),
      adminAPI.approvedExperts(),
      adminAPI.users(),
      adminAPI.stats(),
    ])
      .then(([p, a, u, s]) => {
        if (Array.isArray(p.data)) setPending(p.data)
        if (Array.isArray(a.data)) setApproved(a.data)
        if (Array.isArray(u.data)) setUsers(u.data)
        setStats(s.data)
      })
      .catch(() => {})   // backend hors ligne, données de démonstration conservées
  }

  useEffect(refresh, [])

  const handleRevoke = async (id) => {
    if (confirmRevokeId !== id) {
      setConfirmRevokeId(id)
      return
    }
    setConfirmRevokeId(null)
    setLoading(id + '-revoke')
    try {
      await adminAPI.revokeExpert(id)
      toast.success('Expert révoqué : retiré de l\'annuaire, rôle repassé à client.')
      refresh()
    } catch {
      toast.error('Révocation impossible.')
    }
    setLoading(null)
  }

  const handleToggleUser = async (id) => {
    setLoading(id + '-toggle')
    try {
      const res = await adminAPI.toggleUser(id)
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: res.data.is_active } : u)))
    } catch (err) {
      toast.error(messageErreur(err, 'Action impossible.'))
    }
    setLoading(null)
  }

  /* Export des candidatures en attente : un administrateur qui instruit un
     dossier travaille souvent hors de l'écran, et le point-virgule est le
     séparateur attendu par les tableurs configurés en français. */
  const exporterCandidatures = () => {
    const champs = ['Nom', 'CNI', 'Niveau', 'Spécialité', 'Date de dépôt']
    const echapper = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lignes = pending.map((e) => [e.name, e.cni, e.level, e.specialty, e.date].map(echapper).join(';'))
    // BOM en tête, sans quoi Excel lit les accents de travers
    const csv = String.fromCharCode(0xFEFF) + [champs.join(';'), ...lignes].join(String.fromCharCode(13, 10))
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const lien = document.createElement('a')
    lien.href = url
    lien.download = `candidatures-experts-${new Date().toISOString().slice(0, 10)}.csv`
    lien.click()
    URL.revokeObjectURL(url)
  }

  const handleApprove = async (id) => {
    setLoading(id + '-approve')
    try { await adminAPI.approveExpert(id) } catch {}
    setPending((prev) => prev.filter((e) => e.id !== id))
    setLoading(null)
    refresh()
  }

  const handleReject = async (id) => {
    setLoading(id + '-reject')
    try { await adminAPI.rejectExpert(id) } catch {}
    setPending((prev) => prev.filter((e) => e.id !== id))
    setLoading(null)
    refresh()
  }

  /* Pièce justificative affichée dans la page : l'ouvrir dans un onglet ferait
     quitter la plateforme au milieu de la validation d'une candidature. */
  const [piece, setPiece] = useState(null)

  const viewDocument = async (id, kind, nom) => {
    try {
      const res  = await adminAPI.document(id, kind)
      const type = res.data.type || ''
      setPiece({
        url:   URL.createObjectURL(res.data),
        pdf:   type.includes('pdf'),
        titre: `${kind === 'cni' ? 'Pièce d\'identité' : 'Diplôme'} — ${nom}`,
      })
    } catch {
      toast.error('Document non fourni par le candidat.')
    }
  }

  const fermerPiece = () => {
    if (piece) URL.revokeObjectURL(piece.url)   // libère le blob
    setPiece(null)
  }

  useEffect(() => {
    if (!piece) return
    const onKey = (e) => { if (e.key === 'Escape') fermerPiece() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [piece])

  const STATS = [
    { l: 'En attente',           v: pending.length,        c: '#F59E0B', i: Icons.clock },
    { l: 'Experts validés',      v: stats?.approved ?? '—', c: '#10B981', i: Icons.checkCircle },
    { l: 'Utilisateurs inscrits', v: stats?.users ?? '—',    c: '#1F5C99', i: Icons.experts },
    { l: 'Scans réalisés',       v: stats?.scans ?? '—',    c: '#8B5CF6', i: Icons.scan },
  ]

  return (
    <div>
      <PageHeader
        title="Administration : Validation experts"
        subtitle={`${pending.length} candidature${pending.length > 1 ? 's' : ''} en attente de vérification`}
      />

      <SanteSection />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 mb-6">
        {STATS.map((s) => (
          <Card key={s.l} className="p-3.5 sm:p-[18px] flex items-center gap-3 sm:gap-3.5">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: s.c + '22' }}
            >
              {cloneIcon(s.i, { color: s.c, size: 20 })}
            </div>
            <div>
              <div className="text-[11px] text-gray-500 font-medium">{s.l}</div>
              <div className="text-[22px] font-bold font-mono tracking-[-0.02em]">{s.v}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="p-4 sm:p-[22px_26px]">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div className="text-[15px] font-semibold">Candidatures en attente</div>
          <Button variant="secondary" size="sm" icon={Icons.download}
            onClick={exporterCandidatures} disabled={pending.length === 0}>
            Exporter en CSV
          </Button>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[900px] border-collapse sm:min-w-0">
          <thead>
            <tr className="border-b border-gray-200">
              {['Candidat', 'Niveau', 'Spécialité', 'Date', 'Documents', 'Actions'].map((h, i) => (
                <th
                  key={h}
                  className="pb-3 text-[11px] font-semibold text-gray-500 uppercase tracking-[0.06em] px-3"
                  style={{ textAlign: i >= 4 ? 'center' : 'left' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pending.map((e) => (
              <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={e.name} color="#6B7280" size={34} />
                    <div>
                      <div className="text-[13.5px] font-medium whitespace-nowrap">{e.name}</div>
                      <div className="text-[11px] text-gray-500 font-mono whitespace-nowrap">CNI {e.cni}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-[13px]">{e.level}</td>
                <td className="py-3.5 px-3 text-[13px]">{e.specialty}</td>
                <td className="py-3.5 px-3 text-xs text-gray-500">{e.date}</td>
                <td className="py-3.5 px-3 text-center">
                  <div className="flex gap-1.5 justify-center">
                    <Button variant="secondary" size="sm" icon={Icons.eye} onClick={() => viewDocument(e.id, 'cni', e.name)}>CNI</Button>
                    <Button variant="secondary" size="sm" icon={Icons.eye} onClick={() => viewDocument(e.id, 'diploma', e.name)}>Diplôme</Button>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <div className="flex gap-1.5 justify-center">
                    <Button
                      variant="success"
                      size="sm"
                      icon={Icons.check}
                      onClick={() => handleApprove(e.id)}
                      disabled={loading === e.id + '-approve'}
                    >
                      Valider
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Icons.x}
                      onClick={() => handleReject(e.id)}
                      disabled={loading === e.id + '-reject'}
                    >
                      Rejeter
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500 text-[13px]">
                  Aucune candidature en attente
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Experts validés, révocation possible */}
      <Card className="p-4 sm:p-[22px_26px] mt-5">
        <div className="text-[15px] font-semibold mb-4">Experts validés ({approved.length})</div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[900px] border-collapse sm:min-w-0">
          <thead>
            <tr className="border-b border-gray-200">
              {['Expert', 'Spécialité', 'Missions', 'Action'].map((h, i) => (
                <th key={h} className="pb-3 text-[11px] font-semibold text-gray-500 uppercase tracking-[0.06em] px-3"
                  style={{ textAlign: i === 3 ? 'center' : 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {approved.map((e) => (
              <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={e.name} color={e.color} size={34} />
                    <div>
                      <div className="text-[13.5px] font-medium whitespace-nowrap">{e.name}</div>
                      <div className="text-[11px] text-gray-500">{e.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-[13px]">{e.specialty}</td>
                <td className="py-3.5 px-3 text-[13px] font-mono">{e.missions}</td>
                <td className="py-3.5 px-3 text-center">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Icons.x}
                    onClick={() => handleRevoke(e.id)}
                    disabled={loading === e.id + '-revoke'}
                  >
                    {confirmRevokeId === e.id ? 'Confirmer ?' : 'Révoquer'}
                  </Button>
                </td>
              </tr>
            ))}
            {approved.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gray-500 text-[13px]">
                  Aucun expert validé
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Utilisateurs, activation / désactivation des comptes */}
      <Card className="p-4 sm:p-[22px_26px] mt-5">
        <div className="text-[15px] font-semibold mb-4">Utilisateurs ({users.length})</div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[900px] border-collapse sm:min-w-0">
          <thead>
            <tr className="border-b border-gray-200">
              {['Utilisateur', 'Rôle', 'Scans', 'Statut', 'Action'].map((h, i) => (
                <th key={h} className="pb-3 text-[11px] font-semibold text-gray-500 uppercase tracking-[0.06em] px-3"
                  style={{ textAlign: i >= 3 ? 'center' : 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                style={{ opacity: u.is_active ? 1 : 0.55 }}>
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} color="#6B7280" size={34} />
                    <div>
                      <div className="text-[13.5px] font-medium whitespace-nowrap">{u.name}</div>
                      <div className="text-[11px] text-gray-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <Badge color={u.role === 'admin' ? 'orange' : u.role === 'expert' ? 'green' : 'blue'}>
                    {u.role}
                  </Badge>
                </td>
                <td className="py-3.5 px-3 text-[13px] font-mono">{u.scans}</td>
                <td className="py-3.5 px-3 text-center">
                  <Badge color={u.is_active ? 'green' : 'red'}>
                    {u.is_active ? 'Actif' : 'Désactivé'}
                  </Badge>
                </td>
                <td className="py-3.5 px-3 text-center">
                  <Button
                    variant={u.is_active ? 'danger' : 'success'}
                    size="sm"
                    icon={u.is_active ? Icons.lock : Icons.check}
                    onClick={() => handleToggleUser(u.id)}
                    disabled={loading === u.id + '-toggle' || u.role === 'admin'}
                  >
                    {u.is_active ? 'Désactiver' : 'Réactiver'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Pièce justificative, consultée sans quitter la page de validation */}
      {piece && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/60 p-3 sm:p-6"
          onClick={fermerPiece}
        >
          <div
            className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden"
            style={{ borderRadius: 'var(--cg-radius)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-slate-200">
              <div className="text-[13px] sm:text-[14px] font-semibold text-slate-900 truncate">{piece.titre}</div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={piece.url}
                  download
                  className="text-[12px] font-semibold text-blue-700 hover:underline"
                >
                  Télécharger
                </a>
                <Button variant="secondary" size="sm" onClick={fermerPiece}>Fermer</Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-2 sm:p-4">
              {piece.pdf ? (
                <iframe
                  src={piece.url}
                  title={piece.titre}
                  className="w-full h-[60vh] sm:h-[70vh] border-0 bg-white"
                />
              ) : (
                <img
                  src={piece.url}
                  alt={piece.titre}
                  className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain"
                />
              )}
            </div>

            <div className="px-4 sm:px-5 py-2.5 border-t border-slate-100 text-[11px] sm:text-[11.5px] text-slate-500">
              Document transmis par le candidat. Sa consultation est réservée à la
              vérification d'identité et n'est pas conservée hors de la plateforme.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
