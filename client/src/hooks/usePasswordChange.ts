import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api-url';

export function usePasswordChange() {
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    // Only show password change modal for students/wardens who need to change their password
    if (user && 
        ['student', 'warden'].includes(user.role) && 
        user.requiresPasswordChange) {
      setShowPasswordModal(true);
    } else {
      setShowPasswordModal(false);
    }
  }, [user]);

  const handlePasswordChange = async (newPassword: string) => {
    try {
      // Call API to change password
      const response = await fetch(getApiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ newPassword })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to change password');
      }

      // Close modal after successful password change
      setShowPasswordModal(false);
      
      // Optionally refresh user data to update requiresPasswordChange flag
      // This would depend on your auth context implementation
      
    } catch (error) {
      throw error;
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };

  return {
    showPasswordModal,
    handlePasswordChange,
    closePasswordModal,
    userRole: user?.role
  };
}
