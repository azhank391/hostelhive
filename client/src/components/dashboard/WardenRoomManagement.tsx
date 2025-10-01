'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-url';
import { Button } from '../ui/Button';
// import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  ArrowPathIcon,
  HomeIcon,
  // CheckCircleIcon,
  // XIcon,
  UserIcon,
  BedIcon,
  EyeIcon,
  UsersIcon,
  MailIcon,
  PhoneIcon
} from '../ui/icons';
import { useAdminApiWithHostel } from '../../lib/context-aware-api';
import { Room } from '../../lib/types';
import RoomFormModal from './RoomFormModal';
import toast from '../../lib/toast';

// Types for room allocation
interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  hasRoom: boolean;
  roomNumber?: string;
  roomId?: string;
  roomBlock?: string;
  allocationId?: string;
  allocations?: Array<{
    id: string;
    status: string;
    room: {
      id: string;
      roomNumber: string;
      block?: string;
    };
  }>;
}

interface RoomAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  rooms: Room[];
  onAllocate: (studentId: string, roomId: string) => Promise<void>;
  loading?: boolean;
}

// Room Details View Modal Component
interface RoomDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  students: Student[];
  onDeallocate: (studentId: string) => Promise<void>;
  loading?: boolean;
}

const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  isOpen,
  onClose,
  room,
  students,
  onDeallocate,
  loading = false
}) => {
  const [deallocatingStudent, setDeallocatingStudent] = useState<string | null>(null);

  if (!room) return null;

  // Calculate actual occupancy - prioritize room.occupied, fallback to allocations
  const occupiedBeds = (room.occupied !== undefined && room.occupied !== null) ? room.occupied : (room.allocations ? room.allocations.length : 0);
  const capacity = room.capacity || 0;
  const occupancyPercentage = capacity > 0 ? (occupiedBeds / capacity) * 100 : 0;

  const handleDeallocate = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from Room ${room.roomNumber}?\n\nThis will:\n• Remove the student from this room\n• Update room occupancy\n• The student will appear as \"unallocated\" in student management`)) {
      return;
    }

    try {
      setDeallocatingStudent(studentId);
      
      // Call the deallocation handler (which has optimistic updates)
  await onDeallocate(studentId);
      
    } catch (error) {
      console.error('Failed to deallocate student:', error);
      // Don't show error toast here since onDeallocate handles it
    } finally {
      setDeallocatingStudent(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Room ${room.roomNumber} Details`}>
      <div className="space-y-6">
        {/* Room Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Capacity</p>
            <p className="text-lg font-semibold text-gray-900">{capacity}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Occupied</p>
            <p className="text-lg font-semibold text-gray-900">{occupiedBeds}/{capacity}</p>
          </div>
        </div>
        
        {room.block && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Block</p>
            <p className="text-lg font-semibold text-gray-900">{room.block}</p>
          </div>
        )}

        {/* Room Status */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Room Status</span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              occupiedBeds === 0 
                ? 'bg-green-100 text-green-800' 
                : occupiedBeds === capacity 
                ? 'bg-red-100 text-red-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {occupiedBeds === 0 ? 'Vacant' : occupiedBeds === capacity ? 'Full' : 'Partially Occupied'}
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${occupancyPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 mt-1">{Math.round(occupancyPercentage)}% occupied</p>
          </div>
        </div>

        {/* Students in Room */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Students in Room</h4>
            {students.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {students.length} student{students.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-gray-500">Loading students...</span>
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {students
                .filter(student => student && student.id) // Filter out any undefined students
                .map((student, index) => (
                  <div 
                    key={student.id || `student-${index}`} 
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <UserIcon size={16} />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 text-sm">{student.name || 'Unknown Student'}</h5>
                            <p className="text-xs text-gray-500">Student ID: {student.id}</p>
                          </div>
                        </div>
                        
                        <div className="ml-11 space-y-1">
                          <div className="flex items-center space-x-2">
                            <MailIcon size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{student.email || 'No email'}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center space-x-2">
                              <PhoneIcon size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-700">{student.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <HomeIcon size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-600">Room {room.roomNumber}</span>
                            {room.block && (
                              <span className="text-xs text-gray-500">(Block {room.block})</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 px-3 py-1 ml-4"
                        onClick={() => handleDeallocate(student.id, student.name || 'Unknown Student')}
                        disabled={deallocatingStudent === student.id}
                      >
                        {deallocatingStudent === student.id ? (
                          <LoadingSpinner size="sm" className="text-white" />
                        ) : (
                          'Remove'
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                <UserIcon size={48} />
              </div>
              <p className="text-gray-500 font-medium">No students assigned</p>
              <p className="text-sm text-gray-400 mt-1">This room is currently empty</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Room Allocation Modal Component
const RoomAllocationModal: React.FC<RoomAllocationModalProps> = ({
  isOpen,
  onClose,
  students,
  rooms,
  onAllocate,
  loading = false
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [allocating, setAllocating] = useState(false);
  // mark currently-unused loading prop as intentionally referenced
  void loading;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStudentId('');
      setSelectedRoomId('');
      setAllocating(false);
    }
  }, [isOpen]);

  // Get available rooms (not full)
  const availableRooms = useMemo(() => {
    return rooms.filter(room => {
      const occupied = (room.occupied !== undefined && room.occupied !== null) ? room.occupied : (room.allocations ? room.allocations.length : 0);
      const capacity = room.capacity || 0;
      return occupied < capacity;
    });
  }, [rooms]);

  // Get students without rooms - using student allocations, not room occupancy
  const studentsWithoutRooms = useMemo(() => {
    // Filter students who don't have active room allocations
    return students.filter(student => {
      // Check if student has active allocations
      const hasActiveAllocation = student.allocations && 
        student.allocations.some(allocation => allocation.status === 'active');
      
      return !hasActiveAllocation;
    });
  }, [students]);

  const handleAllocate = async () => {
    if (!selectedStudentId || !selectedRoomId) {
      toast.error('Please select both a student and a room');
      return;
    }

    try {
      setAllocating(true);
      
      // Close modal immediately for better UX
      onClose();
      
      // Call the allocation handler (which has optimistic updates)
      await onAllocate(selectedStudentId, selectedRoomId);
      
    } catch (error) {
      console.error('Failed to allocate room:', error);
      // Don't show error toast here since onAllocate handles it
    } finally {
      setAllocating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Allocate Room to Student">
      <div className="space-y-6">
        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Student
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a student...</option>
            {studentsWithoutRooms.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} - {student.email}
              </option>
            ))}
          </select>
          {studentsWithoutRooms.length === 0 ? (
            <p className="text-sm text-gray-500 mt-1">All students have been allocated rooms</p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              {studentsWithoutRooms.length} student{studentsWithoutRooms.length !== 1 ? 's' : ''} available for allocation
            </p>
          )}
        </div>

        {/* Room Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Room
          </label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a room...</option>
            {availableRooms.map(room => {
              const occupied = room.occupied || 0;
              const capacity = room.capacity || 0;
              return (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} ({occupied}/{capacity} occupied)
                  {room.block && ` - Block ${room.block}`}
                </option>
              );
            })}
          </select>
          {availableRooms.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No available rooms</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={allocating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAllocate}
            disabled={!selectedStudentId || !selectedRoomId || allocating}
            className="flex items-center"
          >
            {allocating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Allocating...
              </>
            ) : (
              <>
                <BedIcon size={16} className="mr-2" />
                Allocate Room
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const WardenRoomManagement = React.memo(() => {
  const adminApi = useAdminApiWithHostel();
  
  // State management
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [showRoomAllocationModal, setShowRoomAllocationModal] = useState(false);
  const [showRoomDetailsModal, setShowRoomDetailsModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [viewingRoom, setViewingRoom] = useState<Room | null>(null);
  const [roomStudents, setRoomStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    if (!searchTerm.trim()) return rooms;
    
    return rooms.filter(room =>
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.block && room.block.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, rooms]);

  // Students without rooms - calculated from student allocations, not room occupancy
  const studentsWithoutRooms = useMemo(() => {
    // Filter students who don't have active room allocations
    return students.filter(student => {
      // Check if student has active allocations
      const hasActiveAllocation = student.allocations && 
        student.allocations.some(allocation => allocation.status === 'active');
      
      return !hasActiveAllocation;
    });
  }, [students]);

  // Room statistics
  const roomStats = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(room => {
      const occupied = (room.occupied !== undefined && room.occupied !== null) ? room.occupied : (room.allocations ? room.allocations.length : 0);
      return occupied > 0;
    }).length;
    const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
    const totalOccupied = rooms.reduce((sum, room) => {
      const occupied = (room.occupied !== undefined && room.occupied !== null) ? room.occupied : (room.allocations ? room.allocations.length : 0);
      return sum + occupied;
    }, 0);
    
    return {
      total: totalRooms,
      occupied: occupiedRooms,
      vacant: totalRooms - occupiedRooms,
      capacity: totalCapacity,
      occupancy: totalOccupied,
      occupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0
    };
  }, [rooms]);

  // Fetch rooms function
  const fetchRooms = useCallback(async () => {
    try {
      setError(null);
      const response = await adminApi.getRooms();
      
      // Handle different response formats
      let data: Room[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        data = Array.isArray((response as any).data) ? (response as any).data : [];
      } else if (response && typeof response === 'object' && 'rooms' in response) {
        data = Array.isArray((response as any).rooms) ? (response as any).rooms : [];
      }
      

      setRooms(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rooms';
      setError(errorMessage);
      console.error('Failed to fetch rooms:', error);
    }
  }, []);

  // Fetch students function
  const fetchStudents = useCallback(async () => {
    try {
      const response = await adminApi.getStudents();
      
      let data: Student[] = [];
      if (Array.isArray(response)) {
        data = response as Student[];
      } else if (response && typeof response === 'object' && 'data' in response) {
        data = Array.isArray((response as any).data) ? (response as any).data : [];
      } else if (response && typeof response === 'object' && 'students' in response) {
        data = Array.isArray((response as any).students) ? (response as any).students : [];
      }
      

      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRooms(), fetchStudents()]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchRooms, fetchStudents]);

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAllData();
      toast.success('Data refreshed successfully');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, [fetchAllData]);

  // FIXED: Optimistic updates for create operation - let them persist
  const handleCreateSuccess = useCallback((newRoom?: any) => {
    // Modal already closed by RoomFormModal
    setShowCreateRoomModal(false);
    
    // Add new room to UI immediately if provided
    if (newRoom) {
      setRooms(prevRooms => [...prevRooms, newRoom]);
    }
    
    // NO fetchAllData() - let optimistic updates persist!
  }, []);

  // FIXED: Optimistic updates for edit operation - let them persist
  const handleEditSuccess = useCallback((updatedRoom?: any) => {
    // Modal already closed by RoomFormModal
    setShowEditRoomModal(false);
    setSelectedRoom(null);
    
    // Update room in UI immediately if provided
    if (updatedRoom) {
      setRooms(prevRooms => prevRooms.map(room => 
        room.id === updatedRoom.id 
          ? { 
              ...room,           // Keep all existing room data (including allocations, occupied)
              ...updatedRoom,    // Override with updated fields
              allocations: room.allocations,  // Explicitly preserve allocations
              occupied: room.occupied         // Explicitly preserve occupied count
            }
          : room
      ));
      
      // Also update viewingRoom if it's the same room
      if (viewingRoom && viewingRoom.id === updatedRoom.id) {
        setViewingRoom(prev => prev ? { 
          ...prev, 
          ...updatedRoom,
          allocations: prev.allocations,  // Preserve allocations
          occupied: prev.occupied         // Preserve occupied count
        } : null);
      }
    }
    
    // NO fetchAllData() - let optimistic updates persist!
  }, [viewingRoom]);

  // FIXED: Optimistic updates for delete operation
  const handleDeleteRoom = useCallback(async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      // Optimistic update - remove immediately
      setRooms(prevRooms => prevRooms.filter(room => room.id !== roomId));
      
      // Make API call
      await adminApi.deleteRoom(roomId);
      
      toast.success('Room deleted successfully');
      
      // NO fetchStudents() - let optimistic updates persist!
      // Students page will fetch fresh data when visited
      
    } catch (error) {
      // Revert optimistic update on error - refresh all data
      await fetchAllData();
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete room';
      toast.error(errorMessage);
      console.error('Failed to delete room:', error);
    }
  }, [fetchRooms]);

  // Handle room allocation - update both rooms and students state optimistically
  const handleAllocateRoom = useCallback(async (studentId: string, roomId: string) => {
    try {
      // Find the room and student to update
      const room = rooms.find(r => r.id === roomId);
      const student = students.find(s => s.id === studentId);
      
      if (room && student) {
        // OPTIMISTIC UPDATE: Update room occupancy immediately
        setRooms(prevRooms => prevRooms.map(r => 
          r.id === roomId ? { ...r, occupied: (r.occupied || 0) + 1 } : r
        ));
        
        // OPTIMISTIC UPDATE: Update student allocations immediately
        setStudents(prevStudents => prevStudents.map(s => 
          s.id === studentId ? {
            ...s,
            allocations: [
              ...(s.allocations || []),
              {
                id: `temp-${Date.now()}`, // Temporary ID for optimistic update
                studentId: studentId,
                room: room,
                status: 'active',
                allocatedAt: new Date().toISOString()
              }
            ]
          } : s
        ));
        
        // Also update viewingRoom if it's the same room
        if (viewingRoom && viewingRoom.id === roomId) {
          setViewingRoom(prev => prev ? { ...prev, occupied: (prev.occupied || 0) + 1 } : null);
        }
      }
      
      // Show success immediately
      toast.success('Room allocated successfully');
      
      // Make API call in background
      try {
        await adminApi.allocateRoom({ studentId, roomId });
        // NO fetchAllData() - let optimistic updates persist!
      } catch (apiError) {
        // If API fails, revert optimistic updates
        console.error('API call failed, reverting optimistic updates:', apiError);
        await fetchAllData();
        throw apiError;
      }
      
    } catch (error) {
      console.error('Room allocation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to allocate room';
      
      // Revert optimistic updates on error
      await fetchAllData();
      
      // Handle specific backend errors
      if (errorMessage.includes('already has an active room allocation')) {
        toast.error('This student already has a room assigned. Please remove them from their current room first.');
      } else {
        toast.error(errorMessage);
      }
      
      throw error;
    }
  }, [fetchAllData, rooms, viewingRoom, students]);

  // Handle room deallocation - update both rooms and students state optimistically
  const handleDeallocateStudent = useCallback(async (studentId: string) => {
    try {
      // Find the student and their active allocation
      const student = students.find(s => s.id === studentId);
      const activeAllocation = student?.allocations?.find(allocation => allocation.status === 'active');
      
      if (activeAllocation && student) {
        // Find the room to update using the allocation's room information
        const roomToUpdate = rooms.find(r => r.id === activeAllocation.room?.id);
        
        if (roomToUpdate) {
          // OPTIMISTIC UPDATE: Update room occupancy immediately
          setRooms(prev => prev.map(room => 
            room.id === roomToUpdate.id 
              ? { ...room, occupied: Math.max(0, (room.occupied || 0) - 1) }
              : room
          ));
          
          // OPTIMISTIC UPDATE: Update student allocations immediately
          setStudents(prevStudents => prevStudents.map(s => 
            s.id === studentId ? {
              ...s,
              allocations: (s.allocations || []).filter(allocation => 
                !(allocation.room?.id === roomToUpdate.id && allocation.status === 'active')
              )
            } : s
          ));
          
          // Also update viewingRoom if it's the same room
          if (viewingRoom && viewingRoom.id === roomToUpdate.id) {
            setViewingRoom(prev => prev ? { ...prev, occupied: Math.max(0, (prev.occupied || 0) - 1) } : null);
            // Update room students list for modal display
            setRoomStudents(prev => prev.filter(student => student.id !== studentId));
          }
        }
      }
      
      // Show success immediately
      toast.success('Student removed successfully');
      
      // Make API call in background
      try {
        await adminApi.deallocateRoom(studentId);
        // NO fetchAllData() - let optimistic updates persist!
      } catch (apiError) {
        // If API fails, revert optimistic updates
        console.error('API call failed, reverting optimistic updates:', apiError);
        await fetchAllData();
        throw apiError;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove student';
      toast.error(errorMessage);
      
      // Revert optimistic updates on error
      await fetchAllData();
      
      throw error;
    }
  }, [viewingRoom, fetchAllData, students, rooms]);

  // Open room details modal
  const openRoomDetailsModal = useCallback(async (room: Room) => {
    setViewingRoom(room);
    setShowRoomDetailsModal(true);
    setLoadingStudents(true);
    
    try {
      // Use the same endpoint as the owner dashboard to get students for this specific room
      const response = await fetch(getApiUrl(`/api/hostels/${room.hostelId}/rooms/${room.id}/students`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch room students (${response.status})`);
      }
      
      const data = await response.json();

      
      // Set the students for this room
      setRoomStudents(data.students || []);
      
    } catch (error) {
      console.error('Failed to fetch room students:', error);
      // Fallback: try to get students from room allocations if available
      if (room.allocations && Array.isArray(room.allocations)) {
        const roomStudentsList = room.allocations
          .filter(allocation => allocation.status === 'active')
          .map(allocation => {
            // Find the corresponding student from our students list
            const student = students.find(s => s.id === allocation.userId);
            
            if (student) {
              return student;
            }
            
            // If student not found in our list, create a basic student object from allocation data
            if (allocation.user) {
              return {
                id: allocation.userId,
                name: allocation.user.name || `Student ${allocation.userId}`,
                email: allocation.user.email || 'No email',
                phone: allocation.user.phone,
                hasRoom: true,
                allocations: [{
                  id: allocation.id,
                  status: allocation.status,
                  room: {
                    id: room.id,
                    roomNumber: room.roomNumber,
                    block: room.block
                  }
                }]
              };
            }
            
            // Last fallback - create basic student object
            return {
              id: allocation.userId,
              name: `Student ${allocation.userId}`,
              email: 'No email',
              phone: undefined,
              hasRoom: true,
              allocations: [{
                id: allocation.id,
                status: allocation.status,
                room: {
                  id: room.id,
                  roomNumber: room.roomNumber,
                  block: room.block
                }
              }]
            };
          });
        
        setRoomStudents(roomStudentsList);
      } else {
        setRoomStudents([]);
      }
    } finally {
      setLoadingStudents(false);
    }
  }, [students]);

  // Event handlers
  const handleEditRoom = useCallback((room: Room) => {
    setSelectedRoom(room);
    setShowEditRoomModal(true);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const closeModal = useCallback(() => {
    setShowEditRoomModal(false);
    setShowCreateRoomModal(false);
    setShowRoomAllocationModal(false);
    setShowRoomDetailsModal(false);
    setSelectedRoom(null);
    setViewingRoom(null);
    setRoomStudents([]);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading rooms</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4 space-x-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600">Manage hostel rooms and student allocations</p>
          {loading && (
            <p className="text-xs text-gray-500 mt-1">Loading latest data...</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            disabled={refreshing}
            className="flex items-center"
          >
            <ArrowPathIcon size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={() => setShowRoomAllocationModal(true)} 
            variant="outline"
            className="flex items-center"
          >
            <BedIcon size={16} className="mr-2" />
            Allocate Rooms
          </Button>
          <Button 
            onClick={() => setShowCreateRoomModal(true)} 
            className="flex items-center"
          >
            <PlusIcon size={16} className="mr-2" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Simple red indicator for students needing rooms */}
      {studentsWithoutRooms.length > 0 && (
        <div className="bg-red-100 border border-red-300 rounded-md px-4 py-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-red-800 text-sm font-medium">
              ⚠️ {studentsWithoutRooms.length} student{studentsWithoutRooms.length !== 1 ? 's' : ''} need{studentsWithoutRooms.length !== 1 ? '' : 's'} room allocation
            </span>
            <Button 
              onClick={() => setShowRoomAllocationModal(true)} 
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <BedIcon size={14} className="mr-2" />
              Allocate Now
            </Button>
          </div>
        </div>
      )}



      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">Total Rooms</div>
          <div className="text-2xl font-bold text-gray-900">{roomStats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">Occupied</div>
          <div className="text-2xl font-bold text-green-600">{roomStats.occupied}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">Vacant</div>
          <div className="text-2xl font-bold text-blue-600">{roomStats.vacant}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-sm font-medium text-gray-500">Occupancy Rate</div>
          <div className="text-2xl font-bold text-purple-600">{roomStats.occupancyRate}%</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search rooms by number or block..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        {searchTerm && (
          <span className="text-sm text-gray-600">
            {filteredRooms.length} of {rooms.length} rooms
          </span>
        )}
      </div>

      {/* Rooms grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              🏠
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No rooms found' : 'No rooms yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first room'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateRoomModal(true)}>
                <PlusIcon size={16} className="mr-2" />
                Add Room
              </Button>
            )}
          </div>
        ) : (
          filteredRooms.map((room) => {
            // Calculate actual occupancy - prioritize room.occupied, fallback to allocations
            const occupiedBeds = (room.occupied !== undefined && room.occupied !== null) ? room.occupied : (room.allocations ? room.allocations.length : 0);
            const capacity = room.capacity || 0;
            const occupancyPercentage = capacity > 0 ? (occupiedBeds / capacity) * 100 : 0;
            

            
            return (
              <div key={room.id} className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Room {room.roomNumber}
                    </h3>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => handleEditRoom(room)}
                        variant="outline"
                        size="sm"
                        className="p-2"
                      >
                        <PencilIcon size={14} />
                      </Button>
                      <Button
                        onClick={() => handleDeleteRoom(room.id)}
                        variant="outline"
                        size="sm"
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  {room.block && (
                    <p className="text-sm text-gray-600 mb-2">Block: {room.block}</p>
                  )}
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Occupancy</span>
                      <span>{occupiedBeds}/{capacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          occupancyPercentage === 100 ? 'bg-red-500' : 
                          occupancyPercentage >= 80 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${occupancyPercentage}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Student details */}
                  {occupiedBeds > 0 ? (
                    <div className="mb-3 p-2 bg-gray-50 rounded">
                      <div className="text-xs font-medium text-gray-600 mb-1">Students:</div>
                      {room.allocations?.map((allocation: any, index: number) => (
                        <div key={index} className="text-xs text-gray-700 flex items-center">
                          <UsersIcon size={12} className="mr-1" />
                          {allocation.student?.name || `Student ${index + 1}`}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs font-medium text-blue-600 mb-2">No students allocated</div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {occupiedBeds}/{capacity} beds occupied
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      occupiedBeds === 0 
                        ? 'bg-green-100 text-green-800' 
                        : occupiedBeds === capacity 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {occupiedBeds === 0 ? 'Vacant' : occupiedBeds === capacity ? 'Full' : 'Partially Occupied'}
                    </span>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex space-x-2 mt-3">
                    <Button
                      onClick={() => openRoomDetailsModal(room)}
                      variant="outline"
                      size="sm"
                      className="w-full hover:bg-blue-50 hover:border-blue-300"
                    >
                      <EyeIcon size={14} className="mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FIXED: Updated modals with proper success handlers */}
      {showEditRoomModal && selectedRoom && (
        <RoomFormModal
          isOpen={showEditRoomModal}
          onClose={closeModal}
          room={selectedRoom}
          mode="edit"
          hostelBlocks={[]}
          existingRooms={rooms}
          adminApi={adminApi}
          hostelId=""
          onSuccess={handleEditSuccess} // Use the new success handler
        />
      )}

      {showCreateRoomModal && (
        <RoomFormModal
          isOpen={showCreateRoomModal}
          onClose={closeModal}
          mode="create"
          hostelBlocks={[]}
          existingRooms={rooms}
          adminApi={adminApi}
          hostelId=""
          onSuccess={handleCreateSuccess} // Use the new success handler
        />
      )}

      {showRoomAllocationModal && (
        <RoomAllocationModal
          isOpen={showRoomAllocationModal}
          onClose={() => setShowRoomAllocationModal(false)}
          students={students}
          rooms={rooms}
          onAllocate={handleAllocateRoom}
          loading={false}
        />
      )}

      {showRoomDetailsModal && viewingRoom && (
        <RoomDetailsModal
          isOpen={showRoomDetailsModal}
          onClose={() => setShowRoomDetailsModal(false)}
          room={viewingRoom}
          students={roomStudents}
          onDeallocate={handleDeallocateStudent}
          loading={loadingStudents}
        />
      )}
    </div>
  );
});

WardenRoomManagement.displayName = 'WardenRoomManagement';

export default WardenRoomManagement;
