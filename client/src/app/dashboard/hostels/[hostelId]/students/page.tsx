'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/PermissionGate';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { User, Room } from '@/lib/types';
import { notification } from '@/lib/toast';
import { 
  GraduationCapIcon, 
  PlusIcon, 
  SearchIcon,
  EditIcon,
  UserIcon,
  BedIcon,
  XIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  DownloadIcon
} from 'lucide-react';

// Custom type for students response to match backend structure
// Removed unused StudentsResponse interface

interface StudentWithRoom extends User {
  room?: Room;
  roomNumber?: string;
  roomId?: string;
}

// Type for the actual student data returned from backend
type StudentData = User & {
  roomNumber?: string;
  roomId?: string;
};

export default function HostelStudentsPage() {
  const params = useParams<{ hostelId: string }>();
  const hostelId = params?.hostelId || '';
  const { isLoading } = useAuth();
  const { hasPermission} = usePermissions();

  // Permission checks
  const canViewStudents = hasPermission('student_read');
  const canCreateStudents = hasPermission('student_create');
  const canUpdateStudents = hasPermission('student_update') || hasPermission('student_create'); // Allow create permission for updates
  const canDeleteStudents = hasPermission('student_delete');
  const canAllocateRooms = hasPermission('room_allocation_create'); // ONLY allow if user has room_allocation_create permission
  const canDeallocateRooms = hasPermission('room_allocation_delete'); // ONLY allow if user has room_allocation_delete permission
  // const canViewRooms = hasPermission('room_read'); // not used directly here
  const canViewStudentRooms = hasPermission('room_allocation_read');
  const canExportStudents = hasPermission('export_student_data');
  
  
  // State management
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentData | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRoomAllocationModal, setShowRoomAllocationModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithRoom | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [isAllocating, setIsAllocating] = useState(false);
  
  // Simple load students function - DIRECT API CALL
  const loadStudents = useCallback(async () => {
    if (!hostelId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Direct API call - more reliable
      const response = await fetch(`/api/hostels/${hostelId}/students`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load students (${response.status})`);
      }
      
      const result = await response.json();
      const studentsData = result.students || result.data || result;
      setStudents(studentsData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load students';
      setError(errorMessage);
      notification.error('Failed to load students', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [hostelId]);
  
  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadStudents();
    setIsRefreshing(false);
    notification.success('Students refreshed successfully!');
  }, [loadStudents]);
  
  // Load students on mount - SIMPLIFIED to avoid infinite loops
  useEffect(() => {
    if (hostelId) {
      // Call loadStudents directly without dependency
      loadStudents();
    }
  }, [hostelId, loadStudents]);

  // Enhanced CRUD operations with auto-refresh
  const handleCreateStudent = async () => {
    if (!hostelId) {
      notification.error('No hostel selected', {
        description: 'Please refresh the page and try again.'
      });
      return;
    }
    
    if (!createForm.name.trim() || !createForm.email.trim()) {
      notification.error('Missing required fields', {
        description: 'Please fill in all required fields.'
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Direct API call for creation
      const response = await fetch(`/api/hostels/${hostelId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(createForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create student');
      }
      
      const newStudent = await response.json();
      
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', phone: '' });
      
      notification.success('Student created successfully!', {
        description: `${newStudent.name} has been added to the hostel with default password: 123456`
      });
      
      // Auto-refresh with optimized loading
      await loadStudents();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create student';
      notification.error('Failed to create student', {
        description: errorMessage
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStudent = async (updates: Partial<User>) => {
    if (!editingStudent) return;
    
    if (!hostelId) {
      notification.error('No hostel selected', {
        description: 'Please refresh the page and try again.'
      });
      return;
    }
    
    if (!updates.name?.trim() || !updates.email?.trim()) {
      notification.error('Missing required fields', {
        description: 'Please fill in all required fields.'
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      
      // Direct API call for update
      const response = await fetch(`/api/hostels/${hostelId}/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update student');
      }
      
      const updatedStudent = await response.json();
      
      setShowEditModal(false);
      setEditingStudent(null);
      
      notification.success('Student updated successfully!', {
        description: `${updatedStudent.name} has been updated.`
      });
      
      // Auto-refresh with optimized loading
      await loadStudents();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update student';
      notification.error('Failed to update student', {
        description: errorMessage
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!hostelId) {
      notification.error('No hostel selected', {
        description: 'Please refresh the page and try again.'
      });
      return;
    }
    
    // Find the student to get their details for the confirmation
    const studentToDelete = students.find(s => s.id === studentId);
    if (!studentToDelete) {
      notification.error('Student not found', {
        description: 'The student you are trying to delete could not be found.'
      });
      return;
    }
    
    // Use a more user-friendly confirmation
    if (!confirm(`Are you sure you want to delete ${studentToDelete.name}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setIsDeleting(studentId);
      
      // Direct API call for deletion
      const response = await fetch(`/api/hostels/${hostelId}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete student');
      }
      
      notification.success('Student deleted successfully!', {
        description: `${studentToDelete.name} has been removed from the hostel.`
      });
      
      // Auto-refresh with optimized loading
      await loadStudents();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete student';
      notification.error('Failed to delete student', {
        description: errorMessage
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Room allocation handler
  const handleRoomAllocation = useCallback(async (studentId: string, roomId: string) => {
    if (!hostelId) {
      notification.error('No hostel selected', {
        description: 'Please refresh the page and try again.'
      });
      return;
    }
    try {
      setIsAllocating(true);
      // Direct API call for room allocation - using correct endpoint
      const response = await fetch(`/api/hostels/${hostelId}/room-allocations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ studentId, roomId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to allocate room');
      }
      notification.success('Room allocated successfully!');
      
      // Close the modal first
      setShowRoomAllocationModal(false);
      setSelectedStudent(null);
      setSelectedRoomId('');
      
      // Refresh students to show updated room assignments
      await loadStudents();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to allocate room';
      notification.error('Failed to allocate room', {
        description: errorMessage
      });
    } finally {
      setIsAllocating(false);
    }
  }, [hostelId]); // No dependencies to prevent infinite loops

  // Room deallocation handler
  const handleRoomDeallocation = useCallback(async (studentId: string) => {
    if (!hostelId) {
      notification.error('No hostel selected', {
        description: 'Please refresh the page and try again.'
      });
      return;
    }
    try {
      // Direct API call for room deallocation - using correct endpoint
      const response = await fetch(`/api/hostels/${hostelId}/room-allocations/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to deallocate room');
      }
      notification.success('Room deallocated successfully!');
      
      // Refresh students to show updated room assignments
      await loadStudents();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to deallocate room';
      notification.error('Failed to deallocate room', {
        description: errorMessage
      });
    }
  }, [hostelId]); // No dependencies to prevent infinite loops

  // Open room allocation modal
  const openRoomAllocationModal = useCallback(async (student: StudentWithRoom) => {
    setSelectedStudent(student);
    try {
      // Load available rooms
      const response = await fetch(`/api/hostels/${hostelId}/rooms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load available rooms');
      }
      const roomsResult = await response.json();
      const rooms = (roomsResult.data ?? []) as Room[];
      const availableRoomsList = rooms.filter((room) => room.capacity > (room.occupied ?? 0));
      setAvailableRooms(availableRoomsList);
      setSelectedRoomId('');
      setShowRoomAllocationModal(true);
    } catch {
      notification.error('Failed to load available rooms');
    }
  }, [hostelId]); // No dependencies to prevent infinite loops

  // Handle room allocation submission
  const handleAllocateRoom = async () => {
    if (!selectedStudent || !selectedRoomId) return;
    
    try {
      setIsAllocating(true);
      await handleRoomAllocation(selectedStudent.id, selectedRoomId);
      // Modal will be closed by handleRoomAllocation
    } catch (error) {
      console.error('Failed to allocate room:', error);
    } finally {
      setIsAllocating(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    // Cleanup function - no complex logic needed
  }, []);

  const openEditModal = (student: StudentWithRoom) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || '',
      email: student.email || '',
      phone: (student as any).phone || ''
    });
    setShowEditModal(true);
  };

  // Simple search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Export functionality
  const handleExportStudents = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    if (!hostelId) return;
    
    try {
      const response = await fetch(`/api/hostels/${hostelId}/students/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to export student data');
      }
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students-${hostelId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students-${hostelId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      notification.success('Student data exported successfully!');
    } catch (err) {
      console.error('Error exporting students:', err);
      notification.error('Failed to export student data');
    }
  }, [hostelId]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    
    const query = searchQuery.toLowerCase().trim();
    return students.filter(student => {
      const phone = student.phone?.toLowerCase() ?? '';
      const roomNum = student.roomNumber?.toLowerCase() ?? '';
      return (
        student.name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        phone.includes(query) ||
        roomNum.includes(query)
      );
    });
  }, [students, searchQuery]);

  // Computed values
  const totalStudents = useMemo(() => students.length, [students]);
  const activeStudents = useMemo(() => students.filter(s => s.isActive !== false).length, [students]);
  const studentsWithRooms = useMemo(() => students.filter(s => s.roomNumber).length, [students]);

  // Early returns
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading students for hostel: {hostelId}</p>
          <Button 
            onClick={() => loadStudents()} 
            className="mt-4"
            variant="outline"
          >
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Failed to Load Students</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => loadStudents()} variant="outline">Retry Loading</Button>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if context is ready and hostel is selected
  if (!hostelId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hostel context...</p>
        </div>
      </div>
    );
  }

  // Check if user has permission to view students
  if (!canViewStudents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <GraduationCapIcon size={64} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to view student management.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator to get access to student management features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="mt-2 text-gray-600">
            Manage and view all students in your hostel
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex items-center justify-center px-4 py-2 w-full sm:w-auto"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCwIcon size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          {/* Export buttons - only if user has export permission */}
          {canExportStudents && (
            <>
              <Button 
                variant="outline" 
                className="flex items-center justify-center px-4 py-2 w-full sm:w-auto"
                onClick={() => handleExportStudents('csv')}
              >
                <DownloadIcon size={16} className="mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center px-4 py-2 w-full sm:w-auto"
                onClick={() => handleExportStudents('json')}
              >
                <DownloadIcon size={16} className="mr-2" />
                Export JSON
              </Button>
            </>
          )}
          
          {/* Show Add New Student button only if user has student_create permission */}
          {canCreateStudents && (
            <Button 
              variant="primary" 
              className="flex items-center justify-center px-6 py-3 w-full sm:w-auto"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon size={18} className="mr-2" />
              Add New Student
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {canViewStudents && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 text-white">
              <GraduationCapIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-700">Total Students</p>
              <p className="text-2xl font-bold text-blue-900">{totalStudents}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 text-white">
              <UserIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-700">Active Students</p>
              <p className="text-2xl font-bold text-green-900">{activeStudents}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 text-white">
              <BedIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-700">With Rooms</p>
              <p className="text-2xl font-bold text-purple-900">{studentsWithRooms}</p>
            </div>
          </div>
        </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="p-6 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or room..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            {/* Clear search button */}
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear search"
              >
                <XIcon size={16} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {searchQuery ? (
              `${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''} found for \u201C${searchQuery}\u201D`
            ) : (
              `${students.length} student${students.length !== 1 ? 's' : ''} found`
            )}
          </div>
        </div>
      </Card>

      {/* Students Display */}
      {filteredStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
            <GraduationCapIcon size={64} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No students match your search' : 'No students found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery ? `No students found for \u201C${searchQuery}\u201D` : 'Get started by adding your first student'}
          </p>
          {!searchQuery && canCreateStudents && (
            <Button 
              variant="primary" 
              className="flex items-center mx-auto"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon size={16} className="mr-2" />
              Add New Student
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      {canViewStudentRooms && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Room
                        </th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <UserIcon size={18} className="text-green-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.email}</div>
                          {(student as any).phone && (
                            <div className="text-sm text-gray-500">{(student as any).phone}</div>
                          )}
                        </td>
                        {canViewStudentRooms && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.roomNumber ? (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Room {student.roomNumber}
                                </span>
                                {canDeallocateRooms && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="px-2 py-1 text-xs hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                                    onClick={() => handleRoomDeallocation(student.id)}
                                    disabled={isDeleting === student.id}
                                  >
                                    {isDeleting === student.id ? (
                                      <LoadingSpinner size="sm" className="text-red-600" />
                                    ) : (
                                      '×'
                                    )}
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Not assigned</span>
                                {canAllocateRooms && (
                                  <Button 
                                    variant="primary" 
                                    size="sm" 
                                    className="text-xs"
                                    onClick={() => openRoomAllocationModal(student)}
                                  >
                                    Allocate
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative inline-block text-left">
                            <select
                              className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              onChange={(e) => {
                                const action = e.target.value;
                                if (action === 'edit') {
                                  openEditModal(student);
                                } else if (action === 'delete') {
                                  handleDeleteStudent(student.id);
                                } else if (action === 'allocate') {
                                  openRoomAllocationModal(student);
                                } else if (action === 'deallocate') {
                                  handleRoomDeallocation(student.id);
                                }
                                e.target.value = ''; // Reset select
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Actions</option>
                              {canUpdateStudents && <option value="edit">Edit Student</option>}
                              {!student.roomNumber && canAllocateRooms && <option value="allocate">Allocate Room</option>}
                              {student.roomNumber && canDeallocateRooms && <option value="deallocate">Remove Room</option>}
                              {canDeleteStudents && <option value="delete" className="text-red-600">Delete Student</option>}
                            </select>
                            {isDeleting === student.id && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <LoadingSpinner size="sm" className="text-red-600" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Accordion View */}
          <div className="md:hidden space-y-4">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="overflow-hidden">
                <button
                  className="w-full px-4 py-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  onClick={() => {
                    setExpandedStudents(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(student.id)) {
                        newSet.delete(student.id);
                      } else {
                        newSet.add(student.id);
                      }
                      return newSet;
                    });
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <UserIcon size={18} className="text-green-600" />
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {student.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {student.roomNumber ? `Room ${student.roomNumber}` : 'No room assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <ChevronDownIcon 
                        size={20} 
                        className={`text-gray-400 transition-transform duration-200 ${
                          expandedStudents.has(student.id) ? 'transform rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </div>
                </button>
                
                {expandedStudents.has(student.id) && (
                  <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                    <dl className="space-y-3 pt-3">
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900">{student.email}</dd>
                      </div>
                      
                      {(student as any).phone && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</dt>
                          <dd className="mt-1 text-sm text-gray-900">{(student as any).phone}</dd>
                        </div>
                      )}
                      
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Room Assignment</dt>
                        <dd className="mt-1">
                          {student.roomNumber ? (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Room {student.roomNumber}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not assigned</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                    
                    <div className="flex space-x-2 mt-4 pt-3 border-t border-gray-200">
                      {canUpdateStudents && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditModal(student)}
                        >
                          <EditIcon size={14} className="mr-1" />
                          Edit
                        </Button>
                      )}
                      {!student.roomNumber && canAllocateRooms && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => openRoomAllocationModal(student)}
                        >
                          Allocate Room
                        </Button>
                      )}
                      {student.roomNumber && canDeallocateRooms && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                          onClick={() => handleRoomDeallocation(student.id)}
                          disabled={isDeleting === student.id}
                        >
                          {isDeleting === student.id ? (
                            <LoadingSpinner size="sm" className="text-red-600" />
                          ) : (
                            'Remove Room'
                          )}
                        </Button>
                      )}
                      {canDeleteStudents && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="px-3 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                          onClick={() => handleDeleteStudent(student.id)}
                          disabled={isDeleting === student.id}
                        >
                          {isDeleting === student.id ? (
                            <LoadingSpinner size="sm" className="text-red-600" />
                          ) : (
                            <span className="text-red-600">Delete</span>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create Student Modal */}
      <PermissionGate permission="student_create">
        {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Student</h3>
            <p className="text-sm text-gray-600 mb-4">
              A default password (123456) will be automatically set for the student.
            </p>
            
            {/* Default Password Notice */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>Default Password:</strong> 123456
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Students will be prompted to change this password on first login
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Student's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="student@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateStudent}
                className="flex-1"
                disabled={!createForm.name || !createForm.email || isCreating}
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Student'
                )}
              </Button>
            </div>
          </div>
        </div>
        )}
      </PermissionGate>

      {/* Edit Student Modal - Using student_create permission as fallback */}
      <PermissionGate permission="student_update">
        {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Student {editingStudent.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Student's full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="student@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phone number"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleUpdateStudent(editForm)}
                className="flex-1"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Student'
                )}
              </Button>
            </div>
          </div>
        </div>
        )}
      </PermissionGate>

      {/* Room Allocation Modal */}
      <PermissionGate permission="room_allocation_create">
        {showRoomAllocationModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Allocate Room to {selectedStudent.name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select an available room for this student
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Available Rooms</label>
                {availableRooms.length === 0 ? (
                  <p className="text-sm text-gray-500">No available rooms found</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedRoomId === room.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedRoomId(room.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">Room {room.roomNumber}</p>
                            <p className="text-sm text-gray-500">
                              {room.occupied || 0}/{room.capacity} occupied
                            </p>
                          </div>
                          {selectedRoomId === room.id && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRoomAllocationModal(false);
                  setSelectedStudent(null);
                  setSelectedRoomId('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAllocateRoom}
                className="flex-1"
                disabled={!selectedRoomId || isAllocating}
              >
                {isAllocating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Allocating...
                  </>
                ) : (
                  'Allocate Room'
                )}
              </Button>
            </div>
          </div>
        </div>
        )}
      </PermissionGate>
    </div>
  );
}

