import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { supabase, type DbTestResult } from '../lib/supabase'

export default function TestHistory() {
  const [rows, setRows]       = useState<DbTestResult[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('test_results').select('*').order('created_at', { ascending: false }).limit(20)
    if (data) setRows(data as DbTestResult[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const ch = supabase.channel('test-results-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'test_results' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  if (loading) return <div className="flex items-center gap-2 text-slate-400 text-sm py-4 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
  if (!rows.length) return <p className="text-sm text-slate-500 text-center py-4">No test runs yet.</p>

  return (
    <div className="divide-y divide-slate-700/40">
      {rows.map(r => (
        <div key={r.id} className="flex items-center justify-between py-2.5 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {r.success ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            <div className="min-w-0">
              <div className="text-sm text-slate-200 font-medium truncate">{r.endpoint}</div>
              <div className="text-xs text-slate-500">{new Date(r.created_at).toLocaleTimeString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {r.status_code != null && <span className={`text-xs font-mono ${r.success ? 'text-green-400' : 'text-red-400'}`}>{r.status_code}</span>}
            {r.response_time_ms != null && <span className="flex items-center gap-0.5 text-xs text-slate-400"><Clock className="w-3 h-3" />{r.response_time_ms}ms</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
