/**
 * 🔧 Application Configuration
 * 
 * Centralized configuration for API endpoints and environment settings
 * Optimized for performance and type safety
 */

// Environment-based API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5000/api';

// Storage keys for consistent access
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  ACTIVE_HOSTEL: 'activeHostel',
  THEME: 'theme'
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 300000, // 5 minutes
  SHORT_TTL: 60000,    // 1 minute
  LONG_TTL: 600000,    // 10 minutes
  MAX_SIZE: 100        // Maximum cache entries
} as const;

// API configuration interface
export interface ApiConfig {
  readonly baseUrl: string;
  readonly timeout: number;
  readonly retries: number;
}

// Optimized API configuration
export const apiConfig: ApiConfig = {
  baseUrl: API_BASE_URL,
  timeout: 30000,  // 30 seconds
  retries: 3
} as const;

// Legacy export for backward compatibility (will be removed)
export const TOKEN_STORAGE_KEY = STORAGE_KEYS.AUTH_TOKEN;

// Feature flags for performance optimization
export const FEATURES = {
  ENABLE_REQUEST_DEDUPLICATION: true,
  ENABLE_CACHE: true,
  ENABLE_RETRY: true,
  ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development'
} as const;
