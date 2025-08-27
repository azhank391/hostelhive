'use client'

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
// import { useStudents } from '@/lib/queries'; // TODO: Legacy query hook
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAdminApiWithHostel, useCurrentHostelId } from '@/lib/context-aware-api';
import { useHostel } from '@/context/HostelContext';
import type { User, PaginatedResponse } from '@/lib/types';
import { 
  GraduationCapIcon, 
  PlusIcon, 
  SearchIcon,
  EyeIcon,
  EditIcon,
  UserIcon,
  BedIcon
} from 'lucide-react';

export default function StudentsPage() {
  const params = useParams<{ hostelId: string }>();
  const hostelId = params?.hostelId || '';
  
  // 🎯 Context-aware API hooks
  const admin = useAdminApiWithHostel();
  const { hasHostel, getHostelId } = useCurrentHostelId();
  const { setActiveHostel } = useHostel();
  
  // State management
  const [students, setStudents] = useState<User[]>([]);
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
  const [searchQuery, setSearchQuery] = useState('');

  // 🔄 Sync URL hostelId with HostelContext
  useEffect(() => {
    if (hostelId && hostelId !== getHostelId()) {
      setActiveHostel(hostelId, false); // Don't sync to server for URL-based navigation
    }
  }, [hostelId, getHostelId, setActiveHostel]);

  // 📊 Load students using context-aware API
  useEffect(() => {
    const loadStudents = async () => {
      // Wait for hostel context to be properly synced
      if (!hasHostel || !hostelId) {
        console.log('⏳ Students: Waiting for hostel context to sync...', { hasHostel, hostelId });
        return;
      }
      
      // Double-check that context hostelId matches URL hostelId
      const contextHostelId = getHostelId();
      if (contextHostelId !== hostelId) {
        console.log('⏳ Students: Context not synced yet, waiting...', { contextHostelId, urlHostelId: hostelId });
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('🚀 Students: Loading data for hostel:', hostelId);
        
        // 🎯 Context-aware API call - hostelId automatically injected!
        const result = await admin.getStudents({
          page,
          limit: 10,
          search: searchQuery || undefined,
          status: statusFilter || undefined
        });
        
        setStudents(result.data);
        // Handle potential type difference between api-client and types.ts
        const paginationData = result.pagination as any;
        setPagination({
          page: paginationData.page,
          limit: paginationData.limit,
          total: paginationData.total,
          pages: paginationData.pages || paginationData.totalPages || 0
        });
      } catch (err) {
        console.error('Students load error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load students';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [hasHostel, hostelId, getHostelId, admin, page, searchQuery, statusFilter]); // Added hostelId and getHostelId

  // Legacy query (commented out for now)
  // const { data: studentsData, isLoading, error } = useStudents(hostelId, {
  //   page,
  //   limit: 10,
  //   status: statusFilter || undefined
  // });
  // const { students = [], pagination } = (studentsData as any) || {};

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
          <h1 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Students</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all students in your hostel
          </p>
        </div>
        
        <Button variant="primary" className="flex items-center">
          <PlusIcon size={16} className="mr-2" />
          Add New Student
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <GraduationCapIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pagination?.total || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <UserIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-semibold text-gray-900">
                {students.filter((s: any) => s.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <BedIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned Rooms</p>
              <p className="text-2xl font-semibold text-gray-900">
                {students.filter((s: any) => s.room).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <GraduationCapIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-semibold text-gray-900">
                {students.filter((s: any) => {
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return new Date(s.createdAt) > monthAgo;
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
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filters */}
          <div className="flex gap-2">
            {['active', 'inactive', 'pending'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilterChange(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student: any) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {student.name?.charAt(0).toUpperCase() || 'S'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {student.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.room?.number || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : student.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {student.status?.charAt(0).toUpperCase() + student.status?.slice(1) || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(student.createdAt).toLocaleDateString()}
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
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPage(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
