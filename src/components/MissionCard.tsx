import { Play, Loader2, CheckCircle2, XCircle, Circle } from 'lucide-react'
import type { Mission } from '../types/mission'
import MissionStatusIndicator from './MissionStatusIndicator'

interface Props { mission: Mission; onRun: (id: string) => void }

function Icon({ s }: { s: Mission['status'] }) {
  if (s === 'passed')  return <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
  if (s === 'failed')  return <XCircle      className="w-4 h-4 text-red-400 shrink-0" />
  if (s === 'running') return <Loader2      className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
  return <Circle className="w-4 h-4 text-slate-500 shrink-0" />
}

export default function MissionCard({ mission: m, onRun }: Props) {
  return (
    <div className="flex items-center justify-between py-2.5 gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon s={m.status} />
        <div className="min-w-0">
          <div className="text-sm text-slate-200 font-medium leading-tight">{m.title}</div>
          {m.description && <div className="text-xs text-slate-500 truncate">{m.description}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <MissionStatusIndicator status={m.status} />
        {m.status !== 'running' && (
          <button
            onClick={() => onRun(m.id)}
            className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            <Play className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
