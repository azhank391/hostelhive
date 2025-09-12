'use client'

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordChangeModal } from './PasswordChangeModal';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import httpClient from '@/lib/http';
import { notification } from '@/lib/toast';

export function PasswordChangeRequirement() {
  const { user, updateUser, setToken, verifyToken } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user needs to change password
  const needsPasswordChange = user?.requiresPasswordChange && 
    (user.role === 'warden' || user.role === 'student' || 
     (user.role && !['owner', 'superadmin', 'admin'].includes(user.role)));

  // Debug logging
  React.useEffect(() => {
    if (user) {
      console.log('🔍 PasswordChangeRequirement Debug:', {
        user: user,
        requiresPasswordChange: user.requiresPasswordChange,
        role: user.role,
        needsPasswordChange: needsPasswordChange,
        isExcludedRole: ['owner', 'superadmin', 'admin'].includes(user.role)
      });
    }
  }, [user, needsPasswordChange]);

  // Show modal if user needs password change
  React.useEffect(() => {
    console.log('🔍 Modal Effect - needsPasswordChange:', needsPasswordChange);
    
    if (needsPasswordChange) {
      // Check if there's a reminder set
      const reminderTime = localStorage.getItem('passwordChangeReminder');
      const now = Date.now();
      
      console.log('🔍 Password Change Check:', {
        reminderTime,
        now,
        reminderValid: reminderTime ? parseInt(reminderTime) > now : false
      });
      
      if (!reminderTime || parseInt(reminderTime) <= now) {
        console.log('🔍 Opening password change modal...');
        // Add a small delay to ensure login is complete
        const timer = setTimeout(() => {
          setIsModalOpen(true);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        console.log('🔍 Password change modal blocked by reminder');
      }
    }
  }, [needsPasswordChange]);

  const handlePasswordChange = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      
      const response = await httpClient.put('/auth/change-password', {
        currentPassword: currentPassword,
        newPassword: newPassword
      });

      if ((response as any)?.data?.success) {
        // If backend returns a new token, update it
        if ((response as any)?.data?.token) {
          const newToken = (response as any).data.token;
          
          // Update the token and verify it to refresh user state
          setToken(newToken);
          await verifyToken(newToken);
        } else {
          // Fallback: update user state locally
          updateUser({ requiresPasswordChange: false });
        }
        
        setIsModalOpen(false);
        // Clear any password change reminder
        localStorage.removeItem('passwordChangeReminder');
        notification.success('Password changed successfully!');
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateUser, setToken, verifyToken]);

  const handleCloseModal = useCallback(() => {
    // Allow closing (skipping) the password change modal
    setIsModalOpen(false);
    
    // Set a reminder to show the modal again after 24 hours
    if (user?.requiresPasswordChange) {
      const reminderTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      localStorage.setItem('passwordChangeReminder', reminderTime.toString());
    }
  }, [user?.requiresPasswordChange]);

  // Don't render anything if user doesn't need password change
  if (!needsPasswordChange) {
    return null;
  }

  // Add a manual trigger button for users who want to change password later
  const handleManualTrigger = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <PasswordChangeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handlePasswordChange}
        isLoading={isLoading}
        userRole={user?.role}
      />
      
      {/* Floating reminder button */}
      {user?.requiresPasswordChange && (
        <button
          onClick={handleManualTrigger}
          className="fixed bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg z-40 transition-colors"
          title="Change your default password"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      )}
    </>
  );
}
