import { useState, useEffect } from 'react'
import { Card, Badge, Button, PageHeader, Avatar, toast } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import { MOCK_PENDING_EXPERTS } from '../lib/constants'
import { adminAPI } from '../lib/api'

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
      .catch(() => {})   // backend hors ligne — données de démonstration conservées
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
      toast.success('Expert révoqué — retiré de l\'annuaire, rôle repassé à client.')
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
      toast.error(err.response?.data?.detail || 'Action impossible.')
    }
    setLoading(null)
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

  const viewDocument = async (id, kind) => {
    try {
      const res = await adminAPI.document(id, kind)
      window.open(URL.createObjectURL(res.data), '_blank')
    } catch {
      toast.error('Document non fourni par le candidat.')
    }
  }

  const STATS = [
    { l: 'En attente',           v: pending.length,        c: '#F59E0B', i: Icons.clock },
    { l: 'Experts validés',      v: stats?.approved ?? 12, c: '#10B981', i: Icons.checkCircle },
    { l: 'Utilisateurs inscrits', v: stats?.users ?? 18,    c: '#1F5C99', i: Icons.experts },
    { l: 'Scans réalisés',       v: stats?.scans ?? 24,    c: '#8B5CF6', i: Icons.scan },
  ]

  return (
    <div>
      <PageHeader
        title="Administration — Validation experts"
        subtitle={`${pending.length} candidature${pending.length > 1 ? 's' : ''} en attente de vérification`}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3.5 mb-6">
        {STATS.map((s) => (
          <Card key={s.l} className="p-[18px] flex items-center gap-3.5">
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
      <Card className="p-[22px_26px]">
        <div className="flex justify-between items-center mb-4">
          <div className="text-[15px] font-semibold">Candidatures en attente</div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={Icons.filter}>Filtrer</Button>
            <Button variant="secondary" size="sm" icon={Icons.download}>Exporter</Button>
          </div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {['Candidat', 'Niveau', 'Spécialité', 'Date', 'Documents', 'Actions'].map((h, i) => (
                <th
                  key={h}
                  className="pb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] px-3"
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
                      <div className="text-[13.5px] font-medium">{e.name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">CNI {e.cni}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-[13px]">{e.level}</td>
                <td className="py-3.5 px-3 text-[13px]">{e.specialty}</td>
                <td className="py-3.5 px-3 text-xs text-gray-500">{e.date}</td>
                <td className="py-3.5 px-3 text-center">
                  <div className="flex gap-1.5 justify-center">
                    <Button variant="secondary" size="sm" icon={Icons.eye} onClick={() => viewDocument(e.id, 'cni')}>CNI</Button>
                    <Button variant="secondary" size="sm" icon={Icons.eye} onClick={() => viewDocument(e.id, 'diploma')}>Diplôme</Button>
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
                <td colSpan={6} className="py-10 text-center text-gray-400 text-[13px]">
                  Aucune candidature en attente
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Experts validés — révocation possible */}
      <Card className="p-[22px_26px] mt-5">
        <div className="text-[15px] font-semibold mb-4">Experts validés ({approved.length})</div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {['Expert', 'Spécialité', 'Missions', 'Action'].map((h, i) => (
                <th key={h} className="pb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] px-3"
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
                      <div className="text-[13.5px] font-medium">{e.name}</div>
                      <div className="text-[11px] text-gray-400">{e.email}</div>
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
                <td colSpan={4} className="py-10 text-center text-gray-400 text-[13px]">
                  Aucun expert validé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Utilisateurs — activation / désactivation des comptes */}
      <Card className="p-[22px_26px] mt-5">
        <div className="text-[15px] font-semibold mb-4">Utilisateurs ({users.length})</div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {['Utilisateur', 'Rôle', 'Scans', 'Statut', 'Action'].map((h, i) => (
                <th key={h} className="pb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] px-3"
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
                      <div className="text-[13.5px] font-medium">{u.name}</div>
                      <div className="text-[11px] text-gray-400">{u.email}</div>
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
      </Card>
    </div>
  )
}