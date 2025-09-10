/**
 * 🚀 Modern HTTP Client
 * 
 * Clean, performance-optimized HTTP utility without legacy patterns
 * Uses the new URL-based architecture
 */

import { apiConfig, TOKEN_STORAGE_KEY } from './config';

export interface HttpOptions extends RequestInit {
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
  retries?: number;
}

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
  code?: string;
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function buildQuery(params?: HttpOptions['query']): string {
  if (!params) return '';
  
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    usp.append(key, String(value));
  });
  
  const queryString = usp.toString();
  return queryString ? `?${queryString}` : '';
}

function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

// ==========================================
// CORE HTTP CLIENT
// ==========================================

export async function http<T = unknown>(
  path: string, 
  options: HttpOptions = {}
): Promise<T> {
  const { 
    headers = {}, 
    body, 
    query, 
    auth = true,
    timeout = 30000,
    retries = 3,
    signal,
    ...rest 
  } = options;

  // Build final URL
  const baseUrl = apiConfig.baseUrl || '/api';
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}${buildQuery(query)}`;

  // Setup headers
  const finalHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authentication
  if (auth) {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      (finalHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('Authentication required but no token found');
      // Don't throw here, let the server handle the unauthorized request
    }
  }

  // Setup timeout
  const timeoutController = createTimeoutController(timeout);
  const finalSignal = signal || timeoutController.signal;

  // Prepare request body
  const finalBody = body && typeof body !== 'string' 
    ? JSON.stringify(body) 
    : body;

  let lastError: ApiError | null = null;

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...rest,
        headers: finalHeaders,
        body: finalBody,
        signal: finalSignal,
      });

      // Handle response
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      
      let data: any;
      try {
        data = isJson ? await response.json() : await response.text();
      } catch {
        data = null;
      }

      // Success responses
      if (response.ok || response.status === 304) {
        return data as T;
      }

      // Error responses
      const error: ApiError = new Error(
        (data?.message || data?.error) || `HTTP ${response.status}`
      );
      error.status = response.status;
      error.data = data;
      error.code = data?.code;

      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw error;
      }

      lastError = error;

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError: ApiError = new Error('Request timeout');
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }

      lastError = error as ApiError;

      // Don't retry on non-network errors
      if (attempt < retries && error instanceof TypeError) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      } else if (attempt === retries) {
        break;
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

// ==========================================
// CONVENIENCE METHODS
// ==========================================

export const httpClient = {
  get: <T = unknown>(path: string, options?: Omit<HttpOptions, 'method'>) => 
    http<T>(path, { ...options, method: 'GET' }),

  post: <T = unknown>(path: string, data?: unknown, options?: Omit<HttpOptions, 'method' | 'body'>) => 
    http<T>(path, { ...options, method: 'POST', body: data as BodyInit }),

  put: <T = unknown>(path: string, data?: unknown, options?: Omit<HttpOptions, 'method' | 'body'>) => 
    http<T>(path, { ...options, method: 'PUT', body: data as BodyInit }),

  patch: <T = unknown>(path: string, data?: unknown, options?: Omit<HttpOptions, 'method' | 'body'>) => 
    http<T>(path, { ...options, method: 'PATCH', body: data as BodyInit }),

  delete: <T = unknown>(path: string, options?: Omit<HttpOptions, 'method'>) => 
    http<T>(path, { ...options, method: 'DELETE' }),
};

// ==========================================
// AUTH TOKEN MANAGEMENT
// ==========================================

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

// ==========================================
// EXPORTS
// ==========================================

export default httpClient;
