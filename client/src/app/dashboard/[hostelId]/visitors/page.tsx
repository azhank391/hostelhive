'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation';
import { useAdminApiWithHostel, useCurrentHostelId } from '@/lib/context-aware-api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  UsersIcon, 
  PlusIcon, 
  SearchIcon,
  EyeIcon,
  EditIcon
} from 'lucide-react';

export default function VisitorsPage() {
  const params = useParams<{ hostelId: string }>();
  const hostelId = params?.hostelId || '';
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [visitors, setVisitors] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Context-aware API hooks
  const admin = useAdminApiWithHostel();
  const { hasHostel, getHostelId } = useCurrentHostelId();
  
  // Fetch visitor data
  React.useEffect(() => {
    async function fetchVisitors() {
      // Wait for hostel context to be properly synced
      if (!hasHostel || !hostelId) {
        console.log('⏳ Visitors: Waiting for hostel context to sync...', { hasHostel, hostelId });
        return;
      }
      
      // Double-check that context hostelId matches URL hostelId
      const contextHostelId = getHostelId();
      if (contextHostelId !== hostelId) {
        console.log('⏳ Visitors: Context not synced yet, waiting...', { contextHostelId, urlHostelId: hostelId });
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🚀 Visitors: Loading data for hostel:', hostelId);
        
        // Context-aware API call - hostelId automatically injected
        const result = await admin.getVisitorLogs({
          page,
          limit: 10,
          status: statusFilter || undefined,
          search: searchQuery || undefined
        });
        
        // Handle both array and paginated response formats
        if (Array.isArray(result)) {
          setVisitors(result);
          setPagination({ page: 1, limit: 10, total: result.length, pages: 1 });
        } else {
          const paginatedResult = result as {
            data?: any[];
            pagination?: {
              page?: number;
              limit?: number;
              total?: number;
              totalPages?: number;
            };
          };
          setVisitors(paginatedResult.data || []);
          setPagination({
            page: paginatedResult.pagination?.page || 1,
            limit: paginatedResult.pagination?.limit || 10,
            total: paginatedResult.pagination?.total || 0,
            pages: paginatedResult.pagination?.totalPages || 1
          });
        }
      } catch (err) {
        console.error('Error fetching visitors:', err);
        setError(err instanceof Error ? err.message : 'Failed to load visitors');
      } finally {
        setLoading(false);
      }
    }
    
    fetchVisitors();
  }, [hasHostel, hostelId, getHostelId, admin, page, statusFilter, searchQuery]); // Added hostelId and getHostelId
  
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status === statusFilter ? '' : status);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
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
          <h1 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Visitors</h1>
          <p className="text-gray-600 mb-4">Please try refreshing the page.</p>
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
            Manage and track all visitors to your hostel
          </p>
        </div>
        
        <Button variant="primary" className="flex items-center">
          <PlusIcon size={16} className="mr-2" />
          Add New Visitor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <UsersIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Visitors</p>
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
                {visitors.filter((v: any) => v.status === 'checked_in').length}
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
              <p className="text-sm font-medium text-gray-600">Today&apos;s Visitors</p>
              <p className="text-2xl font-semibold text-gray-900">
                {visitors.filter((v: any) => {
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
                {visitors.filter((v: any) => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(v.createdAt) > weekAgo;
                }).length}
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
          </div>
        </div>
      </Card>

      {/* Visitors Table */}
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visitors.map((visitor: any) => (
                <tr key={visitor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {visitor.visitor?.name?.charAt(0).toUpperCase() || 'V'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {visitor.visitor?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {visitor.visitor?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {visitor.host?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {visitor.room?.number || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      visitor.status === 'checked_in' 
                        ? 'bg-green-100 text-green-800'
                        : visitor.status === 'checked_out'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {visitor.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(visitor.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <EyeIcon size={14} />
                      </Button>
                      <Button variant="outline" size="sm">
                        <EditIcon size={14} />
                      </Button>
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
