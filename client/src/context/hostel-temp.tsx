"use client";

// Temporary file to help fix HostelContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { authApi, hostelApi, adminApi, studentApi } from '../lib/api';
import { notification, apiNotification } from '../lib/toast';
import { STORAGE_KEYS } from '../lib/config';
import type { 
  Hostel, 
  HostelContextValue,
  CreateHostelData 
} from '../lib/types';
