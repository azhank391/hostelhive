'use client'

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordChangeModal } from './PasswordChangeModal';
import { api } from '@/lib/http';
import { notification } from '@/lib/toast';

export function PasswordChangeRequirement() {
  const { user, updateUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user needs to change password
  const needsPasswordChange = user?.requiresPasswordChange && 
    (user.role === 'warden' || user.role === 'student');

  // Show modal if user needs password change
  React.useEffect(() => {
    if (needsPasswordChange) {
      // Check if there's a reminder set
      const reminderTime = localStorage.getItem('passwordChangeReminder');
      const now = Date.now();
      
      if (!reminderTime || parseInt(reminderTime) <= now) {
        // Add a small delay to ensure login is complete
        const timer = setTimeout(() => {
          setIsModalOpen(true);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [needsPasswordChange]);

  const handlePasswordChange = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      
      const response = await api.put('/auth/change-password', {
        currentPassword: currentPassword,
        newPassword: newPassword
      });

      if (response.data.success) {
        // Update user state to remove password change requirement
        updateUser({ requiresPasswordChange: false });
        setIsModalOpen(false);
        // Clear any password change reminder
        localStorage.removeItem('passwordChangeReminder');
        // User can now access the dashboard
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [updateUser]);

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
