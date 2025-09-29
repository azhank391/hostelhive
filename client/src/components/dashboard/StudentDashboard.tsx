'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStudentApiWithHostel, useCurrentHostelId } from '@/lib/context-aware-api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ComplaintForm } from '@/components/forms/ComplaintForm'
import { VisitorForm } from '@/components/forms/VisitorForm'
import { notification } from '@/lib/toast'
import { 
  HomeIcon, 
  UserIcon, 
  MessageSquareIcon, 
  UsersIcon,
  PlusIcon,
  ClockIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  BedIcon,
  TrendingUpIcon
} from 'lucide-react'
import Link from 'next/link'

interface StudentRoom {
  id: string;
  roomNumber: string;
  block: string;
  capacity: number;
  occupied: number;
  floor?: number;
  amenities?: string[];
}

interface StudentComplaint {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt?: string;
}

interface StudentDashboardData {
  room?: StudentRoom | null;
  complaints?: {
    total: number;
    pending: number;
    resolved: number;
    recent: StudentComplaint[];
  } | null;
  todaysVisitors?: number;
  profile?: {
    name: string;
    email: string;
    phone?: string;
    emergencyContact?: string;
  };
}

interface VisitorLog {
  id: string;
  visitorName: string;
  relation: string;
  checkIn: string;
  checkOut: string | null;
  createdAt: string;
  purpose?: string;
  contactNumber?: string;
}

interface DashboardStats {
  activeVisitors: number;
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  recentVisitors: VisitorLog[];
}

/**
 * 🚀 OPTIMIZED StudentDashboard Component
 * 
 * Performance Improvements:
 * ✅ React.memo for re-render prevention
 * ✅ useMemo for expensive calculations
 * ✅ useCallback for stable function references
 * ✅ Context-aware API integration
 * ✅ Batch data fetching with Promise.all
 * ✅ Optimistic updates for better UX
 * ✅ Real-time statistics calculation
 * ✅ Enhanced error handling and recovery
 */
export const StudentDashboard = React.memo(() => {
  const { user } = useAuth()
  const { hasHostel } = useCurrentHostelId()
  const studentApi = useStudentApiWithHostel()
  
  // State management
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null)
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false)
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false)

  // 🎯 PERFORMANCE: Memoized dashboard statistics
  const stats = useMemo((): DashboardStats => {
    const activeVisitors = visitorLogs.filter(log => !log.checkOut)
    const recentVisitors = visitorLogs
      .filter(log => !log.checkOut)
      .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
      .slice(0, 3)

    return {
      activeVisitors: activeVisitors.length,
      totalComplaints: dashboardData?.complaints?.total || 0,
      pendingComplaints: dashboardData?.complaints?.pending || 0,
      resolvedComplaints: dashboardData?.complaints?.resolved || 0,
      recentVisitors
    }
  }, [visitorLogs, dashboardData])

  // 🎯 PERFORMANCE: Memoized room occupancy percentage
  const roomOccupancyPercentage = useMemo(() => {
    if (!dashboardData?.room) return 0
    const { capacity, occupied } = dashboardData.room
    return capacity > 0 ? Math.round((occupied / capacity) * 100) : 0
  }, [dashboardData?.room])

  // 🎯 PERFORMANCE: Memoized complaint priority distribution
  // Note: priority distribution not used in UI currently

  // 🚀 PERFORMANCE: Optimized batch data fetching
  const fetchAllData = useCallback(async () => {
    if (!hasHostel) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      
      // Batch fetch both dashboard data and visitor logs
      const [dashboardResponse, visitorResponse] = await Promise.all([
        studentApi.getDashboard(),
        studentApi.getVisitorLogs()
      ])
      
  setDashboardData(dashboardResponse as StudentDashboardData)
  const normalizedVisitors: unknown = Array.isArray(visitorResponse) ? visitorResponse : (visitorResponse as Record<string, unknown>)?.data
  setVisitorLogs(Array.isArray(normalizedVisitors) ? normalizedVisitors as VisitorLog[] : [])
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard'
      setError(errorMessage)
      console.error('Failed to fetch dashboard data:', error)
      notification.error('Failed to load dashboard', { description: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [hasHostel, studentApi])

  // 🎯 PERFORMANCE: Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    if (!hasHostel) return
    
    setRefreshing(true)
    try {
      await fetchAllData()
      notification.success('Dashboard refreshed successfully!')
    } catch {
      notification.error('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }, [hasHostel, fetchAllData])

  // 🚀 PERFORMANCE: Optimized complaint submission
  const handleNewComplaint = useCallback(async (complaintData: { 
    title: string; 
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) => {
    if (!hasHostel) {
      notification.error('Please select a hostel first')
      return
    }

    try {
      await studentApi.lodgeComplaint(complaintData)
      
      // Optimistic update - add temporary complaint
      setDashboardData(prev => {
        if (!prev) return prev
        const newComplaint: StudentComplaint = {
          id: `temp-${Date.now()}`,
          title: complaintData.title,
          description: complaintData.description,
          status: 'pending',
          priority: complaintData.priority || 'medium',
          createdAt: new Date().toISOString()
        }
        
        return {
          ...prev,
          complaints: prev.complaints ? {
            ...prev.complaints,
            total: prev.complaints.total + 1,
            pending: prev.complaints.pending + 1,
            recent: [newComplaint, ...prev.complaints.recent.slice(0, 4)]
          } : {
            total: 1,
            pending: 1,
            resolved: 0,
            recent: [newComplaint]
          }
        }
      })
      
      setIsComplaintModalOpen(false)
      notification.success('Complaint submitted successfully!')
      
      // Refresh data after optimistic update
      setTimeout(() => {
        fetchAllData()
      }, 1000)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit complaint'
      console.error('Failed to submit complaint:', error)
      notification.error('Failed to submit complaint', { description: errorMessage })
    }
  }, [hasHostel, studentApi, fetchAllData])

  // 🚀 PERFORMANCE: Optimized visitor registration
  const handleNewVisitor = useCallback(async (visitorData: { 
    visitorName: string; 
    relation: string;
    purpose?: string;
    contactNumber?: string;
  }) => {
    if (!hasHostel || !dashboardData?.room) {
      notification.error('Room information required to register visitor')
      return
    }

    try {
      await studentApi.createVisitorLog(visitorData)
      
      // Optimistic update - add new visitor
      const newVisitor: VisitorLog = {
        id: `temp-${Date.now()}`,
        visitorName: visitorData.visitorName,
        relation: visitorData.relation,
        checkIn: new Date().toISOString(),
        checkOut: null,
        createdAt: new Date().toISOString(),
        purpose: visitorData.purpose,
        contactNumber: visitorData.contactNumber
      }
      
      setVisitorLogs(prev => [newVisitor, ...prev])
      setDashboardData(prev => prev ? {
        ...prev,
        todaysVisitors: (prev.todaysVisitors || 0) + 1
      } : prev)
      
      setIsVisitorModalOpen(false)
      notification.success('Visitor registered successfully!')
      
      // Refresh data after optimistic update
      setTimeout(() => {
        fetchAllData()
      }, 1000)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to register visitor'
      console.error('Failed to register visitor:', error)
      notification.error('Failed to register visitor', { description: errorMessage })
      
      // Revert optimistic update on error
      fetchAllData()
    }
  }, [hasHostel, dashboardData?.room, studentApi, fetchAllData])

  // 🎯 PERFORMANCE: Memoized modal handlers
  const openComplaintModal = useCallback(() => setIsComplaintModalOpen(true), [])
  const closeComplaintModal = useCallback(() => setIsComplaintModalOpen(false), [])
  const openVisitorModal = useCallback(() => setIsVisitorModalOpen(true), [])
  const closeVisitorModal = useCallback(() => setIsVisitorModalOpen(false), [])

  // Initial data fetch
  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchAllData} className="w-full">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <HomeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Hostel Assigned</h3>
          <p className="text-gray-600">Please contact your administrator to assign you to a hostel.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Welcome back, {user?.name}
                {dashboardData?.room && (
                  <span className="ml-2 text-blue-600">• Room {dashboardData.room.roomNumber}</span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <Button 
                onClick={handleRefresh}
                variant="outline" 
                disabled={refreshing}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Link href="/dashboard/student/profile" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center">
                  <UserIcon className="h-4 w-4 mr-2" />
                  My Profile
                </Button>
              </Link>
              <Button 
                onClick={openComplaintModal}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Complaint
              </Button>
              <Button 
                onClick={openVisitorModal}
                variant="outline"
                className="w-full sm:w-auto flex items-center justify-center"
                disabled={!dashboardData?.room}
              >
                <UsersIcon className="h-4 w-4 mr-2" />
                Add Visitor
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <BedIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Room Occupancy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.room ? `${roomOccupancyPercentage}%` : 'N/A'}
                </p>
                {dashboardData?.room && (
                  <p className="text-sm text-gray-500">
                    {dashboardData.room.occupied}/{dashboardData.room.capacity} occupied
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeVisitors}</p>
                <p className="text-sm text-gray-500">
                  {dashboardData?.todaysVisitors || 0} today
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <MessageSquareIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalComplaints}</p>
                <p className="text-sm text-gray-500">
                  {stats.pendingComplaints} pending
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <TrendingUpIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalComplaints > 0 
                    ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500">
                  {stats.resolvedComplaints} resolved
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Room Information */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <HomeIcon className="h-5 w-5 mr-2 text-blue-600" />
              Room Information
            </h3>
            {dashboardData?.room ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Number:</span>
                  <span className="font-medium">{dashboardData.room.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Block:</span>
                  <span className="font-medium">{dashboardData.room.block}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{dashboardData.room.capacity} students</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Currently Occupied:</span>
                  <span className="font-medium">{dashboardData.room.occupied} students</span>
                </div>
                {dashboardData.room.floor && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Floor:</span>
                    <span className="font-medium">{dashboardData.room.floor}</span>
                  </div>
                )}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${roomOccupancyPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {roomOccupancyPercentage}% occupied
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BedIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No room assigned</p>
                <p className="text-sm text-gray-500">Contact administration for room assignment</p>
              </div>
            )}
          </Card>

          {/* Recent Complaints */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <MessageSquareIcon className="h-5 w-5 mr-2 text-orange-600" />
                Recent Complaints
              </h3>
              <Link href="/dashboard/student/complaints">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            {dashboardData?.complaints?.recent && dashboardData.complaints.recent.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.complaints.recent.slice(0, 3).map((complaint) => (
                  <div key={complaint.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{complaint.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        complaint.status === 'resolved' 
                          ? 'bg-green-100 text-green-800'
                          : complaint.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'  
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{complaint.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No complaints yet</p>
                <Button onClick={openComplaintModal} className="mt-2" size="sm">
                  Submit Your First Complaint
                </Button>
              </div>
            )}
          </Card>

          {/* Active Visitors */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UsersIcon className="h-5 w-5 mr-2 text-green-600" />
                Active Visitors
              </h3>
              <Link href="/dashboard/student/visitors">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            {stats.recentVisitors.length > 0 ? (
              <div className="space-y-3">
                {stats.recentVisitors.map((visitor) => (
                  <div key={visitor.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{visitor.visitorName}</h4>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{visitor.relation}</p>
                    <p className="text-xs text-gray-500">
                      Checked in: {new Date(visitor.checkIn).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No active visitors</p>
                {dashboardData?.room && (
                  <Button onClick={openVisitorModal} className="mt-2" size="sm">
                    Register a Visitor
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={openComplaintModal}
                className="flex items-center justify-center p-4 text-left"
              >
                <MessageSquareIcon className="h-5 w-5 mr-3" />
                <div>
                  <div className="font-medium">Submit Complaint</div>
                  <div className="text-sm opacity-75">Report an issue</div>
                </div>
              </Button>
              <Button 
                onClick={openVisitorModal}
                variant="outline"
                disabled={!dashboardData?.room}
                className="flex items-center justify-center p-4 text-left"
              >
                <UsersIcon className="h-5 w-5 mr-3" />
                <div>
                  <div className="font-medium">Add Visitor</div>
                  <div className="text-sm opacity-75">Register visitor</div>
                </div>
              </Button>
              <Link href="/dashboard/student/profile" className="sm:col-span-1">
                <Button variant="outline" className="w-full flex items-center justify-center p-4 text-left">
                  <UserIcon className="h-5 w-5 mr-3" />
                  <div>
                    <div className="font-medium">My Profile</div>
                    <div className="text-sm opacity-75">View & edit</div>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/student/complaints" className="sm:col-span-1">
                <Button variant="outline" className="w-full flex items-center justify-center p-4 text-left">
                  <ClockIcon className="h-5 w-5 mr-3" />
                  <div>
                    <div className="font-medium">All Complaints</div>
                    <div className="text-sm opacity-75">View history</div>
                  </div>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isComplaintModalOpen} 
        onClose={closeComplaintModal}
        title="Submit New Complaint"
      >
        <ComplaintForm 
          onSubmit={handleNewComplaint}
          onCancel={closeComplaintModal}
          hasRoom={!!dashboardData?.room}
        />
      </Modal>

      <Modal 
        isOpen={isVisitorModalOpen} 
        onClose={closeVisitorModal}
        title="Register New Visitor"
      >
        <VisitorForm 
          onSubmit={handleNewVisitor}
          onCancel={closeVisitorModal}
          hasRoom={!!dashboardData?.room}
        />
      </Modal>
    </div>
  )
})

StudentDashboard.displayName = 'StudentDashboard'

export default StudentDashboard
