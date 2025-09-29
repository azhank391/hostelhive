/**
 * 🎣 Performance-Optimized API Hooks
 * 
 * React hooks with caching, optimistic updates, and error handling
 * Built for the new URL-based architecture
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { authApi, hostelApi, adminApi, studentApi, superadminApi } from '../lib/api';
import type { 
  UseApiResult, 
  UsePaginatedApiResult,
  VisitorLog,
} from '../lib/types';
import type { PaginatedResponse } from '../lib/api-client';

// ==========================================
// CORE HOOK UTILITIES
// ==========================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class HookCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }
}

const hookCache = new HookCache();

// ==========================================
// BASE API HOOK
// ==========================================

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = [],
  options: {
    cacheKey?: string;
    cacheTTL?: number;
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
): UseApiResult<T> {
  const {
    cacheKey,
    cacheTTL = 300000, // 5 minutes
    immediate = true,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(
    cacheKey ? hookCache.get<T>(cacheKey) : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    if (cacheKey) {
      const cached = hookCache.get<T>(cacheKey);
      if (cached) {
        setData(cached);
        return;
      }
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      
      // Only update if request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
        
        // Cache the result
        if (cacheKey) {
          hookCache.set(cacheKey, result, cacheTTL);
        }
        
        onSuccess?.(result);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, deps);

  const refetch = useCallback(() => {
    if (cacheKey) {
      hookCache.invalidate(cacheKey);
    }
    return fetchData();
  }, [fetchData, cacheKey]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, immediate]);

  return { data, loading, error, refetch };
}

// ==========================================
// PAGINATED API HOOK
// ==========================================

export function usePaginatedApi<T>(
  fetcher: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  deps: React.DependencyList = [],
  options: {
    initialPage?: number;
    pageSize?: number;
    cacheKey?: string;
    cacheTTL?: number;
  } = {}
): UsePaginatedApiResult<T> {
  const {
    initialPage = 1,
    pageSize = 10,
    cacheKey,
    cacheTTL = 300000
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const cacheKeyWithPage = cacheKey ? `${cacheKey}_page_${currentPage}_limit_${pageSize}` : undefined;
  
  const { data, loading, error, refetch } = useApi(
    () => fetcher(currentPage, pageSize),
    [...deps, currentPage, pageSize],
    {
      cacheKey: cacheKeyWithPage,
      cacheTTL
    }
  );

  const nextPage = useCallback(() => {
    if (data?.pagination && currentPage < data.pagination.totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [data?.pagination, currentPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && data?.pagination && page <= data.pagination.totalPages) {
      setCurrentPage(page);
    }
  }, [data?.pagination]);

  return {
    data: data as any, // Type cast to handle pagination differences
    loading,
    error,
    refetch,
    pagination: data?.pagination ? {
      ...data.pagination,
      pages: data.pagination.totalPages,
      hasNext: currentPage < data.pagination.totalPages,
      hasPrev: currentPage > 1
    } : null,
    nextPage,
    prevPage,
    goToPage
  };
}

// ==========================================
// AUTHENTICATION HOOKS
// ==========================================

export function useAuth() {
  return useApi(
    () => authApi.getCurrentUser(),
    [],
    {
      cacheKey: 'current_user',
      cacheTTL: 60000 // 1 minute
    }
  );
}

export function useUserHostels() {
  return useApi(
    () => authApi.getUserHostels(),
    [],
    {
      cacheKey: 'user_hostels',
      cacheTTL: 300000 // 5 minutes
    }
  );
}

// ==========================================
// HOSTEL MANAGEMENT HOOKS
// ==========================================

export function useHostelDetails(hostelId: string) {
  return useApi(
    () => hostelApi.getHostelDetails(hostelId),
    [hostelId],
    {
      cacheKey: `hostel_${hostelId}`,
      cacheTTL: 600000, // 10 minutes
      immediate: !!hostelId
    }
  );
}

export function useDashboardStats(hostelId: string) {
  return useApi(
    () => adminApi.getDashboardStats(hostelId),
    [hostelId],
    {
      cacheKey: `dashboard_stats_${hostelId}`,
      cacheTTL: 30000, // 30 seconds
      immediate: !!hostelId
    }
  );
}

// ==========================================
// ADMIN HOOKS (URL-based)
// ==========================================

export function useRooms(hostelId: string, filters: any = {}) {
  return usePaginatedApi(
    (page, limit) => adminApi.getRooms(hostelId, { ...filters, page, limit }),
    [hostelId, JSON.stringify(filters)],
    {
      cacheKey: `rooms_${hostelId}`,
      cacheTTL: 60000 // 1 minute
    }
  );
}

export function useStudents(hostelId: string, filters: any = {}) {
  return usePaginatedApi(
    (page, limit) => adminApi.getStudents(hostelId, { ...filters, page, limit }),
    [hostelId, JSON.stringify(filters)],
    {
      cacheKey: `students_${hostelId}`,
      cacheTTL: 60000 // 1 minute
    }
  );
}

export function useWardens(hostelId: string) {
  return useApi(
    () => adminApi.getWardens(hostelId),
    [hostelId],
    {
      cacheKey: `wardens_${hostelId}`,
      cacheTTL: 300000, // 5 minutes
      immediate: !!hostelId
    }
  );
}

export function useComplaints(hostelId: string, filters: any = {}) {
  return usePaginatedApi(
    (page, limit) => adminApi.getComplaints(hostelId, { ...filters, page, limit }),
    [hostelId, JSON.stringify(filters)],
    {
      cacheKey: `complaints_${hostelId}`,
      cacheTTL: 30000 // 30 seconds
    }
  );
}

export function useVisitorLogs(hostelId: string, filters: any = {}) {
  return usePaginatedApi(
    (page, limit) => adminApi.getVisitorLogs(hostelId, { ...filters, page, limit }) as Promise<PaginatedResponse<VisitorLog>>,
    [hostelId, JSON.stringify(filters)],
    {
      cacheKey: `visitor_logs_${hostelId}`,
      cacheTTL: 30000 // 30 seconds
    }
  );
}

// ==========================================
// STUDENT HOOKS (Token-based)
// ==========================================

export function useStudentDashboard() {
  return useApi(
    () => studentApi.getDashboard(),
    [],
    {
      cacheKey: 'student_dashboard',
      cacheTTL: 30000 // 30 seconds
    }
  );
}

export function useStudentProfile() {
  return useApi(
    () => studentApi.getProfile(),
    [],
    {
      cacheKey: 'student_profile',
      cacheTTL: 300000 // 5 minutes
    }
  );
}

export function useStudentRoom() {
  return useApi(
    () => studentApi.getRoom(),
    [],
    {
      cacheKey: 'student_room',
      cacheTTL: 300000 // 5 minutes
    }
  );
}

export function useStudentComplaints() {
  return useApi(
    () => studentApi.getComplaints(),
    [],
    {
      cacheKey: 'student_complaints',
      cacheTTL: 60000 // 1 minute
    }
  );
}

export function useStudentVisitorLogs() {
  return useApi(
    () => studentApi.getVisitorLogs(),
    [],
    {
      cacheKey: 'student_visitor_logs',
      cacheTTL: 60000 // 1 minute
    }
  );
}

// ==========================================
// SUPERADMIN HOOKS
// ==========================================

export function useSuperAdminDashboard() {
  return useApi(
    () => superadminApi.getDashboard(),
    [],
    {
      cacheKey: 'superadmin_dashboard',
      cacheTTL: 60000 // 1 minute
    }
  );
}

export function useAllHostels(filters: any = {}) {
  return usePaginatedApi(
    (page, limit) => superadminApi.getAllHostels({ ...filters, page, limit }),
    [JSON.stringify(filters)],
    {
      cacheKey: 'all_hostels',
      cacheTTL: 60000 // 1 minute
    }
  );
}

export function useBillingOverview() {
  return useApi(
    () => superadminApi.getBillingOverview(),
    [],
    {
      cacheKey: 'billing_overview',
      cacheTTL: 300000 // 5 minutes
    }
  );
}

// ==========================================
// MUTATION HOOKS (with optimistic updates)
// ==========================================

export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateCache?: string[];
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      
      // Invalidate related cache entries
      options.invalidateCache?.forEach(pattern => {
        hookCache.invalidate(pattern);
      });
      
      options.onSuccess?.(result, variables);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Mutation failed';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage), variables);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  return { mutate, loading, error };
}

// ==========================================
// CACHE MANAGEMENT
// ==========================================

export function useInvalidateCache() {
  return useCallback((pattern: string) => {
    hookCache.invalidate(pattern);
  }, []);
}

export function useClearCache() {
  return useCallback(() => {
    hookCache.clear();
  }, []);
}

// ==========================================
// CONVENIENCE EXPORTS
// ==========================================

export const hooks = {
  // Core
  useApi,
  usePaginatedApi,
  useMutation,

  // Auth
  useAuth,
  useUserHostels,

  // Hostel
  useHostelDetails,
  useDashboardStats,

  // Admin
  useRooms,
  useStudents,
  useWardens,
  useComplaints,
  useVisitorLogs,

  // Student
  useStudentDashboard,
  useStudentProfile,
  useStudentRoom,
  useStudentComplaints,
  useStudentVisitorLogs,

  // SuperAdmin
  useSuperAdminDashboard,
  useAllHostels,
  useBillingOverview,

  // Cache
  useInvalidateCache,
  useClearCache
};

export default hooks;
