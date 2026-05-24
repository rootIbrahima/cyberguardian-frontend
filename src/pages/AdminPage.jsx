import { useState } from 'react'
import { Card, Badge, Button, PageHeader, Avatar } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import { MOCK_PENDING_EXPERTS } from '../lib/constants'
import { adminAPI } from '../lib/api'

export default function AdminPage() {
  const [pending, setPending] = useState(MOCK_PENDING_EXPERTS)
  const [loading, setLoading] = useState(null)

  const handleApprove = async (id) => {
    setLoading(id + '-approve')
    try {
      await adminAPI.approveExpert ? adminAPI.approveExpert(id) : Promise.resolve()
    } catch {}
    setPending((prev) => prev.filter((e) => e.id !== id))
    setLoading(null)
  }

  const handleReject = async (id) => {
    setLoading(id + '-reject')
    try {
      await adminAPI.rejectExpert ? adminAPI.rejectExpert(id) : Promise.resolve()
    } catch {}
    setPending((prev) => prev.filter((e) => e.id !== id))
    setLoading(null)
  }

  const STATS = [
    { l: 'En attente', v: pending.length, c: '#F59E0B', i: Icons.clock },
    { l: 'Validés ce mois', v: 12, c: '#10B981', i: Icons.checkCircle },
    { l: 'Rejetés ce mois', v: 3, c: '#EF4444', i: Icons.x },
    { l: 'Total experts actifs', v: 18, c: '#1F5C99', i: Icons.experts },
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
                    <Button variant="secondary" size="sm" icon={Icons.eye}>CNI</Button>
                    <Button variant="secondary" size="sm" icon={Icons.eye}>Diplôme</Button>
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
    </div>
  )
}