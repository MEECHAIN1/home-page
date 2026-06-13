export type ApiMethod = 'GET' | 'POST'
export type ApiRequestStatus = 'pending' | 'running' | 'success' | 'error'

export interface ApiRequest {
  id: string
  title: string
  endpoint: string
  method: ApiMethod
  group: 'RPC' | 'API'
  rpcMethod?: string
  status: ApiRequestStatus
  statusCode?: number | null
  response?: unknown
  responseTime?: number
  error?: string | null
}
