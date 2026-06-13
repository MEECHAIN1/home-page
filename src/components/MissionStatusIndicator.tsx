import type { MissionStatus } from '../types/mission'

const cfg: Record<MissionStatus, { color: string; dot: string; label: string }> = {
  pending: { color: 'text-slate-400', dot: 'bg-slate-400', label: 'Pending' },
  running: { color: 'text-blue-400',  dot: 'bg-blue-400',  label: 'Running' },
  passed:  { color: 'text-green-400', dot: 'bg-green-400', label: 'Passed'  },
  failed:  { color: 'text-red-400',   dot: 'bg-red-400',   label: 'Failed'  },
}

export default function MissionStatusIndicator({ status }: { status: MissionStatus }) {
  const c = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  )
}
