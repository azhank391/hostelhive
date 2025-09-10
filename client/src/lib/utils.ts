import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeExtractData<T>(response: any, defaultValue: T): T {
  if (!response) return defaultValue;
  if (typeof response === 'object' && 'data' in response) {
    return response.data ?? defaultValue;
  }
  return response as T;
}

export function safeArray<T>(data: T[] | undefined | null): T[] {
  return Array.isArray(data) ? data : [];
}

export function generateColorClass(color: string, prefix: string = 'text', suffix: string = '500'): string {
  const validColors = ['blue', 'green', 'orange', 'purple', 'indigo', 'gray', 'red', 'yellow'];
  return validColors.includes(color) ? `${prefix}-${color}-${suffix}` : `${prefix}-gray-${suffix}`;
}
