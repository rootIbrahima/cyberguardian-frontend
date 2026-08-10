import { useState, useEffect } from 'react'
import { Card, Badge, Button, PageHeader, Avatar, toast } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import { adminAPI, messageErreur } from '../lib/api'

export default function RemediationPage() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(null)

  const refresh = () => {
    adminAPI.remediationCandidates()
      .then((r) => { if (Array.isArray(r.data)) setRows(r.data) })
      .catch(() => {})
  }
  useEffect(refresh, [])

  const handleRemediation = async (scanId) => {
    setLoading(scanId + '-remed')
    try {
      const res = await adminAPI.proposeRemediation(scanId)
      toast.success('Pull Request corrective proposée au client.')
      if (res.data?.pr_url) window.open(res.data.pr_url, '_blank')
      refresh()
    } catch (err) {
      toast.error(messageErreur(err, 'Correction impossible.'))
    }
    setLoading(null)
  }

  return (
    <div>
      <PageHeader
        title="Correction assistée GitHub"
        subtitle="Dépôts dont le client a autorisé la correction, la proposition ouvre une Pull Request que le client valide."
      />

      <Card className="p-4 sm:p-[22px_26px]">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[780px] border-collapse sm:min-w-0">
          <thead>
            <tr className="border-b border-gray-200">
              {['Client', 'Dépôt', 'Vulnérabilités', 'Dernier scan', 'Action'].map((h, i) => (
                <th key={h} className="pb-3 text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] px-3"
                  style={{ textAlign: i >= 2 ? 'center' : 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.slug}-${r.scan_id || 'x'}`} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.client} color="#6B7280" size={34} />
                    <div>
                      <div className="text-[13.5px] font-medium">{r.client}</div>
                      <div className="text-[11px] text-gray-400">{r.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
                    {cloneIcon(Icons.github, { size: 15, color: '#5A626E' })}
                    {r.slug}
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center">
                  {r.problemes > 0 ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <Badge color="red">{r.problemes} problème{r.problemes > 1 ? 's' : ''}</Badge>
                      <span className="text-[10.5px] text-gray-400">
                        {r.corrigeables > 0
                          ? `dont ${r.corrigeables} dépendance${r.corrigeables > 1 ? 's' : ''} auto-corrigeable${r.corrigeables > 1 ? 's' : ''}`
                          : (r.secrets > 0 ? 'secret, expert / agent requis' : 'expert / agent requis')}
                      </span>
                    </div>
                  ) : (
                    <Badge color="green">aucun</Badge>
                  )}
                </td>
                <td className="py-3.5 px-3 text-center text-xs text-gray-500">{r.date || '—'}</td>
                <td className="py-3.5 px-3 text-center">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Icons.github}
                    onClick={() => handleRemediation(r.scan_id)}
                    disabled={!r.corrigeables || loading === r.scan_id + '-remed'}
                    title={!r.corrigeables ? 'Aucune dépendance à corriger automatiquement. Les secrets et le code relèvent d\'un expert ou de l\'agent.' : undefined}
                  >
                    Proposer une correction
                  </Button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400 text-[13px]">
                  Aucun dépôt autorisé pour l'instant, le client autorise la correction depuis ses paramètres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  )
}
