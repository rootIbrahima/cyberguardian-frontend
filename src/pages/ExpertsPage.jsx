import { useState, useEffect } from 'react'
import { PageHeader } from '../components/ui'
import { cloneIcon, Icons } from '../components/Icons'
import ExpertCard from '../components/ExpertCard'
import { MOCK_EXPERTS } from '../lib/constants'
import { expertAPI } from '../lib/api'

const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'DNS & Email', label: 'DNS & Email' },
  { key: 'Sécurité Web', label: 'Sécurité Web' },
  { key: 'Audit sécurité', label: 'Audit' },
  { key: 'Réseau & Pentest', label: 'Réseau' },
]

export default function ExpertsPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [experts, setExperts] = useState(MOCK_EXPERTS)

  useEffect(() => {
    expertAPI.list()
      .then((res) => { if (Array.isArray(res.data) && res.data.length) setExperts(res.data) })
      .catch(() => {})   // backend hors ligne, annuaire de démonstration conservé
  }, [])

  const filtered = experts.filter(
    (e) =>
      (filter === 'all' || e.specialty === filter) &&
      e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Experts cybersécurité"
        subtitle={`${experts.length} expert${experts.length > 1 ? 's' : ''} vérifié${experts.length > 1 ? 's' : ''}, identité et diplôme contrôlés`}
        actions={
          <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-[10px] px-3.5">
            {cloneIcon(Icons.search, { size: 16, color: '#9CA3AF' })}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="border-none outline-none py-[9px] text-[13px] w-[200px] bg-transparent placeholder-gray-400"
            />
          </div>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-[22px] flex-wrap">
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-2 rounded-lg border text-[13px] font-medium cursor-pointer transition-all duration-150"
              style={{
                borderColor: active ? '#1F5C99' : '#E5E7EB',
                background: active ? '#1F5C99' : '#fff',
                color: active ? '#fff' : '#374151',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 text-sm">
          Aucun expert trouvé pour ces critères.
        </div>
      )}
    </div>
  )
}