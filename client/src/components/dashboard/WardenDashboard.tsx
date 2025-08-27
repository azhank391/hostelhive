'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminApiWithHostel, useCurrentHostelId } from '@/lib/context-aware-api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { notification } from '@/lib/toast'
import { 
  UsersIcon, 
  BedIcon, 
  AlertCircleIcon, 
  UserCheckIcon,
  TrendingUpIcon,
  ClockIcon,
  RefreshCwIcon,
  PlusIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  CheckCircleIcon
} from 'lucide-react'
import Link from 'next/link'

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
  const { hostelId, hasHostel } = useCurrentHostelId()
  const adminApi = useAdminApiWithHostel()
  
  // State management
  const [stats, setStats] = useState<WardenDashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🎯 PERFORMANCE: Memoized quick actions with dynamic counts
  const quickActions = useMemo((): QuickAction[] => [
    {
      id: 'students',
      title: 'Manage Students',
      description: 'View and manage student records',
      icon: UsersIcon,
      href: '/dashboard/warden/students',
      color: 'blue',
      count: stats?.totalStudents
    },
    {
      id: 'rooms',
      title: 'Manage Rooms',
      description: 'Room assignments and availability',
      icon: BedIcon,
      href: '/dashboard/warden/rooms',
      color: 'green',
      count: stats?.totalRooms
    },
    {
      id: 'complaints',
      title: 'Handle Complaints',
      description: 'Review and resolve issues',
      icon: AlertCircleIcon,
      href: '/dashboard/warden/complaints',
      color: 'orange',
      count: stats?.pendingComplaints
    },
    {
      id: 'visitors',
      title: 'Visitor Management',
      description: 'Monitor visitor activity',
      icon: UserCheckIcon,
      href: '/dashboard/warden/visitors',
      color: 'purple',
      count: stats?.currentVisitors
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Dashboard reports and insights',
      icon: BarChart3Icon,
      href: '/dashboard/warden/analytics',
      color: 'indigo',
    },
    {
      id: 'settings',
      title: 'Hostel Settings',
      description: 'Configure hostel preferences',
      icon: AlertTriangleIcon,
      href: '/dashboard/warden/settings',
      color: 'gray',
    }
  ], [stats])

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

  // 🚀 PERFORMANCE: Optimized batch data fetching
  const fetchDashboardData = useCallback(async () => {
    if (!hasHostel) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      // Batch fetch all dashboard data
      const [
        dashboardStats, 
        complaints, 
        visitors, 
        students, 
        rooms
      ] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getComplaints({ limit: 50 }),
        adminApi.getVisitorLogs({ limit: 20 }),
        adminApi.getStudents({ limit: 10 }),
        adminApi.getRooms({ limit: 10 })
      ])
      
      // Process and calculate comprehensive stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const pendingComplaints = Array.isArray(complaints?.data) 
        ? complaints.data.filter((c: any) => c.status === 'pending' || c.status === 'in_progress').length
        : 0
      const totalComplaints = Array.isArray(complaints?.data) ? complaints.data.length : 0
      const resolvedComplaints = totalComplaints - pendingComplaints
      
      const currentVisitors = visitors && typeof visitors === 'object' && Array.isArray((visitors as any).data)
        ? (visitors as any).data.filter((v: any) => !v.checkOut).length
        : 0
      const todayVisitors = visitors && typeof visitors === 'object' && Array.isArray((visitors as any).data)
        ? (visitors as any).data.filter((v: any) => new Date(v.checkIn) >= today).length
        : 0
      
      const totalStudents = Array.isArray(students?.data) ? students.data.length : 0
      const totalRooms = Array.isArray(rooms?.data) ? rooms.data.length : 0
      const occupiedRooms = Array.isArray(rooms?.data)
        ? rooms.data.filter((r: any) => r.occupied > 0).length
        : 0
      const availableRooms = totalRooms - occupiedRooms
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
      
      setStats({
        totalStudents,
        totalRooms,
        occupiedRooms,
        availableRooms,
        pendingComplaints,
        resolvedComplaints,
        totalComplaints,
        currentVisitors,
        todayVisitors,
        occupancyRate
      })
      
      // Generate recent activity from various data sources
      const activities: RecentActivity[] = []
      
      // Add recent complaints
      if (Array.isArray(complaints?.data)) {
        complaints.data.slice(0, 3).forEach((complaint: any) => {
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
      if (visitors && typeof visitors === 'object' && 'data' in visitors && Array.isArray(visitors.data)) {
        visitors.data.slice(0, 3).forEach((visitor: any) => {
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
      setError(errorMessage)
      console.error('Failed to fetch warden dashboard data:', error)
      notification.error('Failed to load dashboard', { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [hasHostel, adminApi])

  // 🎯 PERFORMANCE: Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    if (!hasHostel) return
    
    setRefreshing(true)
    try {
      await fetchDashboardData()
      notification.success('Dashboard refreshed successfully!')
    } catch (err) {
      notification.error('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }, [hasHostel, fetchDashboardData])

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
      case 'room': return BedIcon
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

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading warden dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData} className="w-full">
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // No hostel state
  if (!hasHostel) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md mx-auto p-6">
          <BedIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Hostel Assigned</h3>
          <p className="text-gray-600">Please contact your administrator to assign you to a hostel.</p>
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
            <AlertTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
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
            <BedIcon className="h-8 w-8 text-green-500" />
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
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUpIcon className="h-5 w-5 mr-2 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const IconComponent = action.icon
              return (
                <Link key={action.id} href={action.href}>
                  <button className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group">
                    <div className="flex items-center justify-between mb-2">
                      <IconComponent className={`h-5 w-5 text-${action.color}-500 group-hover:text-${action.color}-600 transition-colors`} />
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
            })}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-green-600" />
            Recent Activity
          </h3>
          {filteredRecentActivity.length > 0 ? (
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
          <BarChart3Icon className="h-5 w-5 mr-2 text-indigo-600" />
          Performance Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats ? Math.round(((stats.resolvedComplaints || 0) / Math.max(stats.totalComplaints, 1)) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-600">Complaint Resolution Rate</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BedIcon className="h-8 w-8 text-blue-500" />
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
        </div>
      </Card>
    </div>
  )
})

WardenDashboard.displayName = 'WardenDashboard'

export default WardenDashboard
