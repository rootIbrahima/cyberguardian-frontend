import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ASSET_TYPES } from '../lib/constants'
import { scanAPI } from '../lib/api'
import { Button } from './ui'
import { cloneIcon, Icons } from './Icons'

const TYPE_ICONS = {
  domain: Icons.domain,
  ip:     Icons.ip,
  url:    Icons.url,
  github: Icons.github,
}

export default function ScanForm() {
  const navigate = useNavigate()
  const [assetType, setAssetType] = useState('domain')
  const [input, setInput]         = useState('')
  const [consent, setConsent]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const currentAsset = ASSET_TYPES.find((a) => a.key === assetType)

  const handleScan = async () => {
    if (!input.trim() || !consent) return
    setLoading(true)
    setError('')

    let scanId = 'demo'
    try {
      const res = await scanAPI.launch(input.trim(), assetType)
      scanId = res.data?.id ?? 'demo'
    } catch {
      /* demo mode, no backend */
    }

    setLoading(false)
    navigate(`/scan-progress/${scanId}`, {
      state: { target: input.trim(), assetType },
    })
  }

  return (
    <div className="bg-white rounded-[14px] border border-gray-200 p-[26px] mb-[22px]">
      <div className="text-[15px] font-semibold mb-4">Nouveau scan</div>

      {/* Type tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {ASSET_TYPES.map((t) => {
          const active = assetType === t.key
          return (
            <button
              key={t.key}
              onClick={() => { setAssetType(t.key); setInput('') }}
              className="flex items-center gap-1.5 px-4 py-[9px] rounded-lg border text-[13px] font-medium cursor-pointer transition-all duration-150"
              style={{
                borderColor: active ? '#1F5C99' : '#E5E7EB',
                background:  active ? '#E8F1FA' : '#fff',
                color:       active ? '#1F5C99' : '#4B5563',
              }}
            >
              {cloneIcon(TYPE_ICONS[t.key], { size: 16, color: active ? '#1F5C99' : '#9CA3AF' })}
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Input row */}
      <div className="flex gap-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder={currentAsset?.placeholder}
          className="flex-1 px-4 py-3 rounded-[10px] border border-gray-300 text-sm font-mono outline-none transition-all focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 placeholder-gray-400"
        />
        <Button
          variant="primary"
          onClick={handleScan}
          disabled={!input.trim() || !consent || loading}
          icon={loading ? null : Icons.scan}
        >
          {loading
            ? <><span className="spinner mr-2" />Lancement…</>
            : 'Lancer le scan'}
        </Button>
      </div>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {/* Consent */}
      <label className="flex items-center gap-2 mt-3 cursor-pointer text-xs text-gray-500">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="accent-blue-700 w-4 h-4"
        />
        <span>
          Je confirme être <strong>légalement autorisé</strong> à scanner cet actif et j'accepte les{' '}
          <a href="#" className="text-blue-700 hover:underline">conditions d'utilisation</a>
          {' '}(Loi sénégalaise 2008-11 sur la cybercriminalité).
        </span>
      </label>
    </div>
  )
}
