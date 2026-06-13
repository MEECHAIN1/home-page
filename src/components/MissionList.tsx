import { useState } from 'react'
import { ChevronRight, Play, Loader2 } from 'lucide-react'
import type { Mission } from '../types/mission'
import MissionCard from './MissionCard'

const PHASE_META: Record<number, { label: string; border: string; accent: string }> = {
  1: { label: 'Phase 1 — Core Connectivity',  border: 'border-blue-500/40 bg-blue-500/5',     accent: 'text-blue-400'    },
  2: { label: 'Phase 2 — Token Operations',   border: 'border-cyan-500/40 bg-cyan-500/5',     accent: 'text-cyan-400'    },
  3: { label: 'Phase 3 — NFT & Transactions', border: 'border-violet-500/40 bg-violet-500/5', accent: 'text-violet-400'  },
  4: { label: 'Phase 4 — Badge & Rewards',    border: 'border-emerald-500/40 bg-emerald-500/5', accent: 'text-emerald-400' },
}

interface Props {
  missions: Mission[]
  onRun: (id: string) => void
  onRunAll: () => Promise<void>
  onReset: () => Promise<void>
}

export default function MissionList({ missions, onRun, onRunAll, onReset }: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true })
  const [busy, setBusy] = useState(false)
  const passed  = missions.filter(m => m.status === 'passed').length
  const failed  = missions.filter(m => m.status === 'failed').length
  const running = missions.some(m => m.status === 'running')

  async function handleRunAll() {
    setBusy(true); await onRunAll(); setBusy(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">{missions.length} missions</span>
          {passed  > 0 && <span className="text-green-400 font-medium">{passed} passed</span>}
          {failed  > 0 && <span className="text-red-400 font-medium">{failed} failed</span>}
          {running && <span className="text-blue-400 font-medium animate-pulse">running…</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">Reset</button>
          <button onClick={handleRunAll} disabled={busy || running} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors">
            {busy || running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Run All
          </button>
        </div>
      </div>

      {[1, 2, 3, 4].map(phase => {
        const pms = missions.filter(m => m.phase === phase)
        if (!pms.length) return null
        const meta = PHASE_META[phase]
        const pc = pms.filter(m => m.status === 'passed').length
        const isOpen = expanded[phase]
        return (
          <div key={phase} className={`rounded-xl border ${meta.border} overflow-hidden`}>
            <button onClick={() => setExpanded(p => ({ ...p, [phase]: !p[phase] }))} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2.5">
                <span className={`font-semibold text-sm ${meta.accent}`}>{meta.label}</span>
                {pc === pms.length && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">All passed</span>}
                {pms.some(m => m.status === 'failed') && pc < pms.length && <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Issues found</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{pc}/{pms.length}</span>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-3 divide-y divide-white/5">
                {pms.map(m => <MissionCard key={m.id} mission={m} onRun={onRun} />)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
