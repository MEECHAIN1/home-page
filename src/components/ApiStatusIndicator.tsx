import type { ApiRequestStatus } from '../types/api'

const cfg: Record<ApiRequestStatus, { color: string; dot: string; label: string }> = {
  pending: { color: 'text-slate-400', dot: 'bg-slate-400', label: 'Pending' },
  running: { color: 'text-blue-400',  dot: 'bg-blue-400',  label: 'Running' },
  success: { color: 'text-green-400', dot: 'bg-green-400', label: 'OK'      },
  error:   { color: 'text-red-400',   dot: 'bg-red-400',   label: 'Error'   },
}

export default function ApiStatusIndicator({ status }: { status: ApiRequestStatus }) {
  const c = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  )
}
