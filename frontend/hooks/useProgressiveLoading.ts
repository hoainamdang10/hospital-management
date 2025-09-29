"use client"

import { useState, useEffect, useCallback } from 'react'

interface LoadingState {
  [key: string]: boolean
}

interface LoadingConfig {
  initialDelay?: number
  staggerDelay?: number
  enableStaggered?: boolean
}

interface ProgressiveLoadingReturn {
  loadingStates: LoadingState
  isLoading: (key: string) => boolean
  setLoading: (key: string, loading: boolean) => void
  startLoading: (key: string) => void
  stopLoading: (key: string) => void
  loadSequentially: (keys: string[]) => Promise<void>
  loadInParallel: (keys: string[]) => void
  isAnyLoading: boolean
  isAllLoaded: boolean
  progress: number
}

export function useProgressiveLoading(
  initialKeys: string[] = [],
  config: LoadingConfig = {}
): ProgressiveLoadingReturn {
  const {
    initialDelay = 0,
    staggerDelay = 200,
    enableStaggered = true
  } = config

  const [loadingStates, setLoadingStates] = useState<LoadingState>(() => {
    const initial: LoadingState = {}
    initialKeys.forEach(key => {
      initial[key] = true
    })
    return initial
  })

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }))
  }, [])

  const startLoading = useCallback((key: string) => {
    setLoading(key, true)
  }, [setLoading])

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false)
  }, [setLoading])

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const loadSequentially = useCallback(async (keys: string[]) => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      startLoading(key)
      
      // Simulate loading delay
      await new Promise(resolve => 
        setTimeout(resolve, initialDelay + (enableStaggered ? i * staggerDelay : 0))
      )
      
      stopLoading(key)
    }
  }, [startLoading, stopLoading, initialDelay, staggerDelay, enableStaggered])

  const loadInParallel = useCallback((keys: string[]) => {
    keys.forEach((key, index) => {
      startLoading(key)
      
      setTimeout(() => {
        stopLoading(key)
      }, initialDelay + (enableStaggered ? index * staggerDelay : 0))
    })
  }, [startLoading, stopLoading, initialDelay, staggerDelay, enableStaggered])

  const isAnyLoading = Object.values(loadingStates).some(loading => loading)
  const isAllLoaded = Object.values(loadingStates).every(loading => !loading)
  const totalKeys = Object.keys(loadingStates).length
  const loadedKeys = Object.values(loadingStates).filter(loading => !loading).length
  const progress = totalKeys > 0 ? (loadedKeys / totalKeys) * 100 : 100

  return {
    loadingStates,
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
    loadSequentially,
    loadInParallel,
    isAnyLoading,
    isAllLoaded,
    progress
  }
}

// Hook for dashboard-specific loading
export function useDashboardLoading() {
  const dashboardKeys = [
    'stats',
    'charts',
    'calendar',
    'activities',
    'notifications',
    'systemStats'
  ]

  const loading = useProgressiveLoading(dashboardKeys, {
    initialDelay: 300,
    staggerDelay: 150,
    enableStaggered: true
  })

  useEffect(() => {
    // Simulate progressive loading
    loading.loadSequentially(dashboardKeys)
  }, [])

  return {
    ...loading,
    isStatsLoading: loading.isLoading('stats'),
    isChartsLoading: loading.isLoading('charts'),
    isCalendarLoading: loading.isLoading('calendar'),
    isActivitiesLoading: loading.isLoading('activities'),
    isNotificationsLoading: loading.isLoading('notifications'),
    isSystemStatsLoading: loading.isLoading('systemStats')
  }
}

// Hook for component-level loading with retry
interface UseComponentLoadingOptions {
  retryAttempts?: number
  retryDelay?: number
  timeout?: number
}

export function useComponentLoading(
  loadFn: () => Promise<any>,
  dependencies: any[] = [],
  options: UseComponentLoadingOptions = {}
) {
  const {
    retryAttempts = 3,
    retryDelay = 1000,
    timeout = 10000
  } = options

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<any>(null)
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Add timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )

      const result = await Promise.race([loadFn(), timeoutPromise])
      setData(result)
      setAttempt(0)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      
      if (attempt < retryAttempts) {
        setAttempt(prev => prev + 1)
        setTimeout(() => load(), retryDelay)
        return
      }
      
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [loadFn, attempt, retryAttempts, retryDelay, timeout])

  useEffect(() => {
    load()
  }, dependencies)

  const retry = useCallback(() => {
    setAttempt(0)
    load()
  }, [load])

  return {
    isLoading,
    error,
    data,
    retry,
    attempt
  }
}

// Hook for optimistic updates
export function useOptimisticLoading<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [data, setData] = useState<T>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(async (optimisticData: T) => {
    const previousData = data
    
    // Optimistically update
    setData(optimisticData)
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateFn(optimisticData)
      setData(result)
    } catch (err) {
      // Revert on error
      setData(previousData)
      setError(err instanceof Error ? err : new Error('Update failed'))
    } finally {
      setIsLoading(false)
    }
  }, [data, updateFn])

  return {
    data,
    isLoading,
    error,
    update
  }
}

// Hook for batch loading
export function useBatchLoading<T>(
  loadFn: (ids: string[]) => Promise<T[]>,
  batchSize: number = 10,
  delay: number = 100
) {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<T[]>([])
  const [error, setError] = useState<Error | null>(null)

  const loadBatch = useCallback(async (ids: string[]) => {
    setIsLoading(true)
    setError(null)
    setData([])

    try {
      const batches = []
      for (let i = 0; i < ids.length; i += batchSize) {
        batches.push(ids.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        const batchData = await loadFn(batch)
        setData(prev => [...prev, ...batchData])
        
        // Add delay between batches
        if (batch !== batches[batches.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Batch loading failed'))
    } finally {
      setIsLoading(false)
    }
  }, [loadFn, batchSize, delay])

  return {
    isLoading,
    data,
    error,
    loadBatch
  }
}

// Hook for infinite loading
export function useInfiniteLoading<T>(
  loadFn: (page: number, pageSize: number) => Promise<{ data: T[], hasMore: boolean }>,
  pageSize: number = 20
) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [data, setData] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [error, setError] = useState<Error | null>(null)

  const loadInitial = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setData([])
    setPage(0)

    try {
      const result = await loadFn(0, pageSize)
      setData(result.data)
      setHasMore(result.hasMore)
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Loading failed'))
    } finally {
      setIsLoading(false)
    }
  }, [loadFn, pageSize])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    setError(null)

    try {
      const result = await loadFn(page, pageSize)
      setData(prev => [...prev, ...result.data])
      setHasMore(result.hasMore)
      setPage(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Loading more failed'))
    } finally {
      setIsLoadingMore(false)
    }
  }, [loadFn, page, pageSize, hasMore, isLoadingMore])

  return {
    isLoading,
    isLoadingMore,
    data,
    hasMore,
    error,
    loadInitial,
    loadMore,
    page
  }
}
