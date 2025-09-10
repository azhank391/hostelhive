'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { 
  UsersIcon, 
  HomeIcon, 
  AlertCircleIcon, 
  UserCheckIcon,
  RefreshCwIcon,
  BarChartIcon,
  CalendarIcon,
  ClockIcon
} from '../ui/icons';
import { notification } from '../../lib/toast';
import { useCurrentHostelId, useAdminApiWithHostel } from '@/lib/context-aware-api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { generateColorClass } from '@/lib/utils';

interface WardenDashboardStats {
  totalStudents: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  totalComplaints: number;
  currentVisitors: number;
  todayVisitors: number;
  occupancyRate: number;
}

interface RecentActivity {
  id: string;
  type: 'complaint' | 'visitor' | 'student' | 'room';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  severity?: 'low' | 'medium' | 'high' | 'urgent';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  count?: number;
}

/**
 * 🚀 OPTIMIZED WardenDashboard Component
 * 
 * Performance Improvements:
 * ✅ React.memo for re-render prevention
 * ✅ useMemo for expensive calculations and filtering
 * ✅ useCallback for stable function references
 * ✅ Context-aware API integration
 * ✅ Batch data fetching with Promise.all
 * ✅ Real-time statistics calculation
 * ✅ Optimized quick actions and navigation
 * ✅ Enhanced error handling with graceful fallbacks
 */
export const WardenDashboard = React.memo(() => {
  const { user } = useAuth()
  const { hasHostel, getHostelIdSafe } = useCurrentHostelId()
  const adminApi = useAdminApiWithHostel()
  
  // State management
  const [stats, setStats] = useState<WardenDashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🎯 PERFORMANCE: Memoized quick actions with dynamic counts
  const quickActions = useMemo((): QuickAction[] => {
    const hostelId = getHostelIdSafe();
    return [
      {
        id: 'students',
        title: 'Manage Students',
        description: 'View and manage student records',
        icon: UsersIcon,
        href: `/dashboard/hostels/${hostelId}/students`,
        color: 'blue',
        count: stats?.totalStudents
      },
      {
        id: 'rooms',
        title: 'Manage Rooms',
        description: 'Room assignments and availability',
        icon: HomeIcon,
        href: `/dashboard/hostels/${hostelId}/rooms`,
        color: 'green',
        count: stats?.totalRooms
      },
      {
        id: 'complaints',
        title: 'Handle Complaints',
        description: 'Review and resolve issues',
        icon: AlertCircleIcon,
        href: `/dashboard/hostels/${hostelId}/complaints`,
        color: 'orange',
        count: stats?.pendingComplaints
      },
      {
        id: 'visitors',
        title: 'Visitor Management',
        description: 'Monitor visitor activity',
        icon: UserCheckIcon,
        href: `/dashboard/hostels/${hostelId}/visitors`,
        color: 'purple',
        count: stats?.currentVisitors
      },
      {
        id: 'analytics',
        title: 'View Analytics',
        description: 'Dashboard reports and insights',
        icon: CalendarIcon,
        href: `/dashboard/hostels/${hostelId}/analytics`,
        color: 'indigo',
      },
      {
        id: 'settings',
        title: 'Hostel Settings',
        description: 'Configure hostel preferences',
        icon: AlertCircleIcon,
        href: `/dashboard/hostels/${hostelId}/settings`,
        color: 'gray',
      }
    ];
  }, [stats, getHostelIdSafe]) // Include getHostelIdSafe in dependencies

  // 🎯 PERFORMANCE: Memoized priority metrics
  const priorityMetrics = useMemo(() => {
    if (!stats) return { urgent: 0, attention: 0, good: 0 }
    
    const occupancyRate = stats.occupancyRate || 0
    const complaintRate = stats.totalComplaints > 0 
      ? (stats.pendingComplaints / stats.totalComplaints) * 100 
      : 0
    
    return {
      urgent: stats.pendingComplaints > 10 ? 1 : 0,
      attention: occupancyRate > 90 || complaintRate > 30 ? 1 : 0,
      good: occupancyRate < 90 && complaintRate < 20 && stats.pendingComplaints < 5 ? 1 : 0
    }
  }, [stats])

  // 🎯 PERFORMANCE: Memoized activity filtering by type and recency
  const filteredRecentActivity = useMemo(() => {
    return recentActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
  }, [recentActivity])

  // 🚀 PERFORMANCE: Optimized batch data fetching using context-aware API
  const fetchDashboardData = useCallback(async () => {
    if (!hasHostel) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      const currentHostelId = getHostelIdSafe();
      if (!currentHostelId) {
        setError('No hostel selected');
        setLoading(false);
        return;
      }
      
      console.log('Fetching warden dashboard data for hostel:', currentHostelId);
      
      // Use context-aware API for all data fetching with proper error handling
      const [statsResponse, visitorsResponse, studentsResponse, roomsResponse] = await Promise.all([
        adminApi.getDashboardStats().catch(error => {
          console.warn('Dashboard stats fetch failed:', error);
          return { data: {} }; // Return empty object instead of failing
        }),
        adminApi.getVisitorLogs({ limit: 20 }).catch(error => {
          console.warn('Visitor logs fetch failed:', error);
          return { data: [] };
        }),
        adminApi.getStudents({ limit: 10 }).catch(error => {
          console.warn('Students fetch failed:', error);
          return { data: [] };
        }),
        adminApi.getRooms({ limit: 10 }).catch(error => {
          console.warn('Rooms fetch failed:', error);
          return { data: [] };
        })
      ])
      
      // Process and calculate comprehensive stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Extract and validate response data with type safety
      const extractData = function<T>(response: any, defaultValue: T): T {
        if (!response) return defaultValue;
        if (typeof response === 'object' && response !== null && 'data' in response) {
          return response.data ?? defaultValue;
        }
        return response ?? defaultValue;
      };

      const stats = extractData(statsResponse, {} as any);
      const visitorsData = extractData(visitorsResponse, [] as any[]);
      const studentsData = extractData(studentsResponse, [] as any[]);
      const roomsData = extractData(roomsResponse, [] as any[]);
      const complaintsData = Array.isArray(stats.complaints) ? stats.complaints : [];
      
      // Calculate metrics
      const currentVisitors = visitorsData.filter((v: any) => !v.checkOut).length;
      const todayVisitors = visitorsData.filter((v: any) => 
        new Date(v.checkIn) >= today
      ).length;

      const occupiedRooms = roomsData.filter((r: any) => r.occupied).length;
      const pendingComplaints = complaintsData.filter((c: any) => c.status === 'pending').length;
      
      // Update stats state with combined data
      const newStats: WardenDashboardStats = {
        totalStudents: stats.totalStudents || studentsData.length,
        totalRooms: stats.totalRooms || roomsData.length,
        occupiedRooms: stats.occupiedRooms || occupiedRooms,
        availableRooms: stats.availableRooms || (roomsData.length - occupiedRooms),
        pendingComplaints: stats.pendingComplaints || pendingComplaints,
        resolvedComplaints: stats.resolvedComplaints || (complaintsData.length - pendingComplaints),
        totalComplaints: stats.totalComplaints || complaintsData.length,
        currentVisitors,
        todayVisitors,
        occupancyRate: stats.occupancyRate || (roomsData.length > 0 ? Math.round((occupiedRooms / roomsData.length) * 100) : 0)
      }
      
      setStats(newStats)
      
      // Generate recent activity from various data sources
      const activities: RecentActivity[] = []
      
      // Add recent complaints
      if (Array.isArray(complaintsData)) {
        complaintsData.slice(0, 3).forEach((complaint: any) => {
          activities.push({
            id: `complaint-${complaint.id}`,
            type: 'complaint',
            title: complaint.title || 'New Complaint',
            description: complaint.description || 'No description provided',
            timestamp: complaint.createdAt || new Date().toISOString(),
            status: complaint.status,
            severity: complaint.priority || 'medium'
          })
        })
      }
      
      // Add recent visitors
      if (Array.isArray(visitorsData)) {
        visitorsData.slice(0, 3).forEach((visitor: any) => {
          activities.push({
            id: `visitor-${visitor.id}`,
            type: 'visitor',
            title: `${visitor.visitorName} checked in`,
            description: `Visiting ${visitor.studentName || 'student'} - ${visitor.relation}`,
            timestamp: visitor.checkIn || new Date().toISOString(),
            status: visitor.checkOut ? 'checked_out' : 'active'
          })
        })
      }
      
      setRecentActivity(activities)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data'
      console.error('Failed to fetch warden dashboard data:', error)
      
      // Handle permission errors gracefully
      if (errorMessage.includes('Access denied') || errorMessage.includes('permission')) {
        setError('You do not have permission to view dashboard statistics. Please contact your administrator.');
      } else {
        setError(errorMessage);
        notification.error('Failed to load dashboard', { description: errorMessage });
      }
    } finally {
      setLoading(false)
    }
  }, [hasHostel, getHostelIdSafe, adminApi])

  // 🎯 PERFORMANCE: Optimized refresh handler with debounce
  const handleRefresh = useCallback(async () => {
    if (!hasHostel || refreshing) return
    
    setRefreshing(true)
    try {
      await fetchDashboardData()
      notification.success('Dashboard refreshed successfully!')
    } catch (err) {
      notification.error('Failed to refresh dashboard')
    } finally {
      setTimeout(() => setRefreshing(false), 500) // Add debounce to prevent rapid refreshes
    }
  }, [hasHostel, fetchDashboardData, refreshing])

  // 🎯 PERFORMANCE: Memoized time formatting
  const formatRelativeTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }, [])

  const getActivityIcon = useCallback((type: string) => {
    switch (type) {
      case 'complaint': return AlertCircleIcon
      case 'visitor': return UserCheckIcon
      case 'student': return UsersIcon
      case 'room': return HomeIcon
      default: return ClockIcon
    }
  }, [])

  const getActivityColor = useCallback((type: string, severity?: string) => {
    if (type === 'complaint') {
      switch (severity) {
        case 'urgent': return 'text-red-600 bg-red-50'
        case 'high': return 'text-orange-600 bg-orange-50'
        case 'medium': return 'text-yellow-600 bg-yellow-50'
        default: return 'text-blue-600 bg-blue-50'
      }
    }
    return 'text-gray-600 bg-gray-50'
  }, [])

  // Initial data fetch with debounced loading
  useEffect(() => {
    let isSubscribed = true;
    let loadingTimeout: NodeJS.Timeout;

    const fetchData = async () => {
      if (!hasHostel) return;
      
      // Show loading state after a small delay to prevent flashing
      loadingTimeout = setTimeout(() => {
        if (isSubscribed) setLoading(true);
      }, 200);

      try {
        await fetchDashboardData();
      } catch (error) {
        // Error handling is done inside fetchDashboardData
      } finally {
        if (isSubscribed) {
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isSubscribed = false;
      clearTimeout(loadingTimeout);
    };
  }, [hasHostel]); // Remove fetchDashboardData from dependencies to prevent infinite loop

  // No hostel state or loading state
  if (!hasHostel || loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-6">
          {loading ? (
            <>
              <LoadingSpinner className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Dashboard</h3>
              <p className="text-gray-600">Please wait while we fetch your data...</p>
            </>
          ) : !hasHostel ? (
            <>
              <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Hostel Assigned</h3>
              <p className="text-gray-600">Please contact your administrator to assign you to a hostel.</p>
            </>
          ) : error ? (
            <>
              <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchDashboardData} className="w-full">
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warden Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.name}
            {stats && (
              <span className="ml-2 text-blue-600">
                • {stats.occupancyRate}% occupancy • {stats.currentVisitors} visitors
              </span>
            )}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            disabled={refreshing}
            className="flex items-center"
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Priority Alerts */}
      {priorityMetrics.urgent > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircleIcon className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Urgent Attention Required</h3>
              <p className="text-sm text-red-700">
                {stats?.pendingComplaints} pending complaints require immediate attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeleton for stats cards
          Array(4).fill(0).map((_, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <>
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <UsersIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                  <p className="text-xs text-gray-500">Registered students</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <HomeIcon className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Room Occupancy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.occupancyRate || 0}%</p>
                  <p className="text-xs text-gray-500">
                    {stats?.occupiedRooms || 0}/{stats?.totalRooms || 0} rooms occupied
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <AlertCircleIcon className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Pending Complaints</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendingComplaints || 0}</p>
                  <p className="text-xs text-gray-500">
                    {stats?.resolvedComplaints || 0} resolved
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <UserCheckIcon className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Current Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.currentVisitors || 0}</p>
                  <p className="text-xs text-gray-500">
                    {stats?.todayVisitors || 0} today
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChartIcon className="h-5 w-5 mr-2 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loading ? (
              // Loading skeleton for quick actions
              Array(6).fill(0).map((_, index) => (
                <div key={index} className="p-4 rounded-lg border border-gray-200 animate-pulse">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-5 w-5 bg-gray-200 rounded-full" />
                    <div className="h-4 w-8 bg-gray-200 rounded" />
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
              ))
            ) : (
              quickActions.map((action) => {
                const IconComponent = action.icon
                const colorClass = generateColorClass(action.color)
                const hoverColorClass = generateColorClass(action.color, 'text', '600')
                
                return (
                  <Link key={action.id} href={action.href}>
                    <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group">
                      <div className="flex items-center justify-between mb-2">
                        <IconComponent className={`h-5 w-5 ${colorClass} group-hover:${hoverColorClass} transition-colors`} />
                        {action.count !== undefined && (
                          <span className="text-sm font-medium text-gray-600">
                            {action.count}
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-gray-900 group-hover:text-gray-700">
                        {action.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {action.description}
                      </div>
                    </button>
                  </Link>
                )
              })
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-green-600" />
            Recent Activity
          </h3>
          {loading ? (
            // Loading skeleton for recent activity
            <div className="space-y-3">
              {Array(5).fill(0).map((_, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 animate-pulse">
                  <div className="p-2 rounded-full bg-gray-200">
                    <div className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                    <div className="h-3 w-1/3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRecentActivity.length > 0 ? (
            <div className="space-y-3">
              {filteredRecentActivity.map((activity) => {
                const IconComponent = getActivityIcon(activity.type)
                const colorClasses = getActivityColor(activity.type, activity.severity)
                
                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-full ${colorClasses}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(activity.timestamp)}
                        {activity.status && (
                          <span className="ml-2 capitalize">
                            • {activity.status.replace('_', ' ')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div className="pt-3 border-t border-gray-200">
                <Link href="/dashboard/warden/activity">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Activity
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p>No recent activity</p>
              <p className="text-sm">Activity will appear here as events occur</p>
            </div>
          )}
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Performance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton for performance metrics
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="text-center animate-pulse">
                <div className="flex items-center justify-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                </div>
                <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-2" />
                <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
              </div>
            ))
          ) : (
            <>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <UsersIcon className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? Math.round(((stats.resolvedComplaints || 0) / Math.max(stats.totalComplaints, 1)) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600">Complaint Resolution Rate</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <HomeIcon className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.occupancyRate || 0}%</p>
                <p className="text-sm text-gray-600">Room Occupancy Rate</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <UserCheckIcon className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats?.todayVisitors || 0}</p>
                <p className="text-sm text-gray-600">Today's Visitors</p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
})

WardenDashboard.displayName = 'WardenDashboard'

export default WardenDashboard
