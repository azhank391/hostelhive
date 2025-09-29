"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCurrentSubdomain, isValidSubdomain } from '../lib/subdomain';
import type { Hostel } from '../lib/types';

interface SubdomainContextType {
  subdomain: string | null;
  hostel: Hostel | null;
  isLoading: boolean;
  error: string | null;
  isValidHostel: boolean;
  refreshHostelData: () => Promise<void>;
}

const SubdomainContext = createContext<SubdomainContextType>({
  subdomain: null,
  hostel: null,
  isLoading: true,
  error: null,
  isValidHostel: false,
  refreshHostelData: async () => { throw new Error('refreshHostelData must be used within a SubdomainProvider') },
});

export function SubdomainProvider({ children }: { children: ReactNode }) {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Fetch hostel data based on subdomain
  const fetchHostelBySubdomain = useCallback(async (subdomainValue: string) => {
    if (!subdomainValue || !isValidSubdomain(subdomainValue)) {
      setError('Invalid subdomain');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // For now, we'll use a placeholder approach
      // In a real implementation, you'd have an API endpoint for this
      // await hostelApi.getHostelBySubdomain(subdomainValue);
      
      // Placeholder implementation - you can replace this with actual API call
      console.log('Fetching hostel for subdomain:', subdomainValue);
      
      // For now, just clear the loading state
      setError(null);
      setHostel(null); // Will be replaced with actual data
      
    } catch (err) {
      console.error('Failed to fetch hostel by subdomain:', err);
      setError('Failed to load hostel data');
      setHostel(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh hostel data
  const refreshHostelData = useCallback(async () => {
    if (subdomain) {
      await fetchHostelBySubdomain(subdomain);
    }
  }, [subdomain, fetchHostelBySubdomain]);

  useEffect(() => {
    // Mark that we're on the client side
    setIsClient(true);
    
    // Only run subdomain detection after client-side hydration
    if (typeof window !== 'undefined') {
      try {
        const detectedSubdomain = getCurrentSubdomain();
        setSubdomain(detectedSubdomain);
        
        // If we have a subdomain, fetch the hostel data
        if (detectedSubdomain) {
          fetchHostelBySubdomain(detectedSubdomain);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error in SubdomainProvider:', err);
        setError('Failed to detect subdomain');
        setIsLoading(false);
      }
    } else {
      // Server-side: set loading to false immediately
      setIsLoading(false);
    }
  }, [fetchHostelBySubdomain]);

  // Don't render context until client-side hydration is complete
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <SubdomainContext.Provider value={{
      subdomain,
      hostel,
      isLoading,
      error,
      isValidHostel: hostel !== null && (hostel.isActive ?? true),
      refreshHostelData,
    }}>
      {children}
    </SubdomainContext.Provider>
  );
}

export const useSubdomain = () => {
  const context = useContext(SubdomainContext);
  if (context === undefined) {
    throw new Error('useSubdomain must be used within a SubdomainProvider');
  }
  return context;
};
