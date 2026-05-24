import { Bell, Settings } from 'lucide-react'
import { cloneIcon } from './Icons'

export function Avatar({ name, color, size = 36, initials }) {
  const i = initials || name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color || '#1F5C99',
        fontSize: size * 0.38,
      }}
    >
      {i}
    </div>
  )
}

const BADGE_COLORS = {
  blue:   { bg: '#E8F1FA', fg: '#1F5C99' },
  green:  { bg: '#D1FAE5', fg: '#059669' },
  orange: { bg: '#FED7AA', fg: '#C2691A' },
  red:    { bg: '#FEE2E2', fg: '#DC2626' },
  gray:   { bg: '#F3F4F6', fg: '#374151' },
  yellow: { bg: '#FEF3C7', fg: '#A16207' },
}

export function Badge({ children, color = 'blue', icon }) {
  const c = BADGE_COLORS[color] || BADGE_COLORS.blue
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md font-semibold whitespace-nowrap text-[11px]"
      style={{ background: c.bg, color: c.fg, padding: '4px 10px' }}
    >
      {icon && cloneIcon(icon, { size: 12, color: c.fg })}
      {children}
    </span>
  )
}

export function Card({ children, className = '', style, ...props }) {
  return (
    <div
      className={`bg-white rounded-[14px] border border-gray-200 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  )
}

const BTN_VARIANTS = {
  primary:   'bg-blue-700 text-white border-transparent hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed',
  secondary: 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50',
  ghost:     'bg-transparent text-blue-700 border-transparent hover:bg-blue-50',
  danger:    'bg-white text-red-500 border-red-100 hover:bg-red-50',
  success:   'bg-green-500 text-white border-transparent hover:bg-green-600',
}

const BTN_SIZES = {
  sm: 'px-[14px] py-[7px] text-xs gap-1.5 rounded-[7px]',
  md: 'px-[18px] py-[10px] text-sm gap-2 rounded-[9px]',
  lg: 'px-[26px] py-[13px] text-[15px] gap-2 rounded-[9px]',
}

export function Button({ children, variant = 'primary', icon, size = 'md', onClick, disabled, className = '', type = 'button', style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`inline-flex items-center justify-center font-semibold border transition-all duration-150 active:scale-[0.98] ${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`}
    >
      {icon && cloneIcon(icon, { size: size === 'sm' ? 14 : 16, color: 'currentColor' })}
      {children}
    </button>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', className = '', style, ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-[10px] border border-gray-300 text-sm font-mono outline-none transition-all focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 bg-white text-gray-900 placeholder-gray-400 ${className}`}
      style={style}
      {...props}
    />
  )
}

export function LabeledInput({ label, icon, value, onChange, placeholder, type = 'text', action }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5 tracking-[0.01em]">
        {label}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-gray-400">
            {cloneIcon(icon, { size: 17, color: 'currentColor' })}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-3 rounded-[10px] border border-gray-300 text-sm font-sans outline-none transition-all focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 bg-white text-gray-900 placeholder-gray-400 ${icon ? 'pl-11 pr-11' : 'px-4'}`}
        />
        {action && <div className="absolute right-2.5">{action}</div>}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex justify-between items-start mb-7 gap-4">
      <div>
        <h1 className="text-[24px] font-bold tracking-[-0.02em] text-gray-900">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex gap-2 items-center">
        {actions}
        <button className="w-[38px] h-[38px] rounded-[10px] border border-gray-200 bg-white flex items-center justify-center text-gray-700 relative hover:bg-gray-50 transition-colors">
          <Bell size={18} strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>
        <button className="w-[38px] h-[38px] rounded-[10px] border border-gray-200 bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors">
          <Settings size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}