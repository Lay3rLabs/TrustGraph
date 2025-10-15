'use client'

interface MetricCardProps {
  label: string
  value: string
  change?: string
  color?: 'default' | 'bright' | 'system' | 'dim'
}

export function MetricCard({
  label,
  value,
  change,
  color = 'bright',
}: MetricCardProps) {
  const colorClasses = {
    default: 'terminal-text',
    bright: 'terminal-bright',
    system: 'system-message',
    dim: 'terminal-dim',
  }

  return (
    <div className="border border-gray-700 bg-black/10 p-4 rounded-sm">
      <div className="terminal-dim text-xs mb-1">{label.toUpperCase()}</div>
      <div className={`text-lg ${colorClasses[color]}`}>{value}</div>
      {change && <div className="system-message text-xs mt-1">{change}</div>}
    </div>
  )
}
