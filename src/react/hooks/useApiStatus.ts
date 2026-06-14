import { useState, useCallback } from 'react';
import type { ApiRequestState, ApiRequestOptions } from '../types/api';

export function useApi<T>() {
  const [state, setState] = useState<ApiRequestState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(
    async (url: string, options: ApiRequestOptions = {}) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { method = 'GET', headers = {}, body, signal } = options;

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        setState((prev) => ({ ...prev, loading: false, error }));
        throw err;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, request, reset };
}
