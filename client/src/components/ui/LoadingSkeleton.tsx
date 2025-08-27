import { memo } from 'react'

interface SkeletonProps {
  className?: string
  count?: number
}

export const Skeleton = memo(({ className = '', count = 1 }: SkeletonProps) => {
  if (count === 1) {
    return (
      <div 
        className={`animate-pulse bg-gray-200 rounded ${className}`} 
        aria-label="Loading..."
      />
    )
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div 
          key={index}
          className={`animate-pulse bg-gray-200 rounded ${className}`}
          aria-label="Loading..."
        />
      ))}
    </div>
  )
})

Skeleton.displayName = 'Skeleton'

// Dashboard skeleton components
export const DashboardSkeleton = memo(() => (
  <div className="space-y-6 p-6">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    
    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="bg-white p-6 rounded-lg border">
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
    
    {/* Charts/content skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg border">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="bg-white p-6 rounded-lg border">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" count={5} />
        </div>
      </div>
    </div>
  </div>
))

DashboardSkeleton.displayName = 'DashboardSkeleton'

// Table skeleton component
export const TableSkeleton = memo(({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) => (
  <div className="bg-white rounded-lg border overflow-hidden">
    {/* Table header */}
    <div className="border-b bg-gray-50 p-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-4 w-20" />
        ))}
      </div>
    </div>
    
    {/* Table rows */}
    <div className="divide-y">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
))

TableSkeleton.displayName = 'TableSkeleton'

// Form skeleton component
export const FormSkeleton = memo(() => (
  <div className="bg-white p-6 rounded-lg border space-y-6">
    <Skeleton className="h-8 w-48" />
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    
    <div className="flex justify-end space-x-3">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
))

FormSkeleton.displayName = 'FormSkeleton'

// Card skeleton component
export const CardSkeleton = memo(() => (
  <div className="bg-white p-6 rounded-lg border space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-4 w-full" count={3} />
    <div className="flex justify-between items-center pt-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  </div>
))

CardSkeleton.displayName = 'CardSkeleton'

// List skeleton component
export const ListSkeleton = memo(({ items = 5 }: { items?: number }) => (
  <div className="bg-white rounded-lg border divide-y">
    {Array.from({ length: items }, (_, index) => (
      <div key={index} className="p-4 flex items-center space-x-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    ))}
  </div>
))

ListSkeleton.displayName = 'ListSkeleton'
