export interface ApiRequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}
