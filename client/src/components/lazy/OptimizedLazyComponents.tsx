import React, { lazy, Suspense, ComponentType, memo } from 'react';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/LoadingSpinner';

// Error boundary for lazy components
class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">Failed to load component</h3>
          <p className="text-red-600 text-sm">Please refresh the page to try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced lazy loading with proper code splitting and error boundaries
export const createLazyComponent = <T extends Record<string, any>>(
  importFn: () => Promise<{ [key: string]: ComponentType<T> }>,
  componentName: string,
  fallback: React.ReactNode = <SkeletonCard />
) => {
  const LazyComponent = lazy(() => 
    importFn().then(module => ({ 
      default: module[componentName] as ComponentType<T>
    }))
  );
  
  const LazyWrapper = memo(function LazyWrapper(props: T) {
    return (
      <LazyComponentErrorBoundary>
        <Suspense fallback={fallback}>
          <LazyComponent {...props} />
        </Suspense>
      </LazyComponentErrorBoundary>
    );
  });

  LazyWrapper.displayName = `Lazy${componentName}`;
  return LazyWrapper;
};

// Dashboard components with optimized lazy loading
export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('@/components/dashboard/AnalyticsDashboard'),
  'AnalyticsDashboard',
  <SkeletonCard className="lg:col-span-2 h-64" />
);

export const LazyQuickActions = createLazyComponent(
  () => import('@/components/dashboard/QuickActions'),
  'QuickActions',
  <SkeletonCard className="h-48" />
);

export const LazyWardenVisitorManagement = createLazyComponent(
  () => import('@/components/dashboard/WardenVisitorManagement'),
  'WardenVisitorManagement',
  <SkeletonCard className="h-64" />
);

export const LazyComplaintManagement = createLazyComponent(
  () => import('@/components/dashboard/ComplaintManagement'),
  'ComplaintManagement',
  <SkeletonCard className="h-64" />
);

export const LazyStudentManagement = createLazyComponent(
  () => import('@/components/dashboard/StudentManagement'),
  'StudentManagement',
  <SkeletonCard className="h-64" />
);

export const LazyRoomManagement = createLazyComponent(
  () => import('@/components/dashboard/RoomManagement'),
  'RoomManagement',
  <SkeletonCard className="h-64" />
);

export const LazyVisitorManagement = createLazyComponent(
  () => import('@/components/dashboard/VisitorManagement'),
  'VisitorManagement',
  <SkeletonCard className="h-64" />
);

export const LazyWardenManagement = createLazyComponent(
  () => import('@/components/dashboard/WardenManagement'),
  'WardenManagement',
  <SkeletonCard className="h-64" />
);

export const LazyHostelManagement = createLazyComponent(
  () => import('@/components/dashboard/HostelManagement'),
  'HostelManagement',
  <SkeletonCard className="h-64" />
);

// Form components
export const LazyCreateHostelForm = createLazyComponent(
  () => import('@/components/forms/CreateHostelForm'),
  'CreateHostelForm',
  <SkeletonCard className="h-96" />
);

export const LazyEditHostelForm = createLazyComponent(
  () => import('@/components/forms/EditHostelForm'),
  'EditHostelForm',
  <SkeletonCard className="h-96" />
);

export const LazyStudentForm = createLazyComponent(
  () => import('@/components/forms/StudentForm'),
  'StudentForm',
  <SkeletonCard className="h-64" />
);

export const LazyRoomForm = createLazyComponent(
  () => import('@/components/forms/RoomForm'),
  'RoomForm',
  <SkeletonCard className="h-64" />
);

export const LazyComplaintForm = createLazyComponent(
  () => import('@/components/forms/ComplaintForm'),
  'ComplaintForm',
  <SkeletonCard className="h-64" />
);

export const LazyVisitorForm = createLazyComponent(
  () => import('@/components/forms/VisitorForm'),
  'VisitorForm',
  <SkeletonCard className="h-64" />
);

export const LazyWardenForm = createLazyComponent(
  () => import('@/components/forms/WardenForm'),
  'WardenForm',
  <SkeletonCard className="h-64" />
);

// Dashboard page components
export const LazyAdminDashboard = createLazyComponent(
  () => import('@/components/dashboard/AdminDashboard'),
  'AdminDashboard',
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

export const LazyStudentDashboard = createLazyComponent(
  () => import('@/components/dashboard/StudentDashboard'),
  'StudentDashboard',
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

export const LazyWardenDashboard = createLazyComponent(
  () => import('@/components/dashboard/WardenDashboard'),
  'WardenDashboard',
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

export const LazySuperadminDashboard = createLazyComponent(
  () => import('@/components/dashboard/SuperadminDashboard'),
  'SuperadminDashboard',
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

