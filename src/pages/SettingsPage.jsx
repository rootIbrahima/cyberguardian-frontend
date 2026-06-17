import { useState } from 'react'
import { Card, Badge, Button, PageHeader, Avatar, toast } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import { authAPI } from '../lib/api'

const ROLE_LABELS = { client: 'Client', expert: 'Expert validé', admin: 'Administrateur' }
const ROLE_COLORS = { client: 'blue', expert: 'green', admin: 'orange' }

export default function SettingsPage() {
  const user = JSON.parse(localStorage.getItem('cg-user') || '{}')
  const role = (user.role || 'client').toLowerCase()

  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.next.length < 8) {
      toast.error('Le nouveau mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (form.next !== form.confirm) {
      toast.error('La confirmation ne correspond pas au nouveau mot de passe.')
      return
    }
    setSaving(true)
    try {
      await authAPI.changePassword(form.current, form.next)
      toast.success('Mot de passe mis à jour.')
      setForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Changement impossible — backend hors ligne.')
    }
    setSaving(false)
  }

  const fields = [
    { key: 'current', label: 'Mot de passe actuel' },
    { key: 'next',    label: 'Nouveau mot de passe' },
    { key: 'confirm', label: 'Confirmer le nouveau mot de passe' },
  ]

  return (
    <div style={{ maxWidth: 640 }}>
      <PageHeader title="Paramètres" subtitle="Informations du compte et sécurité" />

      {/* Compte */}
      <Card className="p-7 mb-5">
        <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-4">
          Compte
        </div>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} color="#1F5C99" size={52} />
          <div className="flex-1">
            <div className="text-[16px] font-semibold">{user.name || '—'}</div>
            <div className="text-[13px] text-gray-500">{user.email || '—'}</div>
          </div>
          <Badge color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Badge>
        </div>
      </Card>

      {/* Mot de passe */}
      <form onSubmit={handleSubmit}>
        <Card className="p-7">
          <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-4">
            Changer le mot de passe
          </div>
          <div className="flex flex-col gap-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
                <input
                  type="password"
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-[10px] border border-gray-300 text-sm outline-none transition-all focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              {cloneIcon(Icons.lock, { size: 12, color: '#9CA3AF' })}
              Hachage côté serveur · jamais stocké en clair
            </div>
            <Button variant="primary" icon={Icons.check} type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Mettre à jour'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
