import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar, Button } from './ui'
import { cloneIcon, Icons } from './Icons'
import { messageAPI } from '../lib/api'
import { lireUtilisateur } from '../lib/session'

export default function ExpertCard({ expert }) {
  const navigate = useNavigate()
  const [contacting, setContacting] = useState(false)
  const isClient = (lireUtilisateur().role || 'client') === 'client'

  const contact = async () => {
    setContacting(true)
    try {
      // Crée (ou retrouve) la conversation côté backend avant d'ouvrir la messagerie
      if (expert.user_id) await messageAPI.create(expert.user_id)
    } catch {}
    setContacting(false)
    navigate('/messages')
  }

  return (
    <div className="bg-white rounded-[14px] border border-gray-200 p-5 flex flex-col gap-4 transition-all duration-200 hover:border-blue-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3">
        <Avatar name={expert.name} color={expert.color} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold tracking-[-0.01em] truncate">{expert.name}</span>
            <span title="Identité vérifiée : CNI et diplôme contrôlés">
              {cloneIcon(Icons.checkCircle, { size: 14, color: '#10B981' })}
            </span>
          </div>
          <div className="text-[12.5px] text-blue-700 font-medium">{expert.specialty}</div>
        </div>
        {expert.rating != null ? (
          <div className="flex items-center gap-1 text-[12.5px] font-semibold flex-shrink-0">
            {cloneIcon(Icons.star, { size: 13, fill: '#F59E0B', color: '#F59E0B' })}
            <span className="text-gray-700 font-mono">{expert.rating.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-[11px] text-gray-500 flex-shrink-0">Nouveau</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3.5 border-t border-gray-100">
        <div className="text-[12px] text-gray-500">
          {expert.missions} mission{expert.missions > 1 ? 's' : ''}
        </div>
        {isClient && (
          <Button variant="primary" size="sm" icon={Icons.message} onClick={contact} disabled={contacting}>
            {contacting ? 'Ouverture…' : 'Contacter'}
          </Button>
        )}
      </div>
    </div>
  )
}
