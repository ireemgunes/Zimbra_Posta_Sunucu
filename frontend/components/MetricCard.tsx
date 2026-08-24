import clsx from 'clsx'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: string
  iconColor?: string
  sub?: React.ReactNode
  progress?: number
  progressColor?: string
}

export default function MetricCard({
  label,
  value,
  unit,
  icon,
  iconColor = 'text-primary',
  sub,
  progress,
  progressColor = 'bg-primary',
}: MetricCardProps) {
  return (
    <div className="flex flex-col p-md bg-surface-container rounded-xl shadow-sm relative overflow-hidden group">
      {icon && (
        <div className="absolute top-0 right-0 p-sm opacity-20 group-hover:opacity-40 transition-opacity">
          <span className={clsx('material-symbols-outlined text-[48px]', iconColor)}>{icon}</span>
        </div>
      )}
      <span className="text-label-caps text-on-surface-variant uppercase mb-xs relative z-10">{label}</span>
      <div className="flex items-baseline gap-xs relative z-10">
        <span className="font-mono text-display-lg text-on-surface">{value}</span>
        {unit && <span className="text-code-sm text-on-surface-variant font-mono">{unit}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-sm w-full bg-surface-container-highest rounded-full h-1 overflow-hidden relative z-10">
          <div className={clsx('h-full rounded-full transition-all duration-500', progressColor)} style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
      {sub && <div className="mt-sm relative z-10">{sub}</div>}
    </div>
  )
}
