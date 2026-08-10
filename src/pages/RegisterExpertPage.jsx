import { useState, useRef } from 'react'
import { Card, Badge, Button, LabeledInput, PageHeader } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import { expertAPI } from '../lib/api'

function FileUpload({ label, hint, file, onChange }) {
  const ref = useRef()
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        className="p-5 rounded-[10px] flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200"
        style={{
          border: `2px dashed ${file ? '#10B981' : '#D1D5DB'}`,
          background: file ? '#D1FAE5' : '#F5F6FA',
        }}
      >
        {cloneIcon(file ? Icons.checkCircle : Icons.upload, {
          size: 22,
          color: file ? '#10B981' : '#9CA3AF',
        })}
        <div
          className="text-[12.5px] font-medium text-center"
          style={{ color: file ? '#059669' : '#374151' }}
        >
          {file ? file.name : 'Cliquez pour téléverser'}
        </div>
        <div className="text-[11px] text-gray-500">{hint}</div>
        <input ref={ref} type="file" className="hidden" onChange={(e) => onChange(e.target.files[0])} />
      </div>
    </div>
  )
}

export default function RegisterExpertPage() {
  const [form, setForm] = useState({ cni: '', level: '', specialty: '', cniFile: null, diplomaFile: null })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = new FormData()
      data.append('cni', form.cni)
      data.append('level', form.level)
      data.append('specialty', form.specialty)
      if (form.cniFile) data.append('cni_file', form.cniFile)
      if (form.diplomaFile) data.append('diploma_file', form.diplomaFile)
      await expertAPI.apply(data)
    } catch {
      // demo fallback
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div>
        <PageHeader title="Devenir expert CyberGuardian" subtitle="Rejoignez notre réseau d'experts certifiés au Sénégal" />
        <Card className="p-10 text-center max-w-lg mx-auto mt-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            {cloneIcon(Icons.checkCircle, { size: 32, color: '#10B981' })}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Candidature envoyée !</h2>
          <p className="text-sm text-gray-500">
            Votre dossier sera vérifié sous 48h. Vous recevrez un email de confirmation à votre adresse enregistrée.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Devenir expert CyberGuardian" subtitle="Rejoignez notre réseau d'experts certifiés au Sénégal" />

      {/* Info banner */}
      <div
        className="flex gap-3.5 items-start p-4 rounded-xl mb-5"
        style={{ background: 'linear-gradient(135deg, #F3F8FD, #fff)', border: '1px solid #E8F1FA' }}
      >
        <div className="w-10 h-10 rounded-[10px] bg-blue-700 flex items-center justify-center flex-shrink-0">
          {cloneIcon(Icons.clock, { color: '#fff', size: 20 })}
        </div>
        <div>
          <div className="text-sm font-semibold text-blue-700">Dossier vérifié sous 48h</div>
          <div className="text-[12.5px] text-gray-600 mt-0.5 leading-relaxed max-w-[76ch]">
            L'administrateur CyberGuardian contrôle manuellement votre pièce d'identité et votre dernier diplôme.
            Vous recevrez un email de confirmation.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Identité d'un côté, justificatifs de l'autre au-delà de 1160 px :
            deux étapes distinctes du dossier, et la page cesse de laisser la
            moitié de sa largeur vide. */}
        <div className="grid items-start gap-5 min-[1160px]:grid-cols-2">
          <Card className="p-5 sm:p-7">
            <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-4">
              Informations personnelles
            </div>

            <div className="flex flex-col gap-[18px]">
              <LabeledInput
                label="Numéro de Carte Nationale d'Identité (CNI)"
                icon={Icons.badge}
                placeholder="ex: 1 789 1985 0 0421"
                value={form.cni}
                onChange={(v) => setForm({ ...form, cni: v })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Niveau d'études</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="w-full px-4 py-3 rounded-[10px] border border-gray-300 text-sm outline-none bg-white cursor-pointer focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
                    style={{ color: form.level ? '#111827' : '#9CA3AF' }}
                  >
                    <option value="">Sélectionnez…</option>
                    {['Licence', 'Master 1', 'Master 2', 'Ingénieur', 'Doctorat'].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Spécialité</label>
                  <select
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    className="w-full px-4 py-3 rounded-[10px] border border-gray-300 text-sm outline-none bg-white cursor-pointer focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10"
                    style={{ color: form.specialty ? '#111827' : '#9CA3AF' }}
                  >
                    <option value="">Sélectionnez…</option>
                    {['DNS & Email', 'Sécurité Web', 'Audit sécurité', 'Réseau & Pentest', 'Cloud Security', 'DevSecOps', 'Cryptographie'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-7">
            <div className="text-[13px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-1.5">
              Pièces justificatives
            </div>
            <p className="text-[12.5px] text-gray-500 mb-4 leading-relaxed">
              Documents lisibles et en cours de validité. Ils ne servent qu'à la vérification de votre identité.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUpload
                label="Photo de votre CNI"
                hint="JPG, PNG · max 5 MB"
                file={form.cniFile}
                onChange={(f) => setForm({ ...form, cniFile: f })}
              />
              <FileUpload
                label="Dernier diplôme"
                hint="PDF · max 5 MB"
                file={form.diplomaFile}
                onChange={(f) => setForm({ ...form, diplomaFile: f })}
              />
            </div>
          </Card>
        </div>

        <Card className="p-5 sm:p-7 mt-5">
          <label className="flex items-start gap-2.5 text-[12.5px] text-gray-600 leading-relaxed cursor-pointer">
            <input type="checkbox" className="accent-blue-700 mt-0.5" required />
            <span>
              Je certifie l'authenticité des documents fournis et j'accepte la{' '}
              <a href="#" className="text-blue-700 hover:underline">charte des experts CyberGuardian</a>.
            </span>
          </label>

          <div className="flex flex-col-reverse gap-2.5 mt-5 pt-5 border-t border-gray-100 sm:flex-row [&>button]:w-full sm:[&>button]:w-auto">
            <Button variant="secondary" type="button" onClick={() => window.history.back()}>Annuler</Button>
            <div className="hidden flex-1 sm:block" />
            <Button variant="primary" icon={Icons.send} type="submit" disabled={loading}>
              {loading ? 'Envoi…' : 'Soumettre ma candidature'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
