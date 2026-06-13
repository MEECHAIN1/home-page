import { Send, Loader2 } from 'lucide-react'
import type { ApiRequest } from '../types/api'
import ApiCard from './ApiCard'

interface Props {
  requests: ApiRequest[]
  onRun: (r: ApiRequest) => void
  onRunAll: () => Promise<void>
  onReset: () => void
}

export default function ApiList({ requests, onRun, onRunAll, onReset }: Props) {
  const tested = requests.filter(r => r.status !== 'pending')
  const ok     = tested.filter(r => r.status === 'success').length
  const busy   = requests.some(r => r.status === 'running')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">{tested.length}/{requests.length} tested</span>
          {tested.length > 0 && <span className="text-green-400 font-medium">{ok} ok</span>}
          {tested.length > ok && <span className="text-red-400 font-medium">{tested.length - ok} errors</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">Reset</button>
          <button onClick={onRunAll} disabled={busy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors">
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Test All
          </button>
        </div>
      </div>

      {(['RPC', 'API'] as const).map(group => (
        <div key={group} className="rounded-xl border border-slate-700/60 bg-slate-800/40 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-700/60 bg-slate-800/60">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {group === 'RPC' ? 'RPC Calls' : 'API Endpoints'}
            </span>
          </div>
          <div className="divide-y divide-slate-700/40">
            {requests.filter(r => r.group === group).map(r => (
              <ApiCard key={r.id} request={r} onRun={onRun} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
