import React from 'react';
interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
  children: React.ReactNode;
}
export function Badge({
  variant = 'primary',
  className = '',
  children
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800'
  };
  const badgeClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;
  return <span className={badgeClasses}>{children}</span>;
}