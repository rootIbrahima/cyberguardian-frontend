import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../lib/api'
import { Button, LabeledInput } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'

const HOME_BY_ROLE = { client: '/dashboard', expert: '/dashboard', admin: '/admin' }

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (field) => (v) => setForm((f) => ({ ...f, [field]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.register(form.email, form.name, form.password, 'client')
      const { access_token, user } = res.data
      localStorage.setItem('cg-token', access_token)
      localStorage.setItem('cg-user', JSON.stringify(user))
      navigate(HOME_BY_ROLE[user.role] || '/dashboard')
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Cet email est déjà utilisé.')
      } else if (!err.response) {
        setError('Impossible de joindre le serveur. Vérifiez que le backend est démarré.')
      } else {
        setError("Erreur lors de la création du compte.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '1fr 1fr', background: '#F5F6FA' }}>
      {/* Left, branding (identique à LoginPage) */}
      <div
        className="relative overflow-hidden flex flex-col justify-between"
        style={{
          background: 'linear-gradient(160deg, #0F1929 0%, #153D66 70%, #1F5C99 100%)',
          padding: '60px 72px',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{ right: -100, top: '30%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,122,204,0.2), transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3.5">
          <div
            className="flex items-center justify-center rounded-[11px] flex-shrink-0"
            style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #2A7ACC, #3B8FDB)', boxShadow: '0 0 30px rgba(59,143,219,0.4)' }}
          >
            {cloneIcon(Icons.shield, { color: '#fff', size: 24 })}
          </div>
          <div>
            <div className="text-white font-bold text-[19px] tracking-[-0.02em]">CyberGuardian</div>
            <div className="text-[11px] uppercase tracking-[0.1em] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
              EASM Platform · v8.0
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative max-w-[480px]">
          <h2 className="text-white text-[36px] font-bold leading-[1.1] tracking-[-0.025em] mt-5">
            Rejoignez CyberGuardian
          </h2>
          <p className="text-[15px] leading-relaxed mt-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Créez votre compte client et commencez à analyser la surface d'attaque externe de vos actifs numériques.
          </p>
          <div className="grid gap-3.5 mt-9" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { n: '247', l: 'Scans réalisés' },
              { n: '12',  l: 'Outils MCP' },
              { n: '18',  l: 'Experts validés' },
            ].map((s) => (
              <div key={s.l} className="py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-white text-[24px] font-bold font-mono tracking-[-0.02em]">{s.n}</div>
                <div className="text-[11px] mt-0.5 tracking-[0.02em]" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right, formulaire */}
      <div className="flex flex-col justify-center px-[72px] py-[60px]" style={{ maxWidth: 560 }}>
        <div className="mb-8">
          <h1 className="text-[30px] font-bold tracking-[-0.025em] text-gray-900">Créer un compte</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Déjà inscrit ?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-700 font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              Se connecter →
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <LabeledInput
            label="Nom complet"
            icon={Icons.experts}
            value={form.name}
            onChange={set('name')}
            placeholder="Ibrahima LY"
          />
          <LabeledInput
            label="Email professionnel"
            icon={Icons.mail}
            value={form.email}
            onChange={set('email')}
            placeholder="vous@entreprise.sn"
            type="email"
          />
          <LabeledInput
            label="Mot de passe"
            icon={Icons.lock}
            value={form.password}
            onChange={set('password')}
            type={showPwd ? 'text' : 'password'}
            placeholder="Minimum 6 caractères"
            action={
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="bg-transparent border-none cursor-pointer p-1 text-gray-400 hover:text-gray-600"
              >
                {cloneIcon(Icons.eye, { size: 16, color: 'currentColor' })}
              </button>
            }
          />
          <LabeledInput
            label="Confirmer le mot de passe"
            icon={Icons.lock}
            value={form.confirm}
            onChange={set('confirm')}
            type={showPwd ? 'text' : 'password'}
            placeholder="Répétez le mot de passe"
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">
              {error}
            </div>
          )}

          <Button variant="primary" size="lg" type="submit" disabled={loading} className="mt-1 w-full">
            {loading ? 'Création…' : 'Créer mon compte →'}
          </Button>
        </form>

        <div className="mt-5 p-3.5 rounded-[10px] flex gap-3 items-start" style={{ background: '#F3F8FD', border: '1px solid #E8F1FA' }}>
          {cloneIcon(Icons.shield, { size: 18, color: '#1F5C99' })}
          <div className="text-xs text-blue-700 leading-relaxed">
            <strong>Compte client.</strong> Pour devenir expert certifié CyberGuardian, connectez-vous d'abord puis soumettez votre candidature depuis le menu.
          </div>
        </div>
      </div>
    </div>
  )
}
