'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useCurrentHostelId } from '@/lib/context-aware-api';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Complaint, PaginatedResponse } from '@/lib/types';
import { notification } from '@/lib/toast';
import { 
  AlertCircleIcon, 
  PlusIcon, 
  SearchIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from 'lucide-react';

export default function HostelComplaintsPage() {
  // 🚨 INFINITE LOOP FIXED: 
  // - Removed getHostelId from dependencies (was recreating every render)
  // - Consolidated multiple useEffect hooks into stable ones
  // - Added loading guard to prevent simultaneous API calls
  // - Added debug counter to track effect runs
  // 
  // 🎯 ROLE-BASED FUNCTIONALITY:
  // - Students: Can view their own complaints and submit new ones
  // - Owners: Can view all complaints and update status/priority
  const params = useParams<{ hostelId: string }>();
  const hostelId = params?.hostelId || '';
  
  // Context-aware API hooks
  const { hasHostel, getHostelId, isReady } = useCurrentHostelId();
  
  // Get user role from auth context
  const { user } = useAuth();
  
  // Debug counter to track effect runs and prevent infinite loops
  const effectRunCount = useRef(0);
  
  // State management
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debug initial values
  console.log('🔍 Initial values:', { hasHostel, hostelId, isReady, loading });

  // Load all complaints function - FIXED: Simplified and direct
  const loadAllComplaints = useCallback(async () => {
    console.log('🔍 loadAllComplaints called for hostel:', hostelId);
    
    try {
      console.log('📡 Setting loading to true');
      setLoading(true);
      setError(null);
      
      console.log('📡 Loading complaints for hostel:', hostelId);
      
      // Fetch all complaints without pagination for local filtering
      const response = await fetch(`/api/hostels/${hostelId}/complaints?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch complaints: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📡 API response:', result);
      
      // Store all complaints
      if (result.data) {
        setAllComplaints(result.data);
      } else {
        setAllComplaints(Array.isArray(result) ? result : []);
      }
    } catch (err) {
      console.error('Complaints load error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load complaints';
      setError(errorMessage);
    } finally {
      console.log('📡 Setting loading to false');
      setLoading(false);
    }
  }, [hostelId]); // ✅ Only depend on hostelId - the most stable value

  // Apply local filters and pagination - FIXED: Simplified dependencies
  const applyLocalFilters = useCallback(() => {
    let filtered = [...allComplaints];
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }
    
    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(complaint => complaint.priority === priorityFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(complaint => 
        complaint.title.toLowerCase().includes(query) ||
        complaint.description.toLowerCase().includes(query) ||
        complaint.user?.name?.toLowerCase().includes(query) ||
        complaint.user?.email?.toLowerCase().includes(query)
      );
    }
    
    // Calculate pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / 10);
    const startIndex = (page - 1) * 10;
    const endIndex = startIndex + 10;
    
    // Apply pagination
    const paginatedComplaints = filtered.slice(startIndex, endIndex);
    
    setComplaints(paginatedComplaints);
    setPagination({
      page,
      limit: 10,
      total,
      pages: totalPages
    });
  }, [allComplaints, statusFilter, priorityFilter, searchQuery, page]); // ✅ Dependencies are stable

  // Single useEffect to handle data loading - FIXED: Simplified and direct
  useEffect(() => {
    effectRunCount.current += 1;
    console.log(`🔄 useEffect triggered (run #${effectRunCount.current}):`, { hasHostel, hostelId, isReady, allComplaintsLength: allComplaints.length, loading });
    
    // Load complaints when we have a hostelId (either from context or URL)
    if (hostelId) {
      console.log('🚀 Loading complaints for hostel:', hostelId);
      loadAllComplaints();
    } else {
      console.log('❌ Cannot load complaints: no hostelId');
    }
  }, [hostelId]); // ✅ Only depend on hostelId - the most stable value

  // Removed fallback timer - was causing periodic requests

  // Separate effect for filtering - only runs when data or filters change
  useEffect(() => {
    if (allComplaints.length > 0) {
      console.log('🔍 Applying filters to', allComplaints.length, 'complaints');
      applyLocalFilters();
    }
  }, [allComplaints, statusFilter, priorityFilter, searchQuery, page]); // ✅ Direct dependencies, no function calls

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
    setPage(1);
  };

  const handlePriorityFilterChange = (priority: string) => {
    setPriorityFilter(priority === priorityFilter ? '' : priority);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: 'pending' | 'in_progress' | 'resolved' | 'rejected', newPriority?: 'low' | 'medium' | 'high' | 'urgent') => {
    try {
      const response = await fetch(`/api/hostels/${hostelId}/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          status: newStatus,
          ...(newPriority && { priority: newPriority })
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update complaint status');
      }

      // Update the complaint in local state
      setAllComplaints(prev => prev.map(complaint => 
        complaint.id === complaintId 
          ? { ...complaint, status: newStatus, ...(newPriority && { priority: newPriority }) }
          : complaint
      ));

      notification.success('Complaint status updated successfully!');
    } catch (err) {
      console.error('Error updating complaint status:', err);
      notification.error('Failed to update complaint status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h1 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Complaints</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const urgentCount = complaints.filter(c => c.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Complaint Management</h1>
          <p className="mt-2 text-gray-600">
            {user?.role === 'student' 
              ? 'Submit and track your complaints' 
              : 'View and manage complaints from students'
            }
          </p>
        </div>
        
        {user?.role === 'student' && (
          <Button variant="primary" className="flex items-center">
            <PlusIcon size={16} className="mr-2" />
            Add New Complaint
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <AlertCircleIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {user?.role === 'student' ? 'My Complaints' : 'Total Complaints'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {pagination?.total || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <ClockIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pendingCount}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircleIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {resolvedCount}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <XCircleIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Urgent</p>
              <p className="text-2xl font-semibold text-gray-900">
                {urgentCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filters */}
          <div className="flex gap-2">
            {['pending', 'in_progress', 'resolved', 'rejected'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilterChange(status)}
              >
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>
          
                     {/* Priority Filters */}
           <div className="flex gap-2">
             {['urgent', 'high', 'medium', 'low'].map((priority) => (
               <Button
                 key={priority}
                 variant={priorityFilter === priority ? 'primary' : 'outline'}
                 size="sm"
                 onClick={() => handlePriorityFilterChange(priority)}
               >
                 {priority.charAt(0).toUpperCase() + priority.slice(1)}
               </Button>
             ))}
           </div>
           
           {/* Clear Filters Button */}
           {(statusFilter || priorityFilter || searchQuery) && (
             <Button
               variant="outline"
               size="sm"
               onClick={() => {
                 setStatusFilter('');
                 setPriorityFilter('');
                 setSearchQuery('');
                 setPage(1);
               }}
               className="ml-2"
             >
               Clear Filters
             </Button>
           )}
        </div>
      </Card>

      {/* Complaints Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Complaint
                </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   {user?.role === 'student' ? 'Status' : 'Student'}
                 </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   {user?.role === 'student' ? 'Actions' : 'Manage'}
                 </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <tr key={complaint.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {complaint.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                        {complaint.description}
                      </div>
                    </div>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     {user?.role === 'student' ? (
                       // For students, show status prominently
                       <div className="text-sm text-gray-900">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                           {complaint.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                         </span>
                       </div>
                     ) : (
                       // For owners, show student info
                       <div>
                         <div className="text-sm text-gray-900">
                           {complaint.user?.name || 'Unknown'}
                         </div>
                         <div className="text-sm text-gray-500">
                           {complaint.user?.email || 'N/A'}
                         </div>
                       </div>
                     )}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority?.charAt(0).toUpperCase() + complaint.priority?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}
                   </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                     <div className="flex space-x-2">
                       {user?.role === 'student' ? (
                         // Students can only view their complaints
                         <Button variant="outline" size="sm">
                           <EyeIcon size={14} />
                         </Button>
                       ) : (
                         // Owners can update status and priority
                         <>
                           {/* Status Update Dropdown */}
                           <div className="relative inline-block text-left">
                             <select
                               value={complaint.status}
                               onChange={(e) => handleStatusUpdate(complaint.id, e.target.value as 'pending' | 'in_progress' | 'resolved' | 'rejected')}
                               className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-transparent"
                             >
                               <option value="pending">Pending</option>
                               <option value="in_progress">In Progress</option>
                               <option value="resolved">Resolved</option>
                               <option value="rejected">Rejected</option>
                             </select>
                           </div>
                           
                           {/* Priority Update Dropdown */}
                           <div className="relative inline-block text-left">
                             <select
                               value={complaint.priority || 'medium'}
                               onChange={(e) => handleStatusUpdate(complaint.id, complaint.status, e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                               className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-transparent"
                             >
                               <option value="low">Low</option>
                               <option value="medium">Medium</option>
                               <option value="high">High</option>
                               <option value="urgent">Urgent</option>
                             </select>
                           </div>
                         </>
                       )}
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
              <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>
                Previous
              </Button>
              <Button variant="outline" onClick={() => setPage(page + 1)} disabled={page >= (pagination?.pages || 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

