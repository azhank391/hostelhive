/**
 * 🚀 Enhanced API Client with Performance Optimizations
 * 
 * Features:
 * - URL-based architecture support
 * - Request deduplication & caching
 * - Automatic retry with exponential backoff
 * - TypeScript types for better DX
 * - Performance monitoring
 */

import { apiConfig, STORAGE_KEYS } from './config';
import { getCurrentSubdomain } from './subdomain';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface ApiRequestOptions extends RequestInit {
  /** Skip request deduplication */
  skipCache?: boolean;
  /** Custom cache TTL in milliseconds */
  cacheTTL?: number;
  /** Retry configuration */
  retry?: {
    attempts?: number;
    delay?: number;
    exponentialBackoff?: boolean;
  };
  /** Additional query parameters */
  params?: Record<string, string | number | boolean | undefined | null>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
}

// ==========================================
// REQUEST CACHE & DEDUPLICATION
// ==========================================

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<unknown>>();

  private getCacheKey(url: string, options: ApiRequestOptions): string {
    const { headers, body, params } = options;
    return `${url}:${JSON.stringify({ headers, body, params })}`;
  }

  get<T>(url: string, options: ApiRequestOptions): T | null {
    if (options.skipCache) return null;
    
    const key = this.getCacheKey(url, options);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(url: string, options: ApiRequestOptions, data: T): void {
    if (options.skipCache) return;
    
    const key = this.getCacheKey(url, options);
    const ttl = options.cacheTTL ?? 300000; // 5 minutes default
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  getPendingRequest<T>(url: string, options: ApiRequestOptions): Promise<T> | null {
    if (options.skipCache) return null;
    
    const key = this.getCacheKey(url, options);
    return this.pendingRequests.get(key) as Promise<T> | null;
  }

  setPendingRequest<T>(url: string, options: ApiRequestOptions, promise: Promise<T>): void {
    if (options.skipCache) return;
    
    const key = this.getCacheKey(url, options);
    this.pendingRequests.set(key, promise);
    
    // Clean up when done
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  clearPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

const requestCache = new RequestCache();

// ==========================================
// CORE HTTP CLIENT
// ==========================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  private buildUrl(path: string, params?: ApiRequestOptions['params']): string {
    // Fix: Use simple string concatenation to ensure correct URL structure
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    // 🚀 NEW: Handle subdomain requests
    const subdomain = getCurrentSubdomain();
    let baseUrl = this.baseUrl;
    
    if (subdomain && typeof window !== 'undefined') {
      // If we're on a subdomain, use the same subdomain for API requests
      const currentHost = window.location.host;
      const currentProtocol = window.location.protocol;
      
      // Development: abc.localhost:3000 -> abc.localhost:5000
      if (currentHost.includes('localhost')) {
        const port = currentHost.includes(':') ? currentHost.split(':')[1] : '';
        const apiPort = port === '3000' ? '5000' : port; // Use port 5000 for API
        baseUrl = `${currentProtocol}//${subdomain}.localhost:${apiPort}/api`;
      } else {
        // Production: abc.yourdomain.com -> abc.yourdomain.com/api
        baseUrl = `${currentProtocol}//${subdomain}.yourdomain.com/api`;
      }
    }
    
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const fullUrl = `${cleanBaseUrl}${cleanPath}`;
    

    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      const finalUrl = queryString ? `${fullUrl}?${queryString}` : fullUrl;

      return finalUrl;
    }
    
    return fullUrl;
  }

  private async executeRequest<T>(
    url: string, 
    options: ApiRequestOptions
  ): Promise<T> {
    const token = this.getAuthToken();
    

    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    // Force JSON formatting for POST/PUT/PATCH requests
    let finalBody: string | undefined;
    if (options.body) {
      if (typeof options.body === 'string') {
        // If it's already a string, try to parse it as JSON first
        try {
          JSON.parse(options.body);
          finalBody = options.body; // It's valid JSON string
        } catch {
          // It's not JSON, stringify it as an object
          finalBody = JSON.stringify({ value: options.body });
        }
      } else {
        // It's an object, stringify it
        finalBody = JSON.stringify(options.body);
      }
    }

    const fetchOptions = {
      ...options,
      headers,
      body: finalBody,
    };

    const response = await fetch(url, fetchOptions);
    


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      const error = new Error(errorData.message || `HTTP ${response.status}`) as ApiError;
      error.status = response.status;
      error.code = errorData.code;
      error.details = errorData;
      throw error;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as unknown as T;
  }

  private async retryRequest<T>(
    url: string,
    options: ApiRequestOptions
  ): Promise<T> {
    const { retry = {} } = options;
    const { attempts = 3, delay = 1000, exponentialBackoff = true } = retry;

    let lastError: ApiError;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.executeRequest<T>(url, options);
      } catch (error) {
        lastError = error as ApiError;
        
        // Don't retry on client errors (4xx)
        if (lastError.status >= 400 && lastError.status < 500) {
          throw lastError;
        }

        if (attempt === attempts) {
          throw lastError;
        }

        // Wait before retry
        const waitTime = exponentialBackoff 
          ? delay * Math.pow(2, attempt - 1)
          : delay;
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }

  async request<T = unknown>(
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(path, options.params);

    // Check cache first
    const cachedData = requestCache.get<T>(url, options);
    if (cachedData) {
      return cachedData;
    }

    // Check for pending request (deduplication)
    const pendingRequest = requestCache.getPendingRequest<T>(url, options);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Make new request
    const requestPromise = this.retryRequest<T>(url, options);
    requestCache.setPendingRequest(url, options, requestPromise);

    try {
      const data = await requestPromise;
      requestCache.set(url, options, data);
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Convenience methods
  get<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    // Ensure body is properly formatted for POST requests
    const postOptions: ApiRequestOptions = {
      ...options,
      method: 'POST',
      body: body as BodyInit
    };
    
    return this.request<T>(path, postOptions);
  }

  put<T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body: body as BodyInit });
  }

  patch<T = unknown>(path: string, body?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body: body as BodyInit });
  }

  delete<T = unknown>(path: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  // Cache management
  clearCache(): void {
    requestCache.clear();
  }

  invalidateCache(pattern: string): void {
    requestCache.clearPattern(pattern);
  }

  // Token management
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    return null;
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  }
}

// ==========================================
// SINGLETON INSTANCE
// ==========================================

export const apiClient = new ApiClient(apiConfig.baseUrl);

// ==========================================
// PERFORMANCE MONITORING
// ==========================================

export const apiPerformance = {
  startMeasure: (label: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`api-${label}-start`);
    }
  },

  endMeasure: (label: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`api-${label}-end`);
      performance.measure(`api-${label}`, `api-${label}-start`, `api-${label}-end`);
    }
  },

  getApiMetrics: () => {
    if (typeof window === 'undefined' || !window.performance) return [];
    
    return performance.getEntriesByType('measure')
      .filter(entry => entry.name.startsWith('api-'))
      .map(entry => ({
        name: entry.name.replace('api-', ''),
        duration: Math.round(entry.duration),
        startTime: Math.round(entry.startTime)
      }));
  }
};

export default apiClient;
