import React from 'react'

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  )
}
interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}
export function CardHeader({
  className = '',
  children
}: CardHeaderProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}
export function CardContent({
  className = '',
  children
}: CardContentProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}
export function CardFooter({
  className = '',
  children
}: CardFooterProps) {
  return <div className={`px-6 py-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>;
}