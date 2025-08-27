'use client'

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useComplaints } from '@/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ComplaintCard } from '@/components/dashboard/ComplaintCard';
import { 
  AlertCircleIcon, 
  PlusIcon, 
  SearchIcon,
  MessageSquareIcon
} from 'lucide-react';

export default function ComplaintsPage() {
  const params = useParams<{ hostelId: string }>();
  const hostelId = params?.hostelId || "";
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: complaintsData, loading, error } = useComplaints(hostelId, {
    page,
    limit: 10,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined
  });

  const { complaints = [], pagination } = (complaintsData as any) || {};

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
          <h1 className="text-3xl font-bold text-gray-900">Complaint Management</h1>
          <p className="mt-2 text-gray-600">
            Track and resolve complaints from students and staff
          </p>
        </div>
        
        <Button variant="primary" className="flex items-center">
          <PlusIcon size={16} className="mr-2" />
          Create Complaint
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
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertCircleIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Complaints</p>
              <p className="text-2xl font-semibold text-gray-900">
                {complaints.filter((c: any) => c.status === 'Open').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <AlertCircleIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {complaints.filter((c: any) => c.status === 'In Progress').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <AlertCircleIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {complaints.filter((c: any) => c.status === 'Resolved').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
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
            <Button variant="outline" onClick={() => handleStatusFilterChange('Open')} className={statusFilter === 'Open' ? 'bg-blue-50 border-blue-200' : ''}>
              Open
            </Button>
            <Button variant="outline" onClick={() => handleStatusFilterChange('In Progress')} className={statusFilter === 'In Progress' ? 'bg-blue-50 border-blue-200' : ''}>
              In Progress
            </Button>
            <Button variant="outline" onClick={() => handleStatusFilterChange('Resolved')} className={statusFilter === 'Resolved' ? 'bg-blue-50 border-blue-200' : ''}>
              Resolved
            </Button>
            <Button variant="outline" onClick={() => handleStatusFilterChange('Closed')} className={statusFilter === 'Closed' ? 'bg-blue-50 border-blue-200' : ''}>
              Closed
            </Button>
          </div>
          
          {/* Priority Filters */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handlePriorityFilterChange('Critical')} className={priorityFilter === 'Critical' ? 'bg-red-50 border-red-200' : ''}>
              Critical
            </Button>
            <Button variant="outline" onClick={() => handlePriorityFilterChange('High')} className={priorityFilter === 'High' ? 'bg-orange-50 border-orange-200' : ''}>
              High
            </Button>
            <Button variant="outline" onClick={() => handlePriorityFilterChange('Medium')} className={priorityFilter === 'Medium' ? 'bg-yellow-50 border-yellow-200' : ''}>
              Medium
            </Button>
            <Button variant="outline" onClick={() => handlePriorityFilterChange('Low')} className={priorityFilter === 'Low' ? 'bg-green-50 border-green-200' : ''}>
              Low
            </Button>
          </div>
        </div>
      </Card>

      {/* Complaints Grid */}
      <div className="space-y-6">
        {complaints.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <MessageSquareIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Complaints Found</h3>
              <p className="text-gray-600">
                {statusFilter || priorityFilter 
                  ? 'No complaints match the current filters. Try adjusting your search criteria.'
                  : 'There are no complaints to display at the moment.'
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((complaint: any) => (
              <ComplaintCard
                key={complaint.id}
                id={complaint.id}
                title={complaint.title}
                description={complaint.description}
                status={complaint.status}
                priority={complaint.priority}
                reportedBy={complaint.reportedBy}
                hostel={complaint.hostel}
                room={complaint.room}
                createdAt={complaint.createdAt}
                onResolve={() => {}} // Will be implemented later
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
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
        </Card>
      )}
    </div>
  );
}
