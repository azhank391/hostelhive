'use client'

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAdminApiWithHostel, useCurrentHostelId } from '@/lib/context-aware-api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Complaint, PaginatedResponse } from '@/lib/types';
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
  const params = useParams<{ hostelId: string }>();
  const hostelId = params?.hostelId || '';
  
  // Context-aware API hooks
  const admin = useAdminApiWithHostel();
  const { hasHostel, getHostelId, isReady } = useCurrentHostelId();
  
  // State management
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

  // Load complaints using context-aware API
  useEffect(() => {
    const loadComplaints = async () => {
      // Wait for hostel context to be properly synced and ready
      if (!hasHostel || !hostelId || !isReady) {
        return;
      }
      
      // Double-check that context hostelId matches URL hostelId
      const contextHostelId = getHostelId();
      if (contextHostelId !== hostelId) {
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Context-aware API call - hostelId automatically injected!
        const result = await admin.getComplaints({
          page,
          limit: 10,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          search: searchQuery || undefined
        });
        
        setComplaints(result.data);
        // Handle potential type difference between api-client and types.ts
        const paginationData = result.pagination as any;
        setPagination({
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          pages: paginationData.pages || paginationData.totalPages || 0
        });
      } catch (err) {
        console.error('Complaints load error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load complaints';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, [hasHostel, hostelId, getHostelId, admin, page, statusFilter, priorityFilter, searchQuery, isReady]);

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
            Manage and resolve complaints from students
          </p>
        </div>
        
        <Button variant="primary" className="flex items-center">
          <PlusIcon size={16} className="mr-2" />
          Add New Complaint
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <AlertCircleIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Complaints</p>
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
                  Student
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
                  Actions
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
                    <div className="text-sm text-gray-900">
                      {(complaint as any).reportedBy?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Room: {(complaint as any).room || 'N/A'}
                    </div>
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
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <EyeIcon size={14} />
                      </Button>
                      {complaint.status === 'pending' && (
                        <Button variant="primary" size="sm">
                          Resolve
                        </Button>
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

