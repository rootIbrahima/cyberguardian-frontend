import { useState, useEffect, useRef } from 'react'
import { Card, Badge, Button, PageHeader, Avatar, toast } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import { authAPI, telegramAPI, githubAPI } from '../lib/api'

const ROLE_LABELS = { client: 'Client', expert: 'Expert validé', admin: 'Administrateur' }
const ROLE_COLORS = { client: 'blue', expert: 'green', admin: 'orange' }

/* ─── Section Notifications Telegram ─── */
function TelegramSection() {
  const [statut, setStatut]   = useState(null)   // { lie, chat_id, lie_depuis }
  const [code, setCode]       = useState(null)   // { code, lien, expire_dans }
  const [loading, setLoading] = useState(false)
  const pollRef = useRef(null)

  const fetchStatut = async () => {
    try {
      const res = await telegramAPI.status()
      setStatut(res.data)
      if (res.data?.lie && pollRef.current) {
        clearInterval(pollRef.current)   // lié → on arrête le polling et on masque le code
        pollRef.current = null
        setCode(null)
      }
      return res.data
    } catch { return null }
  }

  useEffect(() => {
    fetchStatut()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const genererCode = async () => {
    setLoading(true)
    try {
      const res = await telegramAPI.generateCode()
      setCode(res.data)
      // Détecte la liaison automatiquement, toutes les 3 secondes
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(fetchStatut, 3000)
    } catch {
      toast.error('Impossible de générer un code : réessayez.')
    }
    setLoading(false)
  }

  const delier = async () => {
    try {
      await telegramAPI.unlink()
      toast.success('Compte Telegram délié.')
      setStatut({ lie: false })
    } catch {
      toast.error('Déliaison impossible.')
    }
  }

  const copier = (txt) => {
    navigator.clipboard?.writeText(txt)
    toast.success('Copié.')
  }

  return (
    <Card className="p-5 sm:p-7 mt-5">
      <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-4">
        Notifications Telegram
      </div>

      {/* État 2, lié */}
      {statut?.lie ? (
        <div className="rounded-xl p-5" style={{ background: '#F0FDF4', border: '1px solid #D1FAE5' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              {cloneIcon(Icons.checkCircle, { size: 20, color: '#059669' })}
            </div>
            <div>
              <div className="text-[14px] font-semibold text-green-800">Telegram connecté</div>
              <div className="text-[12px] text-gray-500">
                Lié le {statut.lie_depuis || '—'} · ID {statut.chat_id || '—'}
              </div>
            </div>
          </div>
          <div className="text-[12.5px] text-gray-600 mb-4">
            Alertes activées : chute de score, expiration SSL, secrets détectés.
          </div>
          <Button variant="danger" size="sm" icon={Icons.trash} onClick={delier}>
            Délier le compte
          </Button>
        </div>
      ) : (
        /* État 1, non lié */
        <div className={`grid gap-5 ${code ? 'lg:grid-cols-2' : ''}`}>
          <div>
            <div className="text-[14px] font-semibold mb-1.5">Lier votre compte Telegram</div>
            <p className="text-[12.5px] text-gray-500 mb-4 leading-relaxed">
              Recevez vos alertes de sécurité directement sur Telegram.
            </p>
            <Button variant="primary" icon={Icons.send} onClick={genererCode} disabled={loading}>
              {loading ? 'Génération…' : 'Générer un code de liaison'}
            </Button>
          </div>

          {code && (
            <div className="rounded-xl p-4" style={{ background: '#F5F6FA', border: '1px solid #E5E7EB' }}>
              <div className="text-[11px] text-gray-500 mb-1.5">Votre code de liaison :</div>
              <div className="flex items-center gap-2 mb-2">
                <code className="flex-1 min-w-0 text-[15px] font-bold font-mono tracking-wider bg-white px-3 py-2 rounded-lg border border-gray-200">
                  {code.code}
                </code>
                <button onClick={() => copier(code.code)}
                  className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer">
                  {cloneIcon(Icons.copy, { size: 15 })}
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-3">
                {cloneIcon(Icons.clock, { size: 12, color: '#9CA3AF' })}
                Expire dans {code.expire_dans}
              </div>
              <a href={code.lien} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-[12.5px] font-semibold mb-2 transition-opacity hover:opacity-90"
                style={{ background: '#1F5C99', color: '#fff' }}>
                {cloneIcon(Icons.send, { size: 14, color: '#fff' })}
                Ouvrir le bot Telegram
              </a>
              <div className="text-[11px] text-gray-500">
                Ou envoyez ce message au bot :
                <code className="block mt-1 bg-white px-2 py-1 rounded border border-gray-200 font-mono text-[11px]">
                  /start {code.code}
                </code>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

/* ─── Section Correction assistée GitHub ─── */
function GitHubSection() {
  const [statut, setStatut] = useState(null)   // { connecte, login, depots }
  const [repo, setRepo]     = useState('')
  const [busy, setBusy]     = useState(false)

  const fetchStatut = async () => {
    try { setStatut((await githubAPI.status()).data) } catch { setStatut({ connecte: false }) }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const etat = params.get('github')
    if (etat === 'connecte') toast.success('Compte GitHub connecté.')
    else if (etat === 'erreur') toast.error('La connexion GitHub a échoué : réessayez.')
    if (etat) window.history.replaceState({}, '', window.location.pathname)
    fetchStatut()
  }, [])

  const connecter = async () => {
    setBusy(true)
    try {
      const res = await githubAPI.connect()
      window.location.href = res.data.url
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Connexion GitHub indisponible.')
      setBusy(false)
    }
  }

  const autoriser = async () => {
    if (!repo.trim()) return
    setBusy(true)
    try {
      const res = await githubAPI.authorize(repo.trim())
      toast.success(res.data.deja ? 'Ce dépôt était déjà autorisé.' : `Correction autorisée sur ${res.data.slug}.`)
      setRepo('')
      await fetchStatut()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Autorisation impossible.')
    }
    setBusy(false)
  }

  const revoquer = async (id) => {
    try { await githubAPI.revoke(id); await fetchStatut() }
    catch { toast.error('Révocation impossible.') }
  }

  const deconnecter = async () => {
    try { await githubAPI.disconnect(); toast.success('Compte GitHub déconnecté.'); setStatut({ connecte: false }) }
    catch { toast.error('Déconnexion impossible.') }
  }

  return (
    <Card className="p-5 sm:p-7 mt-5">
      <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-4">
        Correction assistée GitHub
      </div>

      {statut?.connecte ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                {cloneIcon(Icons.checkCircle, { size: 20, color: '#059669' })}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-green-800">GitHub connecté</div>
                <div className="text-[12px] text-gray-500">@{statut.login || '—'}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" icon={Icons.trash} onClick={deconnecter}>
              Déconnecter
            </Button>
          </div>

          <div className="text-[12.5px] text-gray-600 mb-2">
            Autorisez la correction d'un dépôt : après validation par un administrateur, une
            <span className="font-semibold"> Pull Request </span> corrective vous est proposée. Rien
            n'est modifié sans votre fusion.
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && autoriser()}
              placeholder="https://github.com/organisation/depot"
              className="flex-1 min-w-0 px-4 py-2.5 rounded-[10px] border border-gray-300 text-sm outline-none transition-all focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
            />
            <Button variant="primary" icon={Icons.check} onClick={autoriser} disabled={busy}>
              Autoriser
            </Button>
          </div>

          {statut.depots?.length > 0 ? (
            <div className="flex flex-col gap-2">
              {statut.depots.map((d) => (
                <div key={d.id}
                  className="flex items-center justify-between px-4 py-2.5 rounded-[10px] border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
                    {cloneIcon(Icons.github, { size: 15, color: '#5A626E' })}
                    {d.slug}
                  </div>
                  <button onClick={() => revoquer(d.id)}
                    className="text-[12px] font-medium text-gray-400 hover:text-red-600 cursor-pointer">
                    Révoquer
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-gray-400">Aucun dépôt autorisé pour le moment.</div>
          )}
        </div>
      ) : (
        <div>
          <div className="text-[14px] font-semibold mb-1.5">Laisser corriger vos dépôts</div>
          <p className="text-[12.5px] text-gray-500 mb-4 leading-relaxed max-w-[62ch]">
            Connectez votre compte GitHub pour autoriser CyberGuardian à proposer des correctifs
            (dépendances vulnérables, secrets exposés) sous forme de Pull Request. Vous gardez le
            dernier mot : la correction n'est appliquée que si vous la fusionnez.
          </p>
          <Button variant="primary" icon={Icons.github} onClick={connecter} disabled={busy}>
            {busy ? 'Redirection…' : 'Connecter GitHub'}
          </Button>
        </div>
      )}
    </Card>
  )
}

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
      toast.error(err.response?.data?.detail || 'Changement impossible : backend hors ligne.')
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
      <Card className="p-5 sm:p-7 mb-5">
        <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-4">
          Compte
        </div>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} color="#1F5C99" size={52} />
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold truncate">{user.name || '—'}</div>
            <div className="text-[13px] text-gray-500 truncate">{user.email || '—'}</div>
          </div>
          <Badge color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Badge>
        </div>
      </Card>

      {/* Mot de passe */}
      <form onSubmit={handleSubmit}>
        <Card className="p-5 sm:p-7">
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-6 pt-5 border-t border-gray-100">
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

      <TelegramSection />
      <GitHubSection />
    </div>
  )
}
