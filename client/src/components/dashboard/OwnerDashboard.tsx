'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHostel } from '@/context/HostelContext';
import { useCurrentHostelId } from '@/lib/context-aware-api';
import { api } from '@/lib/http';
import { notification } from '@/lib/toast';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  Building2, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Loader2
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalRooms: number;
  totalComplaints: number;
  totalVisitors: number;
  occupancyRate: number;
  complaintsResolved: number;
}

export default function OwnerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentHostel, hostels, loadingState, isReady } = useHostel();
  const contextHostelData = useCurrentHostelId();
  const hostelId = contextHostelData.hostelId;
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isCorrectRoute, setIsCorrectRoute] = useState(false);

  // Check if we're on the correct route before making API calls
  useEffect(() => {
    if (typeof window !== 'undefined' && hostelId) {
      const currentPath = window.location.pathname;
      const expectedPath = `/dashboard/hostels/${hostelId}`;
      setIsCorrectRoute(currentPath === expectedPath);
    }
  }, [hostelId]);

  // Fetch dashboard stats only when ready and on correct route
  useEffect(() => {
    if (!isCorrectRoute || !hostelId) {
      return;
    }

    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const response = await api.get<DashboardStats>(`/hostels/${hostelId}/stats`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        notification.error('Failed to load dashboard statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isCorrectRoute, hostelId]);

  // Show loading state while authentication or hostel selection is in progress
  if (authLoading || loadingState === 'loading' || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show message if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">Please log in to view the dashboard</p>
        </div>
      </div>
    );
  }

  // Show message if no hostel is selected
  if (!currentHostel) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building2 className="h-8 w-8 mx-auto mb-4 text-blue-500" />
          <p className="text-muted-foreground">Please select a hostel to view the dashboard</p>
        </div>
      </div>
    );
  }

  // Show message if not on correct route
  if (!isCorrectRoute) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-4 text-orange-500" />
          <p className="text-muted-foreground">Redirecting to hostel dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's what's happening at {currentHostel.name}
          </p>
        </div>
        <Badge variant="neutral" className="text-sm">
          {currentHostel.subdomain}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Students</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.totalStudents || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Rooms</h3>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.totalRooms || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Active Complaints</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.totalComplaints || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Today's Visitors</h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.totalVisitors || 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Occupancy Rate
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                `${stats?.occupancyRate || 0}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rooms currently occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Complaints Resolved
            </h3>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.complaintsResolved || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3>Quick Actions</h3>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Students
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Manage Rooms
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            View Complaints
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Visitor Logs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Export as named export for compatibility
export { OwnerDashboard };
