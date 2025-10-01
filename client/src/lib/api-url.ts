/**
 * 🔗 API URL Helper
 * 
 * Ensures all API calls use the correct base URL from environment variables
 * Use this instead of hardcoded `/api/...` paths
 */

import { apiConfig } from './config';

/**
 * Build a full API URL from a path
 * @param path - API path (with or without leading slash)
 * @returns Full URL with base URL prepended
 * 
 * @example
 * ```ts
 * getApiUrl('/api/hostels/123/rooms') 
 * // Returns: 'https://hostelhive.work.gd/api/hostels/123/rooms'
 * 
 * getApiUrl('/hostels/123/rooms') 
 * // Returns: 'https://hostelhive.work.gd/api/hostels/123/rooms'
 * ```
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present
  let cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Remove /api prefix if present (since baseUrl already includes /api)
  if (cleanPath.startsWith('api/')) {
    cleanPath = cleanPath.substring(4); // Remove 'api/'
  }
  
  const cleanBaseUrl = apiConfig.baseUrl.endsWith('/') 
    ? apiConfig.baseUrl.slice(0, -1) 
    : apiConfig.baseUrl;
  
  return `${cleanBaseUrl}/${cleanPath}`;
}

/**
 * Legacy support - some code uses /api prefix, some doesn't
 * This handles both cases
 */
export function normalizeApiPath(path: string): string {
  // If path already has /api, remove it since baseUrl includes /api
  if (path.startsWith('/')) {
    return path.substring(4); // Remove '/api'
  }
  return path;
}
