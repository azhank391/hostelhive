/**
 * 🌐 Optimized Subdomain Utilities
 * 
 * High-performance subdomain detection and validation
 * Supports both development and production environments
 */

// Cache for subdomain parsing to avoid repeated regex operations
let subdomainCache: { host: string; subdomain: string | null } | null = null;

/**
 * Extract subdomain from hostname with caching
 * @param host - The hostname (e.g., "abc.localhost:3000" or "abc.domain.com")
 * @returns subdomain string or null if no subdomain
 */
export function getSubdomain(host: string): string | null {
  if (!host) return null;
  
  // Check cache first
  if (subdomainCache?.host === host) {
    return subdomainCache.subdomain;
  }
  
  let subdomain: string | null = null;
  
  // Development: abc.localhost:3000 or abc.localhost
  const devMatch = host.match(/^([^.]+)\.localhost(?::\d+)?$/);
  if (devMatch && devMatch[1] !== 'www') {
    subdomain = devMatch[1];
  } else {
    // Production: abc.yourdomain.com (update with your actual domain)
    const prodMatch = host.match(/^([^.]+)\.yourdomain\.com$/);
    if (prodMatch && prodMatch[1] !== 'www') {
      subdomain = prodMatch[1];
    }
  }
  
  // Cache the result
  subdomainCache = { host, subdomain };
  
  return subdomain;
}

/**
 * Get subdomain from current window location with memoization
 * @returns subdomain string or null
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  return getSubdomain(window.location.host);
}

/**
 * Optimized subdomain validation with RFC compliance
 * @param subdomain - The subdomain to validate
 * @returns boolean
 */
export function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain || subdomain.length > 63 || subdomain.length < 1) return false;
  
  // RFC compliant: alphanumeric and hyphens, cannot start or end with hyphen
  // Optimized regex for better performance
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(subdomain);
}

/**
 * Clear subdomain cache (useful for testing or host changes)
 */
export function clearSubdomainCache(): void {
  subdomainCache = null;
}

/**
 * Generate a URL with subdomain
 * @param subdomain - The subdomain to use
 * @param path - The path to append (optional)
 * @returns formatted URL
 */
export function buildSubdomainUrl(subdomain: string, path: string = ''): string {
  if (typeof window === 'undefined') return path;
  
  const { protocol, host } = window.location;
  const baseDomain = host.includes('localhost') ? 'localhost:3000' : 'yourdomain.com';
  
  return `${protocol}//${subdomain}.${baseDomain}${path}`;
}

/**
 * Check if current page is on a subdomain
 * @returns boolean
 */
export function isOnSubdomain(): boolean {
  return getCurrentSubdomain() !== null;
}

/**
 * Generate URL for a specific subdomain
 * @param subdomain - Target subdomain
 * @param path - Optional path (default: "/")
 * @returns Full URL string
 */
export function generateSubdomainUrl(subdomain: string, path = '/'): string {
  if (typeof window === 'undefined') return `http://${subdomain}.localhost:3000${path}`;
  
  const currentHost = window.location.host;
  const currentProtocol = window.location.protocol;
  
  // Development
  if (currentHost.includes('localhost')) {
    const port = currentHost.includes(':') ? currentHost.split(':')[1] : '';
    return `${currentProtocol}//${subdomain}.localhost${port ? `:${port}` : ''}${path}`;
  }
  
  // Production - update with your domain
  return `${currentProtocol}//${subdomain}.yourdomain.com${path}`;
}

/**
 * Determine if current page is accessed via subdomain
 * @returns boolean
 */
export function isSubdomainAccess(): boolean {
  return getCurrentSubdomain() !== null;
}

/**
 * Redirect to main domain (no subdomain)
 * @param path - Optional path to redirect to
 */
export function redirectToMainDomain(path = '/'): void {
  if (typeof window === 'undefined') return;
  
  const currentHost = window.location.host;
  const currentProtocol = window.location.protocol;
  
  // Development
  if (currentHost.includes('localhost')) {
    const port = currentHost.includes(':') ? currentHost.split(':')[1] : '';
    window.location.href = `${currentProtocol}//localhost${port ? `:${port}` : ''}${path}`;
    return;
  }
  
  // Production - update with your domain
  window.location.href = `${currentProtocol}//yourdomain.com${path}`;
}
