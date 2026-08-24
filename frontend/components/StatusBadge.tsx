import clsx from 'clsx'

type StatusType = 'active' | 'suspended' | 'deferred' | 'hold' | 'error' | 'high-load' | 'online' | 'offline'

const STATUS_CONFIG: Record<StatusType, { color: string; dot: string; label: string }> = {
  active:     { color: 'bg-secondary/10 text-secondary', dot: 'bg-secondary', label: 'Active' },
  online:     { color: 'bg-secondary/10 text-secondary', dot: 'bg-secondary', label: 'Online' },
  suspended:  { color: 'bg-surface-container-highest text-on-surface-variant', dot: 'bg-on-surface-variant', label: 'Suspended' },
  offline:    { color: 'bg-surface-container-highest text-on-surface-variant', dot: 'bg-on-surface-variant', label: 'Offline' },
  deferred:   { color: 'bg-tertiary/10 text-tertiary', dot: 'bg-tertiary', label: 'Deferred' },
  hold:       { color: 'bg-error/10 text-error', dot: 'bg-error', label: 'Hold' },
  error:      { color: 'bg-error/10 text-error', dot: 'bg-error', label: 'DNS Issue' },
  'high-load':{ color: 'bg-tertiary/10 text-tertiary', dot: 'bg-tertiary', label: 'High Load' },
}

export default function StatusBadge({ status }: { status: StatusType | string }) {
  const key = (status as StatusType) in STATUS_CONFIG ? (status as StatusType) : 'active'
  const cfg = STATUS_CONFIG[key]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-code-sm font-mono font-medium', cfg.color)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot, key === 'active' && 'animate-pulse')} />
      {cfg.label}
    </span>
  )
}
