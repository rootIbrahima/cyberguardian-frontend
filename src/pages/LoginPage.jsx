import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI , statsAPI, messageErreur } from '../lib/api'
import { ouvrirSession } from '../lib/session'
import { Badge, Button, LabeledInput } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [rester, setRester]   = useState(true)
  const [loading, setLoading] = useState(false)
  const [aide, setAide]       = useState(false)

  // Agrégats réels affichés sous le titre ; l'échec est silencieux, la page
  // de connexion doit s'afficher même si l'API est injoignable.
  const [stats, setStats] = useState(null)
  useEffect(() => {
    statsAPI.publiques().then((r) => setStats(r.data)).catch(() => {})
  }, [])

  const [error, setError] = useState('')

  const HOME_BY_ROLE = { client: '/dashboard', expert: '/dashboard', admin: '/admin' }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authAPI.login(email, pwd)
      const { access_token, user } = res.data
      const userInfo = user || (() => {
        const payload = JSON.parse(atob(access_token.split('.')[1]))
        return { name: payload.name || email.split('@')[0], role: payload.role || 'client' }
      })()
      ouvrirSession(access_token, userInfo, rester)
      navigate(HOME_BY_ROLE[userInfo.role] || '/dashboard')
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect.')
      } else if (err.response?.status === 403) {
        setError("Ce compte est désactivé. Contactez l'administrateur.")
      } else if (!err.response) {
        setError('Serveur injoignable. Vérifiez votre connexion, puis réessayez.')
      } else {
        setError(messageErreur(err, 'Erreur de connexion. Veuillez réessayer.'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2" style={{ background: '#F5F6FA' }}>
      {/* Left: branding */}
      <div
        className="relative overflow-hidden flex flex-col justify-between gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:gap-0 lg:px-[72px] lg:py-[60px]"
        style={{ background: 'linear-gradient(160deg, #0F1929 0%, #153D66 70%, #1F5C99 100%)' }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: -100, top: '30%', width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(42,122,204,0.2), transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3.5">
          <div
            className="flex items-center justify-center rounded-[11px] flex-shrink-0"
            style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #2A7ACC, #3B8FDB)',
              boxShadow: '0 0 30px rgba(59,143,219,0.4)',
            }}
          >
            {cloneIcon(Icons.shield, { color: '#fff', size: 24 })}
          </div>
          <div>
            <div className="text-white font-bold text-[19px] tracking-[-0.02em]">CyberGuardian</div>
            <div className="text-[11px] uppercase tracking-[0.1em] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
              EASM Platform 
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative max-w-[480px]">
          <span className="[&>span]:whitespace-normal">
            <Badge color="blue" icon={Icons.shield}>Nouveau · Analyse GitHub + Rapports intelligents</Badge>
          </span>
          <h2 className="text-white text-[26px] sm:text-[32px] lg:text-[38px] font-bold leading-[1.15] tracking-[-0.025em] mt-5">
            Protégez votre surface d'attaque externe
          </h2>
          <p className="text-[14px] sm:text-[15px] leading-relaxed mt-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Évaluation automatisée de la posture de sécurité pour les PME sénégalaises. Analyse DNS, TLS, en-têtes, ports et réputation, rapports IA en français, mise en relation avec des experts certifiés.
          </p>

          <div className="grid grid-cols-3 gap-3 sm:gap-3.5 mt-6 lg:mt-9">
            {[
              { n: stats ? String(stats.scans)   : '—', l: 'Scans réalisés' },
              { n: stats ? String(stats.outils)  : '—', l: 'Outils MCP' },
              { n: stats ? String(stats.experts) : '—', l: 'Experts validés' },
            ].map((s) => (
              <div key={s.l} className="py-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-white text-[20px] sm:text-[24px] font-bold font-mono tracking-[-0.02em]">{s.n}</div>
                <div className="text-[11px] mt-0.5 tracking-[0.02em]" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* Right: form */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:max-w-[560px] lg:px-[72px] lg:py-[60px]">
        <div className="mb-8">
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-[-0.025em] text-gray-900">Se connecter</h1>
          <p className="text-sm text-gray-500 mt-1.5">Accédez à votre tableau de bord EASM</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <LabeledInput label="Email" icon={Icons.mail} value={email} onChange={setEmail} placeholder="vous@entreprise.sn" type="email" autoComplete="username" />
          <LabeledInput
            label="Mot de passe"
            icon={Icons.lock}
            value={pwd}
            onChange={setPwd}
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            action={
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="bg-transparent border-none cursor-pointer p-1 text-gray-500 hover:text-gray-600"
              >
                {cloneIcon(Icons.eye, { size: 16, color: 'currentColor' })}
              </button>
            }
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-between items-center text-[13px] mt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                checked={rester}
                onChange={(e) => setRester(e.target.checked)}
                className="accent-blue-700"
              />
              Rester connecté
            </label>
            <button
              type="button"
              onClick={() => setAide((a) => !a)}
              className="text-blue-700 font-medium hover:underline bg-transparent border-none cursor-pointer p-0"
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* La réinitialisation en autonomie n'existe pas encore : mieux vaut
              indiquer la marche à suivre qu'un lien qui ne mène nulle part. */}
          {aide && (
            <div className="rounded-[var(--cg-radius)] border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-600">
              La réinitialisation se fait par l'administrateur. Écrivez à{' '}
              <span className="font-medium text-slate-800">admin@cyberguardian.sn</span> depuis
              l'adresse du compte concerné.
            </div>
          )}

          <Button variant="primary" size="lg" type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? 'Connexion…' : 'Se connecter →'}
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6 text-gray-500 text-xs">
          <div className="flex-1 h-px bg-gray-200" />
          OU
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate('/register')}>
          Créer un compte CyberGuardian
        </Button>

        <div className="mt-5 p-3.5 rounded-[10px] flex gap-3 items-start" style={{ background: '#F3F8FD', border: '1px solid #E8F1FA' }}>
          {cloneIcon(Icons.shield, { size: 18, color: '#1F5C99' })}
          <div className="text-xs text-blue-700 leading-relaxed">
            <strong>Accès protégé.</strong> Vos identifiants sont transmis de façon sécurisée et votre session est gérée par jeton d'authentification.
          </div>
        </div>
      </div>
    </div>
  )
}