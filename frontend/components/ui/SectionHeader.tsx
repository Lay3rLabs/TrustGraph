'use client'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  description?: string
}

export function SectionHeader({
  title,
  subtitle,
  description,
}: SectionHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="terminal-command text-lg">{title}</div>
      {subtitle && <div className="system-message">{subtitle}</div>}
      {description && (
        <div className="terminal-text text-sm">{description}</div>
      )}
    </div>
  )
}
