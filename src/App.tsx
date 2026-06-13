import { Shield, ExternalLink, Droplets } from 'lucide-react'
import { useMissionStatus } from './hooks/useMissionStatus'
import { useApiStatus } from './hooks/useApiStatus'
import MissionList from './components/MissionList'
import ApiList from './components/ApiList'
import WsStatus from './components/WsStatus'
import TestHistory from './components/TestHistory'

export default function App() {
  const { missions, loading, runMission, resetAll: resetMissions } = useMissionStatus()
  const { requests, runRequest, runAll, resetAll: resetRequests } = useApiStatus()

  async function runAllMissions() {
    for (const m of missions.filter(m => m.status !== 'running')) await runMission(m.id)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-slate-100 text-sm block">{import.meta.env.VITE_CHAIN_NAME}</span>
              <span className="text-xs text-slate-500 font-mono">chain:{import.meta.env.VITE_CHAIN_ID}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WsStatus />
            <a href={import.meta.env.VITE_FAUCET_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors">
              <Droplets className="w-3.5 h-3.5" /> Faucet
            </a>
            <a href={import.meta.env.VITE_EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Explorer
            </a>
          </div>
        </div>
      </header>

      {/* Info bar */}
      <div className="border-b border-slate-800/60 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center gap-x-6 gap-y-1">
          <Stat label="RPC"      value={import.meta.env.VITE_RPC_URL} mono />
          <Stat label="Token"    value={import.meta.env.VITE_TOKEN_SYMBOL} />
          <Stat label="Supply"   value="10,000,000 MEE" />
          <Stat label="Decimals" value="18" />
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section>
            <H title="Mission System" sub="QA phases · test tracking" />
            {loading
              ? <p className="text-slate-500 text-sm py-8 text-center">Loading missions…</p>
              : <MissionList missions={missions} onRun={runMission} onRunAll={runAllMissions} onReset={resetMissions} />
            }
          </section>
          <section className="flex flex-col gap-6">
            <div>
              <H title="API Client" sub="Live endpoint testing" />
              <ApiList requests={requests} onRun={runRequest} onRunAll={runAll} onReset={resetRequests} />
            </div>
            <div>
              <H title="Test History" sub="Last 20 requests" />
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-1">
                <TestHistory />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-slate-500">{label}:</span>
      <span className={`text-slate-300 truncate max-w-48 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function H({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-slate-100 m-0 p-0 leading-snug">{title}</h2>
      <p className="text-xs text-slate-500 m-0">{sub}</p>
    </div>
  )
}
