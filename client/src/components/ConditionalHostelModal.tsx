'use client';

import { useHostel } from '@/context/HostelContext';
import { useAuth } from '@/contexts/AuthContext';
import { HostelSelectionModal } from './HostelSelectionModal';

export function ConditionalHostelModal() {
  // 🎯 Updated to use new context architecture
  const { hostels, loadingState, currentHostel } = useHostel();
  const { user } = useAuth();

  // Only render if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  // Use AuthContext instead of localStorage directly
  if (!user) {
    return null;
  }

  // Only show for owners
  if (user.role !== 'owner') {
    return null;
  }

  // Only render the modal if:
  // 1. Context finished loading
  // 2. Owner has multiple hostels
  // 3. No current hostel is selected
  if (loadingState !== 'loaded') {
    return null;
  }

  // Show modal when owner has multiple hostels but no current hostel selected
  const needsHostelSelection = !currentHostel && hostels.length > 1;

  if (!needsHostelSelection) {
    return null;
  }

  return <HostelSelectionModal />;
}
