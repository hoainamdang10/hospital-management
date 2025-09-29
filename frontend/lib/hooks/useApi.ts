'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '../types';

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

interface ApiActions<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: string | null) => void;
}

// Generic API hook
export const useApi = <T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  immediate = false,
  ...args: any[]
): ApiState<T> & ApiActions<T> => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    isLoading: immediate,
    error: null,
    isSuccess: false,
  });

  const execute = useCallback(async (...executeArgs: any[]): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null, isSuccess: false }));

    try {
      const response = await apiFunction(...executeArgs);

      if (response?.success && response.data) {
        setState({
          data: response.data,
          isLoading: false,
          error: null,
          isSuccess: true,
        });
        return response.data;
      } else {
        setState({
          data: null,
          isLoading: false,
          error: response?.error?.message || 'An error occurred',
          isSuccess: false,
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState({
        data: null,
        isLoading: false,
        error: errorMessage,
        isSuccess: false,
      });
      return null;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
    });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data, isSuccess: !!data }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isSuccess: false }));
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute(...args);
    }
  }, [immediate, execute, ...args]);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
};

// Hook for API calls that return arrays
export const useApiList = <T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T[]>>,
  immediate = false,
  ...args: any[]
) => {
  const api = useApi(apiFunction, immediate, ...args);

  const addItem = useCallback((item: T) => {
    api.setData([...(api.data || []), item]);
  }, [api]);

  const updateItem = useCallback((id: string, updatedItem: Partial<T>) => {
    if (!api.data) return;
    
    const updatedData = api.data.map(item => 
      (item as any).id === id ? { ...item, ...updatedItem } : item
    );
    api.setData(updatedData);
  }, [api]);

  const removeItem = useCallback((id: string) => {
    if (!api.data) return;
    
    const filteredData = api.data.filter(item => (item as any).id !== id);
    api.setData(filteredData);
  }, [api]);

  const replaceItem = useCallback((id: string, newItem: T) => {
    if (!api.data) return;
    
    const updatedData = api.data.map(item => 
      (item as any).id === id ? newItem : item
    );
    api.setData(updatedData);
  }, [api]);

  return {
    ...api,
    addItem,
    updateItem,
    removeItem,
    replaceItem,
  };
};

// Hook for paginated API calls
export const useApiPagination = <T>(
  apiFunction: (page: number, limit: number, ...args: any[]) => Promise<ApiResponse<T[]>>,
  initialPage = 1,
  initialLimit = 10,
  immediate = false,
  ...args: any[]
) => {
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
  });

  const api = useApi(
    (page: number, limit: number) => apiFunction(page, limit, ...args),
    immediate,
    pagination.page,
    pagination.limit
  );

  const loadPage = useCallback(async (page: number) => {
    const response = await api.execute(page, pagination.limit);
    if (response && api.isSuccess) {
      setPagination(prev => ({ ...prev, page }));
    }
    return response;
  }, [api, pagination.limit]);

  const loadNextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      return loadPage(pagination.page + 1);
    }
    return Promise.resolve(null);
  }, [loadPage, pagination.page, pagination.totalPages]);

  const loadPreviousPage = useCallback(() => {
    if (pagination.page > 1) {
      return loadPage(pagination.page - 1);
    }
    return Promise.resolve(null);
  }, [loadPage, pagination.page]);

  const changeLimit = useCallback(async (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    return api.execute(1, newLimit);
  }, [api]);

  const refresh = useCallback(() => {
    return api.execute(pagination.page, pagination.limit);
  }, [api, pagination.page, pagination.limit]);

  return {
    ...api,
    pagination,
    loadPage,
    loadNextPage,
    loadPreviousPage,
    changeLimit,
    refresh,
    hasNextPage: pagination.page < pagination.totalPages,
    hasPreviousPage: pagination.page > 1,
  };
};

// Hook for form submissions
export const useApiForm = <TData, TResponse>(
  apiFunction: (data: TData) => Promise<ApiResponse<TResponse>>,
  onSuccess?: (data: TResponse) => void,
  onError?: (error: string) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (data: TData): Promise<TResponse | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiFunction(data);

      if (response.success && response.data) {
        onSuccess?.(response.data);
        return response.data;
      } else {
        const errorMessage = response.error?.message || 'Submission failed';
        setError(errorMessage);
        onError?.(errorMessage);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [apiFunction, onSuccess, onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submit,
    isSubmitting,
    error,
    clearError,
  };
};

// Hook for optimistic updates
export const useOptimisticApi = <T>(
  initialData: T[],
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>
) => {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimisticUpdate = useCallback(async (
    optimisticData: T,
    apiCall: () => Promise<ApiResponse<T>>,
    updateType: 'add' | 'update' | 'delete',
    id?: string
  ) => {
    // Apply optimistic update
    let rollbackData = [...data];
    
    switch (updateType) {
      case 'add':
        setData(prev => [...prev, optimisticData]);
        break;
      case 'update':
        setData(prev => prev.map(item => 
          (item as any).id === id ? optimisticData : item
        ));
        break;
      case 'delete':
        setData(prev => prev.filter(item => (item as any).id !== id));
        break;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiCall();

      if (response.success && response.data) {
        // Update with real data
        switch (updateType) {
          case 'add':
            setData(prev => prev.map(item => 
              item === optimisticData ? response.data! : item
            ));
            break;
          case 'update':
            setData(prev => prev.map(item => 
              (item as any).id === id ? response.data! : item
            ));
            break;
          // For delete, optimistic update is already correct
        }
        return response.data;
      } else {
        // Rollback on error
        setData(rollbackData);
        const errorMessage = response.error?.message || 'Operation failed';
        setError(errorMessage);
        return null;
      }
    } catch (error) {
      // Rollback on error
      setData(rollbackData);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  return {
    data,
    isLoading,
    error,
    optimisticUpdate,
    setData,
    clearError: () => setError(null),
  };
};
