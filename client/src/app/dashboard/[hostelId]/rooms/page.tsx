'use client'

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRooms } from '@/hooks';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  BuildingIcon, 
  PlusIcon, 
  SearchIcon,
  BedIcon,
  UserIcon,
  EyeIcon,
  EditIcon
} from 'lucide-react';

export default function RoomsPage() {
  const { hostelId } = useParams<{ hostelId: string }>() || {};
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: roomsData, loading, error } = useRooms(hostelId ?? '', {
    page,
    limit: 10,
    status: statusFilter || undefined
  });

  const { rooms = [], pagination } = (roomsData as any) || {};

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
          <h1 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Rooms</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all rooms in your hostel
          </p>
        </div>
        
        <Button variant="primary" className="flex items-center">
          <PlusIcon size={16} className="mr-2" />
          Add New Room
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <BuildingIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Rooms</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pagination?.total || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <BedIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Rooms</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rooms.filter((r: any) => !r.student).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <UserIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Occupied Rooms</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rooms.filter((r: any) => r.student).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <BuildingIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pagination?.total ? 
                  `${Math.round((rooms.filter((r: any) => r.student).length / pagination.total) * 100)}%` 
                  : '0%'
                }
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
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filters */}
          <div className="flex gap-2">
            {['available', 'occupied', 'maintenance'].map((status) => (
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

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room: any) => (
          <Card key={room.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <BedIcon size={20} />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Room {room.number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {room.block ? `Block ${room.block}` : 'Main Building'}
                  </p>
                </div>
              </div>
              
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                room.student 
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {room.student ? 'Occupied' : 'Available'}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <BuildingIcon size={16} className="mr-2" />
                <span>Capacity: {room.capacity || 'N/A'}</span>
              </div>
              
              {room.student && (
                <div className="flex items-center text-sm text-gray-600">
                  <UserIcon size={16} className="mr-2" />
                  <span>Occupied by: {room.student.name}</span>
                </div>
              )}
              
              {room.description && (
                <p className="text-sm text-gray-600">
                  {room.description}
                </p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <EyeIcon size={14} className="mr-1" />
                View
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <EditIcon size={14} className="mr-1" />
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
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
        </Card>
      )}
    </div>
  );
}
