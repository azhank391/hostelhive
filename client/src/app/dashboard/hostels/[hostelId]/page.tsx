'use client'

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatCard } from '@/components/dashboard/StatCard';
import { ComplaintCard } from '@/components/dashboard/ComplaintCard';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useCurrentHostelId } from '@/lib/context-aware-api';
import { adminApi } from '@/lib/api';
import { useHostel } from '@/context/HostelContext';
import { STORAGE_KEYS } from '@/lib/config';
import { MainContentHostelSelector } from '@/components/HostelSelector';
import type { DashboardStats, Complaint } from '@/lib/types';
import { 
  BuildingIcon, 
  UsersIcon, 
  BedIcon, 
  AlertCircleIcon, 
  MessageSquareIcon,
  EyeIcon,
  UserPlusIcon,
  SettingsIcon
} from 'lucide-react';

export default function HostelDashboardPage() {
  const params = useParams<{ hostelId: string }>();
  const urlHostelId = params?.hostelId || '';
  const router = useRouter();
  
  // Context-aware API hooks for automatic hostelId injection
  const { hasHostel, isReady, getHostelIdSafe } = useCurrentHostelId();
  const { setActiveHostel } = useHostel();
  
  // Dashboard state management
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync URL hostelId with HostelContext
  useEffect(() => {
    if (urlHostelId && !hasHostel) {
      setActiveHostel(urlHostelId, false);
    }
  }, [urlHostelId, hasHostel, setActiveHostel]);

  // Load dashboard data when URL hostel ID is available
  useEffect(() => {
    if (!urlHostelId) {
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Debug: Check authentication state
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          console.log('🔐 Dashboard: Auth token exists:', !!token);
          console.log('🔐 Dashboard: Token preview:', token?.substring(0, 20) + '...');
          console.log('🏢 Dashboard: Hostel ID:', urlHostelId);
        }
        
        // Use direct API calls with URL hostel ID
        const [statsData, complaintsData] = await Promise.all([
          adminApi.getDashboardStats(urlHostelId),
          adminApi.getComplaints(urlHostelId, { page: 1, limit: 6, status: 'pending' })
        ]);

        setDashboardStats(statsData);
        setComplaints(Array.isArray(complaintsData.data) ? complaintsData.data : []);
      } catch (err) {
        console.error('Dashboard load error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [urlHostelId]); // Only depend on URL hostel ID

  // Navigation handlers
  const handleNavigate = (path: string) => {
    router.push(`/dashboard/hostels/${urlHostelId}${path}`);
  };

  // Computed values
  const currentStats = dashboardStats?.stats || {
    totalStudents: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
    totalVisitors: 0,
    activeVisitors: 0,
    totalWardens: 0
  };

  const roomOccupancyPercentage = useMemo(() => {
    const totalRooms = Number(currentStats.totalRooms) || 0;
    const occupiedRooms = Number(currentStats.occupiedRooms) || 0;
    return totalRooms > 0 ? `${Math.round((occupiedRooms / totalRooms) * 100)}%` : '0%';
  }, [currentStats.totalRooms, currentStats.occupiedRooms]);
  
  const resolvedComplaintsCount = useMemo(() => {
    const totalComplaints = Number(currentStats.totalComplaints) || 0;
    const pendingComplaints = Number(currentStats.pendingComplaints) || 0;
    return Math.max(0, totalComplaints - pendingComplaints);
  }, [currentStats.totalComplaints, currentStats.pendingComplaints]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Dashboard</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hostel Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Overview of your hostel's performance and key metrics
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={() => handleNavigate('/settings')}
            variant="outline"
            className="flex items-center"
          >
            <SettingsIcon size={16} className="mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={currentStats.totalStudents?.toString() || '0'} 
          icon={<UsersIcon size={24} />} 
          trend={{
            value: currentStats.totalStudents || 0,
            isPositive: (currentStats.totalStudents || 0) > 0
          }} 
        />
        
        <StatCard 
          title="Total Rooms" 
          value={currentStats.totalRooms?.toString() || '0'} 
          icon={<BuildingIcon size={24} />} 
          trend={{
            value: currentStats.occupiedRooms || 0,
            isPositive: (currentStats.occupiedRooms || 0) > 0
          }} 
        />
        
        <StatCard 
          title="Room Occupancy" 
          value={roomOccupancyPercentage} 
          icon={<BedIcon size={24} />} 
          trend={{
            value: currentStats.availableRooms || 0,
            isPositive: (currentStats.availableRooms || 0) > 0
          }} 
        />
        
        <StatCard 
          title="Open Complaints" 
          value={currentStats.pendingComplaints?.toString() || '0'} 
          icon={<AlertCircleIcon size={24} />} 
          trend={{
            value: resolvedComplaintsCount,
            isPositive: resolvedComplaintsCount > 0
          }} 
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button 
          onClick={() => handleNavigate('/students')}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center space-y-2"
        >
          <UserPlusIcon size={24} />
          <span>Manage Students</span>
        </Button>
        
        <Button 
          onClick={() => handleNavigate('/rooms')}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center space-y-2"
        >
          <BuildingIcon size={24} />
          <span>Manage Rooms</span>
        </Button>
        
        <Button 
          onClick={() => handleNavigate('/visitors')}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center space-y-2"
        >
          <EyeIcon size={24} />
          <span>Visitor Management</span>
        </Button>
        
        <Button 
          onClick={() => handleNavigate('/complaints')}
          variant="outline"
          className="h-20 flex flex-col items-center justify-center space-y-2"
        >
          <MessageSquareIcon size={24} />
          <span>Complaints</span>
        </Button>
      </div>

      {/* Recent Complaints Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <MessageSquareIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Complaints</h2>
          </div>
          
          <Button 
            onClick={() => handleNavigate('/complaints')}
            variant="primary"
            className="flex items-center"
          >
            <MessageSquareIcon size={16} className="mr-2" />
            View All Complaints
          </Button>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent complaints</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complaints.slice(0, 6).map((complaint: any) => (
              <ComplaintCard
                key={complaint.id}
                id={complaint.id}
                title={complaint.title || 'Untitled Complaint'}
                description={complaint.description || 'No description provided'}
                status={(() => {
                  switch (complaint.status) {
                    case 'pending': return 'Open';
                    case 'in_progress': return 'In Progress';
                    case 'resolved': return 'Resolved';
                    case 'rejected': return 'Closed';
                    default: return 'Open';
                  }
                })() as 'Open' | 'In Progress' | 'Resolved' | 'Closed'}
                priority={(complaint.priority || 'medium').charAt(0).toUpperCase() + (complaint.priority || 'medium').slice(1) as 'Low' | 'Medium' | 'High' | 'Critical'}
                reportedBy={{
                  name: complaint.user?.name || 'Unknown',
                  role: complaint.user?.role || 'student',
                  email: complaint.user?.email
                }}
                hostel={complaint.hostel || { name: 'Current Hostel', id: urlHostelId }}
                room={complaint.user?.allocations?.[0]?.room?.roomNumber || 'N/A'}
                createdAt={complaint.createdAt || new Date().toISOString()}
                onResolve={() => {}} // Will be implemented later
              />
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {roomOccupancyPercentage}
            </div>
            <div className="text-sm text-gray-600">Room Occupancy Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {currentStats.totalStudents || 0}
            </div>
            <div className="text-sm text-gray-600">Active Students</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {currentStats.pendingComplaints || 0}
            </div>
            <div className="text-sm text-gray-600">Pending Issues</div>
          </div>
        </div>
      </div>
    </div>
  );
}
