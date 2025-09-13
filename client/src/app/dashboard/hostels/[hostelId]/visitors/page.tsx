'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation';
import { useCurrentHostelId } from '@/lib/context-aware-api';
import { usePermissions, PermissionGate } from '@/contexts/PermissionContext';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/modals/Modal';
import { Input } from '@/components/ui/Input';
import { notification } from '@/lib/toast';
import { 
  Users as UsersIcon, 
  UserPlus as PlusIcon, 
  Search as SearchIcon,
  Eye as EyeIcon,
  Edit as EditIcon,
  Trash as TrashIcon,
  LogOut as LogOutIcon,
  Calendar as CalendarIcon,
  User as UserIcon,
  Download as DownloadIcon
} from 'lucide-react';
import { downloadExport } from '@/lib/download';

interface VisitorLog {
  id: string;
  visitorName: string;
  relation: string;
  checkIn: string;
  checkOut?: string;
  // createdAt is always provided by backend (Sequelize timestamps); make required for type safety
  createdAt: string;
  studentId: string;
  hostelId: string;
  student?: {
    id: string;
    name: string;
    email: string;
    allocations?: Array<{
      id: string;
      status: string;
      room?: {
        roomNumber?: string;
        block?: string;
        capacity?: number;
      }
    }>;
  };
}

const getVisitorStatus = (visitor: VisitorLog): 'checked_in' | 'checked_out' | 'pending' => {
  if (visitor.checkOut) {
    return 'checked_out';
  }
  return 'checked_in';
};

interface Student {
  id: string;
  name: string;
  email: string;
  roomNumber?: string; // From the backend response
  roomId?: string;     // From the backend response
  allocations?: Array<{
    id: string;
    room: {
      id: string;
      roomNumber: string;
    };
  }>;
}

export default function VisitorsPage() {
  const params = useParams<{ hostelId: string }>();
  const hostelId = params?.hostelId || '';
  const { hasHostel, getHostelId } = useCurrentHostelId();
  
  // Get user role from auth context
  const { user, isLoading } = useAuth();
  
  // Permission checks
  const { hasPermission, permissions } = usePermissions();
  const canViewVisitors = hasPermission('visitor_read');
  const canCreateVisitors = hasPermission('visitor_create');
  const canManageVisitors = hasPermission('visitor_update');
  const canCheckoutVisitors = hasPermission('visitor_update');
  const canViewVisitorStats = hasPermission('view_visitor_stats');
  const canExportVisitorData = hasPermission('export_visitor_data');
  
  // Debug logging
  console.log('🔍 Visitors Page Debug:', {
    user: user ? { role: user.role, hostelId: user.hostelId } : null,
    hasHostel,
    hostelId,
    permissions: permissions.map(p => p.name),
    canViewVisitors,
    canCreateVisitors,
    canManageVisitors
  });
  
  // Utility function for debouncing
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };
  
  // State management
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [allVisitors, setAllVisitors] = useState<VisitorLog[]>([]); // Store all visitors for local filtering
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    studentId: '',
    visitorName: '',
    relation: '',
    checkIn: new Date().toISOString().slice(0, 16)
  });

  // Fetch visitor data
  useEffect(() => {
    console.log('useEffect triggered:', { hasHostel, hostelId });
    
    async function fetchVisitors() {
      if (!hasHostel || !hostelId) {
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all visitors without pagination for local filtering
        const response = await fetch(`/api/hostels/${hostelId}/visitors?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch visitors: ${response.status}`);
        }
        
        const data = await response.json();
        
        let visitorData: VisitorLog[] = [];
        if (Array.isArray(data)) {
          visitorData = data;
        } else {
          visitorData = data.data || [];
        }
        
        // Store all visitors for local filtering
        setAllVisitors(visitorData);
        
        // Apply initial filtering
        applyLocalFilters(visitorData, '', '');
        
      } catch (err) {
        console.error('Error fetching visitors:', err);
        setError(err instanceof Error ? err.message : 'Failed to load visitors');
      } finally {
        setLoading(false);
      }
    }
    
    fetchVisitors();
  }, [hasHostel, hostelId]);

  // Local filtering and search function
  const applyLocalFilters = useCallback((visitorsData: VisitorLog[], search: string, status: string) => {
    let filteredVisitors = [...visitorsData];
    
    // Apply status filter
    if (status) {
      filteredVisitors = filteredVisitors.filter(visitor => {
        const visitorStatus = getVisitorStatus(visitor);
        return visitorStatus === status;
      });
    }
    
    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredVisitors = filteredVisitors.filter(visitor => 
        visitor.visitorName?.toLowerCase().includes(searchLower) ||
        visitor.relation?.toLowerCase().includes(searchLower) ||
        visitor.student?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Update visitors state with filtered results
    setVisitors(filteredVisitors);
    
    // Update pagination
    const total = filteredVisitors.length;
    const pages = Math.ceil(total / 10);
    setPagination({ page: 1, limit: 10, total, pages });
    setPage(1);
  }, []);

  // Get paginated visitors for display
  const getPaginatedVisitors = useCallback(() => {
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    return visitors.slice(startIndex, endIndex);
  }, [visitors, page]);

  // Manual refresh function that doesn't trigger useEffect
  const refreshVisitors = useCallback(async () => {
    if (!hasHostel || !hostelId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/hostels/${hostelId}/visitors?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch visitors: ${response.status}`);
      }
      
      const data = await response.json();
      
      let visitorData: VisitorLog[] = [];
      if (Array.isArray(data)) {
        visitorData = data;
      } else {
        visitorData = data.data || [];
      }
      
      // Store all visitors for local filtering
      setAllVisitors(visitorData);
      
             // Apply current filters and update pagination
       applyLocalFilters(visitorData, searchQuery, statusFilter);
       setPage(1); // Reset to first page after refresh
      
    } catch (err) {
      console.error('Error refreshing visitors:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh visitors');
    } finally {
      setLoading(false);
    }
  }, [hasHostel, hostelId, searchQuery, statusFilter, applyLocalFilters]);

  // Fetch students for visitor creation
  useEffect(() => {
    async function fetchStudents() {
      if (!hasHostel || !hostelId) return;
      
      // Only fetch students if user has view_students permission
      if (!hasPermission('student_read')) {
        console.log('🔍 Visitors: Skipping students fetch - no view_students permission');
        // Set empty students array so forms can still work
        setStudents([]);
        return;
      }
      
      try {
        const response = await fetch(`/api/hostels/${hostelId}/students`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch students: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract students from the response (backend sends { students: [...], pagination: {...} })
        const studentsData = data.students || data;
        
        // Filter students to only include those with active room allocations
        const studentsWithRooms = studentsData.filter((student: any) => {
          // Check if student has roomNumber (from the transformed backend response)
          if (student.roomNumber) {
            return true;
          }
          
          // Check if student has active allocations with room information
          if (student.allocations && Array.isArray(student.allocations)) {
            return student.allocations.some((allocation: any) => 
              allocation.status === 'active' && allocation.room
            );
          }
          
          return false;
        });
        
        setStudents(studentsWithRooms);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError(err instanceof Error ? err.message : 'Failed to load students');
      }
    }
    fetchStudents();
  }, [hasHostel, hostelId, hasPermission]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      applyLocalFilters(allVisitors, query, statusFilter);
    }, 300),
    [allVisitors, statusFilter, applyLocalFilters]
  );

  const handleStatusFilterChange = useCallback((status: string) => {
    const newStatus = status === statusFilter ? '' : status;
    setStatusFilter(newStatus);
    applyLocalFilters(allVisitors, searchQuery, newStatus);
  }, [statusFilter, allVisitors, searchQuery, applyLocalFilters]);

  const handleSearch = useCallback((query: string) => {
    debouncedSearch(query);
  }, [debouncedSearch]);

  const handleCreateVisitor = useCallback(async () => {
    if (!hasHostel || !hostelId) return;
    
    if (!formData.studentId || !formData.visitorName || !formData.relation) {
      notification.error('Please fill in all required fields');
      return;
    }
    
    // Validate that the selected student has a room allocation
    const selectedStudent = students.find(s => s.id === formData.studentId);
    if (!selectedStudent || !selectedStudent.roomNumber) {
      notification.error('Selected student must have an active room allocation to host visitors');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/hostels/${hostelId}/visitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...formData,
          hostelId: hostelId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create visitor');
      }
      
      notification.success('Visitor created successfully!');
      setIsCreateModalOpen(false);
      setFormData({
        studentId: '',
        visitorName: '',
        relation: '',
        checkIn: new Date().toISOString().slice(0, 16)
      });
      await refreshVisitors();
    } catch (err) {
      console.error('Error creating visitor:', err);
      notification.error(err instanceof Error ? err.message : 'Failed to create visitor');
    } finally {
      setIsSubmitting(false);
    }
  }, [hasHostel, hostelId, formData, refreshVisitors, students]);

  const handleEditVisitor = useCallback(async () => {
    if (!selectedVisitor || !hasHostel || !hostelId) return;
    
    if (!formData.studentId || !formData.visitorName || !formData.relation) {
      notification.error('Please fill in all required fields');
      return;
    }
    
    // Validate that the selected student has a room allocation
    const selectedStudent = students.find(s => s.id === formData.studentId);
    if (!selectedStudent || !selectedStudent.roomNumber) {
      notification.error('Selected student must have an active room allocation to host visitors');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/hostels/${hostelId}/visitors/${selectedVisitor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...formData,
          hostelId: hostelId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update visitor');
      }
      
      notification.success('Visitor updated successfully!');
      setIsEditModalOpen(false);
      setSelectedVisitor(null);
      setFormData({
        studentId: '',
        visitorName: '',
        relation: '',
        checkIn: new Date().toISOString().slice(0, 16)
      });
      await refreshVisitors();
    } catch (err) {
      console.error('Error updating visitor:', err);
      notification.error(err instanceof Error ? err.message : 'Failed to update visitor');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedVisitor, hasHostel, hostelId, formData, refreshVisitors, students]);

  const handleCheckOutVisitor = useCallback(async (visitor: VisitorLog) => {
    if (!visitor || !hasHostel || !hostelId) return;
    
    // Add confirmation dialog
    if (!confirm(`Are you sure you want to check out ${visitor.visitorName}?`)) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Optimistically update the UI
    const updatedVisitor = { ...visitor, checkOut: new Date().toISOString() };
    setAllVisitors(prev => prev.map(v => v.id === visitor.id ? updatedVisitor : v));
    setVisitors(prev => prev.map(v => v.id === visitor.id ? updatedVisitor : v));
    
    try {
                    const response = await fetch(`/api/hostels/${hostelId}/visitors/${visitor.id}/checkout`, {
         method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
                 body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check out visitor');
      }
      
             notification.success('Visitor checked out successfully!');
       setIsViewModalOpen(false);
       setSelectedVisitor(null);
       // Refresh the data to show updated status
       await refreshVisitors();
    } catch (err) {
      console.error('Error checking out visitor:', err);
      notification.error(err instanceof Error ? err.message : 'Failed to check out visitor');
      
      // Revert optimistic update on error
      setAllVisitors(prev => prev.map(v => v.id === visitor.id ? visitor : v));
      setVisitors(prev => prev.map(v => v.id === visitor.id ? visitor : v));
    } finally {
      setIsSubmitting(false);
    }
  }, [hasHostel, hostelId, refreshVisitors]);

  const handleDeleteVisitor = useCallback(async (visitor?: VisitorLog) => {
    // Accept an explicit visitor (from row action) or fall back to selectedVisitor (from modal)
    const target = visitor || selectedVisitor;
    if (!target || !hasHostel || !hostelId) return;

    // Ensure selectedVisitor is set when deleting from the row button (without opening view modal first)
    if (!selectedVisitor) {
      setSelectedVisitor(target);
    }

    if (!confirm(`Are you sure you want to delete visitor ${target.visitorName}? This action cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/hostels/${hostelId}/visitors/${target.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete visitor');
      }

      notification.success('Visitor deleted successfully!');
      setIsViewModalOpen(false);
      setSelectedVisitor(null);
      await refreshVisitors();
    } catch (err) {
      console.error('Error deleting visitor:', err);
      notification.error(err instanceof Error ? err.message : 'Failed to delete visitor');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedVisitor, hasHostel, hostelId, refreshVisitors]);

  const handleViewVisitor = useCallback((visitor: VisitorLog) => {
    setSelectedVisitor(visitor);
    setFormData({
      studentId: visitor.studentId || '',
      visitorName: visitor.visitorName || '',
      relation: visitor.relation || '',
      checkIn: visitor.checkIn ? new Date(visitor.checkIn).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
    });
    setIsViewModalOpen(true);
  }, []);

  const openEditModal = useCallback((visitor: VisitorLog) => {
    setSelectedVisitor(visitor);
    setFormData({
      studentId: visitor.studentId || '',
      visitorName: visitor.visitorName || '',
      relation: visitor.relation || '',
      checkIn: visitor.checkIn ? new Date(visitor.checkIn).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
    });
    setIsEditModalOpen(true);
  }, []);

  const handleEditFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCreateFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Export functionality
  const handleExportVisitors = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    if (!hasHostel || !hostelId) return;
    try {
      await downloadExport({ url: `/api/hostels/${hostelId}/visitors/export`, format, filename: `visitors-${hostelId}` });
      notification.success(`Visitor data exported as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error('Error exporting visitors:', err);
      notification.error('Failed to export visitor data');
    }
  }, [hasHostel, hostelId]);

  // Check if user has permission to view visitors
  if (!canViewVisitors) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <UsersIcon size={64} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to view visitor management.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator to get access to visitor management features.
          </p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Visitors</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visitor Management</h1>
          <p className="mt-2 text-gray-600">
            {canCreateVisitors 
              ? 'Manage and track all visitors to your hostel'
              : canManageVisitors 
                ? 'View and manage visitor records'
                : 'View visitor records'
            }
          </p>
        </div>
        
        <div className="flex space-x-3">
          <PermissionGate permission="export_visitor_data">
            <Button variant="outline" className="flex items-center" onClick={() => handleExportVisitors('csv')}>
              <DownloadIcon size={16} className="mr-2" />
              Export CSV
            </Button>
          </PermissionGate>
          
          <PermissionGate permission="visitor_create">
            <Button variant="primary" className="flex items-center" onClick={() => setIsCreateModalOpen(true)}>
              <PlusIcon size={16} className="mr-2" />
              Add New Visitor
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Stats Cards */}
      <PermissionGate permission="view_visitor_stats">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <UsersIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {statusFilter || searchQuery ? 'Filtered Results' : 'Total Visitors'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {pagination?.total || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <UsersIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Currently Inside</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allVisitors.filter((v: VisitorLog) => getVisitorStatus(v) === 'checked_in').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <UsersIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Visitors</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allVisitors.filter((v: VisitorLog) => {
                  const today = new Date().toDateString();
                  return new Date(v.createdAt).toDateString() === today;
                }).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <UsersIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-semibold text-gray-900">
                {allVisitors.filter((v: VisitorLog) => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(v.createdAt) > weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </Card>
        </div>
      </PermissionGate>

      {/* Filters and Search */}
      <PermissionGate permission="visitor_read">
        <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filters */}
          <div className="flex gap-2">
            {['checked_in', 'checked_out', 'pending'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilterChange(status)}
              >
                {status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Button>
            ))}
            {(statusFilter || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setSearchQuery('');
                  setPage(1);
                  applyLocalFilters(allVisitors, '', '');
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
        </Card>
      </PermissionGate>

      {/* Visitors Table */}
      <PermissionGate permission="visitor_read">
        <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visitor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Host
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {canManageVisitors ? 'Actions' : 'View'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getPaginatedVisitors().map((visitor: VisitorLog) => (
                <tr key={visitor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {visitor.visitorName?.charAt(0).toUpperCase() || 'V'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {visitor.visitorName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {visitor.relation || 'No relation'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {visitor.student?.name || 'Unknown'}
                    </div>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-900">
                                               {(() => {
                          // First try to get room info from visitor data (which includes student with room allocation)
                          if (visitor.student?.allocations && visitor.student.allocations.length > 0) {
                            const activeAllocation = visitor.student.allocations.find(a => a.status === 'active');
                            if (activeAllocation?.room?.roomNumber) {
                              return `Room ${activeAllocation.room.roomNumber}`;
                            }
                          }
                          
                          // Fallback to students array lookup
                          const student = students.find(s => s.id === visitor.studentId);
                          if (student?.roomNumber) {
                            return `Room ${student.roomNumber}`;
                          }
                          
                          return 'No room allocated';
                        })()}
                     </div>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getVisitorStatus(visitor) === 'checked_in' 
                        ? 'bg-green-100 text-green-800'
                        : getVisitorStatus(visitor) === 'checked_out'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getVisitorStatus(visitor) === 'checked_in' ? 'Checked In' :
                       getVisitorStatus(visitor) === 'checked_out' ? 'Checked Out' :
                       getVisitorStatus(visitor) === 'pending' ? 'Pending' : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {visitor.checkIn ? new Date(visitor.checkIn).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewVisitor(visitor)}>
                        <EyeIcon size={14} />
                      </Button>
                      <PermissionGate permission="visitor_update">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(visitor)}>
                          <EditIcon size={14} />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="visitor_update">
                        {getVisitorStatus(visitor) === 'checked_in' && (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleCheckOutVisitor(visitor)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <LogOutIcon size={14} />
                          </Button>
                        )}
                      </PermissionGate>
                      <PermissionGate permission="visitor_delete">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteVisitor(visitor)} 
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon size={14} />
                        </Button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="outline" onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page >= pagination.pages}>
                Next
              </Button>
            </div>
          </div>
        )}
        </Card>
      </PermissionGate>

      {/* Create Visitor Modal */}
      <PermissionGate permission="visitor_create">
        <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Visitor"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateVisitor(); }}>
          <div className="grid gap-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Host Student *
              </label>
              <select
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleCreateFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-transparent"
                disabled={students.length === 0}
              >
                <option value="">
                  {students.length === 0 ? 'No students available - insufficient permissions' : 'Select a Host Student'}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - Room {student.roomNumber || 'Unknown'}
                  </option>
                ))}
              </select>
              {students.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  {!hasPermission('student_read') 
                    ? 'You need view_students permission to create visitors. Contact your administrator.'
                    : 'No students with room allocations found. Only students with active room allocations can host visitors.'
                  }
                </p>
              )}
            </div>
            <div>
              <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700">
                Visitor Name *
              </label>
              <Input
                id="visitorName"
                name="visitorName"
                value={formData.visitorName}
                onChange={handleCreateFormChange}
                required
              />
            </div>
            <div>
              <label htmlFor="relation" className="block text-sm font-medium text-gray-700">
                Relation *
              </label>
              <Input
                id="relation"
                name="relation"
                value={formData.relation}
                onChange={handleCreateFormChange}
                required
              />
            </div>
            <div>
              <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700">
                Check In Date *
              </label>
              <Input
                id="checkIn"
                name="checkIn"
                type="datetime-local"
                value={formData.checkIn}
                onChange={handleCreateFormChange}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Visitor'}
              </Button>
            </div>
          </div>
        </form>
        </Modal>
      </PermissionGate>

      {/* Edit Visitor Modal */}
      <PermissionGate permission="visitor_update">
        <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Visitor"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEditVisitor(); }}>
          <div className="grid gap-4">
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Host Student *
              </label>
              <select
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleEditFormChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-transparent"
                disabled={students.length === 0}
              >
                <option value="">
                  {students.length === 0 ? 'No students available - insufficient permissions' : 'Select a Host Student'}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - Room {student.roomNumber || 'Unknown'}
                  </option>
                ))}
              </select>
              {students.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  {!hasPermission('student_read') 
                    ? 'You need view_students permission to edit visitors. Contact your administrator.'
                    : 'No students with room allocations found. Only students with active room allocations can host visitors.'
                  }
                </p>
              )}
            </div>
            <div>
              <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700">
                Visitor Name *
              </label>
              <Input
                id="visitorName"
                name="visitorName"
                value={formData.visitorName}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div>
              <label htmlFor="relation" className="block text-sm font-medium text-gray-700">
                Relation *
              </label>
              <Input
                id="relation"
                name="relation"
                value={formData.relation}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div>
              <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700">
                Check In Date *
              </label>
              <Input
                id="checkIn"
                name="checkIn"
                type="datetime-local"
                value={formData.checkIn}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Visitor'}
              </Button>
            </div>
          </div>
        </form>
        </Modal>
      </PermissionGate>

      {/* View Visitor Modal */}
      <PermissionGate permission="visitor_read">
        <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Visitor Details - ${selectedVisitor?.visitorName || 'Unknown'}`}
      >
        <div className="grid gap-6">
          {/* Visitor Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Visitor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <UserIcon size={20} className="text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Visitor Name</p>
                  <p className="text-base font-semibold text-gray-900">{selectedVisitor?.visitorName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <UsersIcon size={20} className="text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Relation</p>
                  <p className="text-base font-semibold text-gray-900">{selectedVisitor?.relation || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visit Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Visit Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex items-center space-x-3">
                 <CalendarIcon size={20} className="text-purple-600" />
                 <div>
                   <p className="text-sm font-medium text-gray-500">Check In</p>
                   <p className="text-base font-semibold text-gray-900">
                     {selectedVisitor?.checkIn ? 
                       new Date(selectedVisitor.checkIn).toLocaleString('en-US', {
                         year: 'numeric',
                         month: 'long',
                         day: 'numeric',
                         hour: '2-digit',
                         minute: '2-digit',
                         hour12: true
                       }) : 'N/A'}
                   </p>
                 </div>
               </div>
                             <div className="flex items-center space-x-3">
                 <CalendarIcon size={20} className="text-orange-600" />
                 <div>
                   <p className="text-sm font-medium text-gray-500">Check Out</p>
                   <p className="text-base font-semibold text-gray-900">
                     {selectedVisitor?.checkOut ? 
                       new Date(selectedVisitor.checkOut).toLocaleString('en-US', {
                         year: 'numeric',
                         month: 'long',
                         day: 'numeric',
                         hour: '2-digit',
                         minute: '2-digit',
                         hour12: true
                       }) : 'Not checked out yet'}
                   </p>
                 </div>
               </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedVisitor && getVisitorStatus(selectedVisitor) === 'checked_in' ? 'bg-green-500' :
                    selectedVisitor && getVisitorStatus(selectedVisitor) === 'checked_out' ? 'bg-gray-500' : 'bg-yellow-500'
                  }`}></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedVisitor ? getVisitorStatus(selectedVisitor) === 'checked_in' ? 'Checked In' :
                     getVisitorStatus(selectedVisitor) === 'checked_out' ? 'Checked Out' :
                     getVisitorStatus(selectedVisitor) === 'pending' ? 'Pending' : 'Unknown' : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Host Student Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Host Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <UserIcon size={20} className="text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Student Name</p>
                  <p className="text-base font-semibold text-gray-900">{selectedVisitor?.student?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">S</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Student ID</p>
                  <p className="text-base font-semibold text-gray-900">{selectedVisitor?.studentId || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

                     {/* Room Information */}
           <div>
             <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Room Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="flex items-center space-x-3">
                 <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                   <span className="text-xs font-medium text-green-600">R</span>
                 </div>
                 <div>
                   <p className="text-sm font-medium text-gray-500">Room Number</p>
                   <p className="text-base font-semibold text-gray-900">
                     {(() => {
                       const student = students.find(s => s.id === selectedVisitor?.studentId);
                       return student?.roomNumber || 'No room allocated';
                     })()}
                   </p>
                 </div>
               </div>
               <div className="flex items-center space-x-3">
                 <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                   <span className="text-xs font-medium text-blue-600">H</span>
                 </div>
                 <div>
                   <p className="text-sm font-medium text-gray-500">Host Student</p>
                   <p className="text-base font-semibold text-gray-900">
                     {selectedVisitor?.student?.name || 'Unknown'}
                   </p>
                 </div>
               </div>
             </div>
           </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            <PermissionGate permission="visitor_update">
              {selectedVisitor && getVisitorStatus(selectedVisitor) === 'checked_in' && (
                <Button variant="primary" onClick={() => handleCheckOutVisitor(selectedVisitor)} disabled={isSubmitting}>
                  {isSubmitting ? 'Checking Out...' : 'Check Out Visitor'}
                </Button>
              )}
            </PermissionGate>
            <PermissionGate permission="visitor_delete">
              <Button variant="outline" onClick={() => handleDeleteVisitor()} disabled={isSubmitting} className="text-red-600 hover:text-red-700">
                {isSubmitting ? 'Deleting...' : 'Delete Visitor'}
              </Button>
            </PermissionGate>
          </div>
        </div>
        </Modal>
      </PermissionGate>
    </div>
  );
}

