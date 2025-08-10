import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T = any>(options?: UseApiOptions) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (
    apiCall: () => Promise<Response>,
    { 
      loadingText,
      successMessage 
    }: { 
      loadingText?: string;
      successMessage?: string;
    } = {}
  ) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await apiCall();
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setState({ data, loading: false, error: null });
      
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
      
      setState({ data: null, loading: false, error: errorMessage });
      
      if (options?.onError) {
        options.onError(errorMessage);
      }
      
      throw err;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// API base URL helper
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiEndpoints = {
  rooms: `${API_BASE_URL}/api/rooms`,
  tenants: `${API_BASE_URL}/api/tenants`,
  bills: `${API_BASE_URL}/api/bills`,
  payments: `${API_BASE_URL}/api/payments`,
  generateBill: `${API_BASE_URL}/api/generate-bill`,
} as const;