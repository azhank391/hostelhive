'use client'

import { ReactNode, memo } from 'react'

import { DashboardLayout } from './DashboardLayout'
import { cn } from '@/lib/utils'

interface ResponsiveLayoutProps {
  children: ReactNode
  className?: string
  title?: string
}

export const ResponsiveLayout = memo(({
  children,
  className,
  title
}: ResponsiveLayoutProps) => {

  // For desktop, use the existing dashboard layout
  // For mobile, use a simplified layout with mobile navigation
  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen bg-gray-50">
        {/* Main Content */}
        <main className={cn(
          'pt-16 pb-20', // Account for top bar and bottom nav
          className
        )}>
          {title && (
            <div className="bg-white border-b border-gray-200 px-4 py-4">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
          )}
          
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>
    </>
  )
})

ResponsiveLayout.displayName = 'ResponsiveLayout'

// Mobile-optimized card grid
interface MobileCardGridProps {
  children: ReactNode
  columns?: 1 | 2
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export const MobileCardGrid = memo(({
  children,
  columns = 1,
  gap = 'md',
  className
}: MobileCardGridProps) => {
  const gaps = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }

  const cols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2'
  }

  return (
    <div className={cn(
      'grid',
      cols[columns],
      gaps[gap],
      className
    )}>
      {children}
    </div>
  )
})

MobileCardGrid.displayName = 'MobileCardGrid'

// Mobile-optimized list
interface MobileListProps {
  children: ReactNode
  divided?: boolean
  padding?: 'sm' | 'md' | 'lg'
  className?: string
}

export const MobileList = memo(({
  children,
  divided = true,
  className
}: MobileListProps) => {

  return (
    <div className={cn(
      'bg-white rounded-lg overflow-hidden',
      className
    )}>
      <div className={cn(
        divided && 'divide-y divide-gray-200'
      )}>
        {children}
      </div>
    </div>
  )
})

MobileList.displayName = 'MobileList'

// Mobile list item
interface MobileListItemProps {
  children: ReactNode
  onClick?: () => void
  rightElement?: ReactNode
  leftElement?: ReactNode
  subtitle?: string
  className?: string
}

export const MobileListItem = memo(({
  children,
  onClick,
  rightElement,
  leftElement,
  subtitle,
  className
}: MobileListItemProps) => {
  const Component = onClick ? 'button' : 'div'
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between p-4 text-left',
        onClick && 'hover:bg-gray-50 active:bg-gray-100 transition-colors',
        className
      )}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {leftElement && (
          <div className="flex-shrink-0">
            {leftElement}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {children}
          </div>
          {subtitle && (
            <div className="text-sm text-gray-500 truncate">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      
      {rightElement && (
        <div className="flex-shrink-0 ml-3">
          {rightElement}
        </div>
      )}
    </Component>
  )
})

MobileListItem.displayName = 'MobileListItem'

// Mobile-optimized stats grid
interface MobileStatsProps {
  stats: Array<{
    label: string
    value: string | number
    icon?: ReactNode
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
    trend?: {
      value: number
      isPositive: boolean
    }
  }>
  columns?: 2 | 3 | 4
  className?: string
}

export const MobileStats = memo(({ stats, columns = 2, className }: MobileStatsProps) => {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4'
  }

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-50 text-gray-700'
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              
              {stat.trend && (
                <div className={cn(
                  'flex items-center mt-2 text-sm',
                  stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}>
                  <span>{stat.trend.isPositive ? '↗' : '↘'}</span>
                  <span className="ml-1">{Math.abs(stat.trend.value)}%</span>
                </div>
              )}
            </div>
            
            {stat.icon && (
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                colorClasses[stat.color || 'gray']
              )}>
                {stat.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
})

MobileStats.displayName = 'MobileStats'
