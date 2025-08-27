'use client';

import { useEffect } from 'react';
import { CreateHostelForm } from '../forms/CreateHostelForm';

interface CreateHostelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateHostelModal({ isOpen, onClose, onSuccess }: CreateHostelModalProps) {
  // Handle escape key - moved before early return
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          <CreateHostelForm 
            isModal={true} 
            onClose={onClose}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
