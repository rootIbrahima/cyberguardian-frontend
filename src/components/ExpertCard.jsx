import { useNavigate } from 'react-router-dom'
import { Avatar, Badge, Button } from './ui'
import { cloneIcon, Icons } from './Icons'

export default function ExpertCard({ expert }) {
  const navigate = useNavigate()

  return (
    <div
      className="bg-white rounded-[14px] border border-gray-200 p-[22px] flex flex-col gap-3.5 transition-all duration-200 hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)] hover:border-blue-100 cursor-default"
    >
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <Avatar name={expert.name} color={expert.color} size={54} />
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-semibold tracking-[-0.01em]">{expert.name}</div>
          <div className="text-[13px] text-blue-700 font-medium">{expert.specialty}</div>
          <div className="text-xs text-gray-500 mt-0.5">{expert.city} · Sénégal</div>
        </div>
        <div className="flex items-center gap-1 text-[13px] font-semibold">
          {cloneIcon(Icons.star, { size: 14, fill: '#F59E0B', color: '#F59E0B' })}
          <span className="text-gray-900 font-mono">{expert.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-1.5 flex-wrap">
        <Badge color="green" icon={Icons.checkCircle}>Validé CNI + Diplôme</Badge>
        <Badge color="gray">{expert.missions} missions</Badge>
      </div>

      {/* Price + CTA */}
      <div className="flex justify-between items-center px-3.5 py-3 bg-gray-50 rounded-[10px] border border-gray-100">
        <div>
          <div className="text-[11px] text-gray-500 font-medium">Tarif mission</div>
          <div className="text-[18px] font-bold font-mono tracking-[-0.01em]">
            {expert.price.toLocaleString('fr-FR')}
            <span className="text-[11px] text-gray-500 font-medium ml-1">FCFA</span>
          </div>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={Icons.message}
          onClick={() => navigate('/messages')}
        >
          Contacter
        </Button>
      </div>
    </div>
  )
}