// utils/constants.ts - Application-wide constants
export const APP_CONFIG = {
  APP_NAME: 'HostelHive',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  SESSION_STORAGE_KEY: 'hostelhive_session',
  THEME_STORAGE_KEY: 'hostelhive_theme',
  DEFAULT_PAGINATION_LIMIT: 10,
} as const;

export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
