import { useState } from 'react'
import { Send, Loader2, Clock, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react'
import type { ApiRequest } from '../types/api'
import ApiStatusIndicator from './ApiStatusIndicator'

interface Props { request: ApiRequest; onRun: (r: ApiRequest) => void }

export default function ApiCard({ request: r, onRun }: Props) {
  const [open, setOpen] = useState(false)
  const busy = r.status === 'running'
  const done = r.status === 'success' || r.status === 'error'

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {r.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
          {r.status === 'error'   && <XCircle      className="w-4 h-4 text-red-400 shrink-0" />}
          {r.status === 'running' && <Loader2      className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />}
          {r.status === 'pending' && <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />}
          <div className="min-w-0">
            <div className="text-sm text-slate-200 font-medium leading-tight">{r.title}</div>
            <div className="text-xs text-slate-500 font-mono truncate">
              <span className="text-slate-600 mr-1">{r.method}</span>{r.endpoint}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {done && <>
            {r.statusCode != null && <span className={`text-xs font-mono ${r.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>{r.statusCode}</span>}
            {r.responseTime != null && <span className="flex items-center gap-0.5 text-xs text-slate-400"><Clock className="w-3 h-3" />{r.responseTime}ms</span>}
            <button onClick={() => setOpen(p => !p)} className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-700 hover:bg-slate-600 text-slate-400 transition-colors">
              {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </>}
          {!done && <ApiStatusIndicator status={r.status} />}
          <button onClick={() => onRun(r)} disabled={busy} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 transition-colors">
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Send
          </button>
        </div>
      </div>
      {done && open && (
        <div className="mt-3 rounded-lg bg-slate-900 border border-slate-700/60 p-3 overflow-auto max-h-40">
          <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all">
            {r.error && r.status === 'error' && !r.response ? r.error
              : typeof r.response === 'string' ? r.response
              : JSON.stringify(r.response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
