/**
 * 🚀 Modern HTTP Client
 * 
 * Clean, performance-optimized HTTP utility without legacy patterns
 * Uses the new URL-based architecture
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { STORAGE_KEYS } from "./config";

let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (cb: () => void) => { onUnauthorized = cb; };

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // if you use httpOnly cookies; harmless otherwise
});

// Attach token from storage if you use Bearer tokens
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// IMPORTANT: only force logout on 401/403. Do NOT logout on 5xx or network errors.
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError<any>) => {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      onUnauthorized?.();
    }
    // Let caller handle the error details
    return Promise.reject(err);
  }
);

export { api };
