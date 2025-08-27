'use client'

import React, { useState } from 'react';
import Image from 'next/image';

interface SmartAvatarProps {
  user?: {
    name?: string;
    profilePicture?: string;
  } | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SmartAvatar({ user, size = 'md', className = '' }: SmartAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
    xl: 'h-12 w-12 text-lg'
  };

  const hasProfilePicture = user?.profilePicture && !imageError;
  const userInitial = user?.name && user.name.trim() ? user.name.trim().charAt(0).toUpperCase() : 'U';

  const handleImageError = () => {
    setImageError(true);
  };

  // If no user, show nothing
  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Show profile picture if available and no error */}
      {hasProfilePicture ? (
        <Image 
          className={`rounded-full object-cover ${sizeClasses[size]}`}
          src={user.profilePicture || ''}
          alt={`${user.name || 'User'} profile`}
          width={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 40 : 48}
          onError={handleImageError}
        />
      ) : (
        /* Always show initials if no profile picture */
        <div 
          className={`rounded-full bg-blue-600 flex items-center justify-center text-white font-medium ${
            sizeClasses[size]
          }`}
        >
          {userInitial}
        </div>
      )}
    </div>
  );
}
