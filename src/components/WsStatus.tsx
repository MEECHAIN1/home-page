import { useEffect, useRef, useState } from 'react'
import { Wifi, WifiOff, Activity } from 'lucide-react'

type State = 'connecting' | 'connected' | 'disconnected' | 'error'

export default function WsStatus() {
  const [state, setState]     = useState<State>('connecting')
  const [lastMsg, setLastMsg] = useState<string | null>(null)
  const wsRef   = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function connect() {
    try {
      const ws = new WebSocket(import.meta.env.VITE_WS_URL as string)
      wsRef.current = ws
      setState('connecting')
      ws.onopen    = () => setState('connected')
      ws.onmessage = (e) => {
        try { const d = JSON.parse(e.data as string); setLastMsg((d.msg as string) ?? JSON.stringify(d)) }
        catch { setLastMsg(e.data as string) }
      }
      ws.onerror = () => setState('error')
      ws.onclose = () => { setState('disconnected'); retryRef.current = setTimeout(connect, 5000) }
    } catch {
      setState('error'); retryRef.current = setTimeout(connect, 5000)
    }
  }

  useEffect(() => {
    connect()
    return () => { wsRef.current?.close(); if (retryRef.current) clearTimeout(retryRef.current) }
  }, [])

  const color = state === 'connected' ? 'text-green-400' : state === 'connecting' ? 'text-blue-400' : 'text-slate-500'

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
      {state === 'connected'   && <Wifi     className="w-3.5 h-3.5 text-green-400" />}
      {state === 'connecting'  && <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />}
      {(state === 'disconnected' || state === 'error') && <WifiOff className="w-3.5 h-3.5 text-slate-500" />}
      <span className={`text-xs font-medium ${color} capitalize`}>WS: {state}</span>
      {lastMsg && <span className="hidden sm:block text-xs text-slate-500 max-w-28 truncate">{lastMsg}</span>}
    </div>
  )
}
