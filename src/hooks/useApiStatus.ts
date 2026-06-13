import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { ApiRequest } from '../types/api'

const RPC    = import.meta.env.VITE_RPC_URL    as string
const API    = import.meta.env.VITE_API_URL    as string
const REWARD = import.meta.env.VITE_REWARD_API as string

const DEFAULTS: ApiRequest[] = [
  { id: 'chainId',    title: 'Chain ID',      endpoint: RPC,                    method: 'POST', group: 'RPC', rpcMethod: 'eth_chainId',    status: 'pending' },
  { id: 'blockNum',   title: 'Block Number',  endpoint: RPC,                    method: 'POST', group: 'RPC', rpcMethod: 'eth_blockNumber', status: 'pending' },
  { id: 'gasPrice',   title: 'Gas Price',     endpoint: RPC,                    method: 'POST', group: 'RPC', rpcMethod: 'eth_gasPrice',    status: 'pending' },
  { id: 'syncing',    title: 'Sync Status',   endpoint: RPC,                    method: 'POST', group: 'RPC', rpcMethod: 'eth_syncing',     status: 'pending' },
  { id: 'health',     title: 'Health Check',  endpoint: `${API}/health`,        method: 'GET',  group: 'API', status: 'pending' },
  { id: 'nftInfo',    title: 'NFT Info',      endpoint: `${API}/nft/info`,      method: 'GET',  group: 'API', status: 'pending' },
  { id: 'badgeVault', title: 'Badge Vault',   endpoint: `${API}/badge/vault`,   method: 'GET',  group: 'API', status: 'pending' },
  { id: 'reward',     title: 'Reward API',    endpoint: REWARD,                 method: 'GET',  group: 'API', status: 'pending' },
]

function fmtRpc(data: unknown): string {
  if (!data || typeof data !== 'object') return String(data)
  const r = (data as Record<string, unknown>).result
  if (r === undefined) return JSON.stringify(data)
  if (typeof r === 'string' && r.startsWith('0x')) {
    try { return `${BigInt(r).toString()}  (${r})` } catch { return r }
  }
  if (r === false) return 'Not syncing — fully synced'
  return JSON.stringify(r)
}

export function useApiStatus() {
  const [requests, setRequests] = useState<ApiRequest[]>(DEFAULTS)

  const patch = (id: string, p: Partial<ApiRequest>) =>
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...p } : r))

  const runRequest = useCallback(async (req: ApiRequest) => {
    patch(req.id, { status: 'running', response: undefined, error: undefined })
    const t0 = Date.now()
    try {
      const opts: RequestInit = req.method === 'POST'
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: req.rpcMethod, params: [], id: 1 }) }
        : { method: 'GET' }
      const res = await fetch(req.endpoint, opts)
      const ms = Date.now() - t0
      let data: unknown = null
      try { data = await res.json() } catch { /* ignore */ }
      patch(req.id, {
        status: res.ok ? 'success' : 'error',
        statusCode: res.status,
        response: req.group === 'RPC' ? fmtRpc(data) : JSON.stringify(data, null, 2),
        responseTime: ms,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      })
      await supabase.from('test_results').insert({
        endpoint: req.title, method: req.method,
        status_code: res.status, response_time_ms: ms,
        success: res.ok, response_body: data as object,
        error_message: res.ok ? null : `HTTP ${res.status}`,
      })
    } catch (e) {
      const ms = Date.now() - t0
      const msg = (e as Error).message
      patch(req.id, { status: 'error', responseTime: ms, error: msg })
      await supabase.from('test_results').insert({
        endpoint: req.title, method: req.method,
        status_code: null, response_time_ms: ms,
        success: false, response_body: null, error_message: msg,
      })
    }
  }, [])

  const runAll = useCallback(() => Promise.all(requests.map(r => runRequest(r))), [requests, runRequest])

  const resetAll = useCallback(() =>
    setRequests(DEFAULTS.map(r => ({ ...r, status: 'pending' as const }))), [])

  return { requests, runRequest, runAll, resetAll }
}
