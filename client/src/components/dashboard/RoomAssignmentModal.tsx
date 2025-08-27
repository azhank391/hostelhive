'use client'

import React, { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  XIcon, 
  CheckIcon, 
  UserIcon, 
  HomeIcon, 
  UsersIcon, 
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  AlertCircleIcon,
  InfoIcon,
  SearchIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  BedIcon,
  WifiIcon,
  DropletIcon,
  WindIcon,
  TvIcon,
  StarIcon,
  DollarSignIcon,
  AlertTriangleIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useHostel } from '@/context/HostelContext';
import toast from '@/lib/toast';

interface Room {
  id: string;
  roomNumber: string;
  block?: string;
  capacity: number;
  occupied: number;
  floor?: number;
  roomType?: 'single' | 'double' | 'triple' | 'quad' | 'dormitory';
  amenities?: string[];
  rent?: number;
  isActive?: boolean;
  rating?: number;
  lastMaintenance?: string;
  description?: string;
  occupants?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  course?: string;
  year?: number;
  preferences?: {
    roomType?: string;
    floor?: number;
    amenities?: string[];
    maxRent?: number;
  };
  allocations?: Array<{
    id: string;
    status: string;
    startDate?: string;
    endDate?: string;
    room: {
      id: string;
      roomNumber: string;
      block?: string;
    };
  }>;
}

interface RoomFilters {
  block: string;
  floor: string;
  roomType: string;
  minCapacity: string;
  maxCapacity: string;
  maxRent: string;
  availableOnly: boolean;
  hasAmenities: string[];
  searchQuery: string;
}

interface OptimizedRoomAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  rooms: Room[];
  onAssign: (data: { studentId: string; roomId: string; assignmentData?: any }) => Promise<void>;
  onDeallocate?: (allocationId: string) => Promise<void>;
  isReassignment?: boolean;
  showAdvancedFilters?: boolean;
  enablePreferences?: boolean;
  showRoomDetails?: boolean;
  allowBulkAssignment?: boolean;
  onValidation?: (studentId: string, roomId: string) => Promise<boolean>;
  customValidationRules?: Array<{
    rule: (student: Student, room: Room) => boolean;
    message: string;
  }>;
}

// Available amenities
const ROOM_AMENITIES = [
  'Wi-Fi', 'Air Conditioning', 'Attached Bathroom', 'TV', 'Refrigerator',
  'Study Table', 'Wardrobe', 'Balcony', 'Window', 'Fan', 'Heater'
];

const ROOM_TYPES = [
  { value: 'single', label: 'Single Room', capacity: 1 },
  { value: 'double', label: 'Double Room', capacity: 2 },
  { value: 'triple', label: 'Triple Room', capacity: 3 },
  { value: 'quad', label: 'Quad Room', capacity: 4 },
  { value: 'dormitory', label: 'Dormitory', capacity: 6 }
];

// Memoized room card component
const RoomCard = memo(({ 
  room, 
  student,
  isSelected, 
  onSelect, 
  showDetails = false,
  isRecommended = false
}: {
  room: Room;
  student: Student | null;
  isSelected: boolean;
  onSelect: (roomId: string) => void;
  showDetails?: boolean;
  isRecommended?: boolean;
}) => {
  const availableSpots = room.capacity - room.occupied;
  const occupancyPercentage = (room.occupied / room.capacity) * 100;

  const handleClick = useCallback(() => {
    if (availableSpots > 0) {
      onSelect(room.id);
    }
  }, [availableSpots, onSelect, room.id]);

  const compatibilityScore = useMemo(() => {
    if (!student?.preferences) return 0;
    
    let score = 0;
    let maxScore = 0;

    // Room type preference
    if (student.preferences.roomType) {
      maxScore += 3;
      if (room.roomType === student.preferences.roomType) score += 3;
    }

    // Floor preference
    if (student.preferences.floor && room.floor) {
      maxScore += 2;
      if (room.floor === student.preferences.floor) score += 2;
    }

    // Rent preference
    if (student.preferences.maxRent && room.rent) {
      maxScore += 2;
      if (room.rent <= student.preferences.maxRent) score += 2;
    }

    // Amenities preference
    if (student.preferences.amenities?.length && room.amenities?.length) {
      maxScore += 3;
      const matchedAmenities = student.preferences.amenities.filter(
        amenity => room.amenities?.includes(amenity)
      );
      score += (matchedAmenities.length / student.preferences.amenities.length) * 3;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }, [student?.preferences, room]);

  const amenityIcons = useMemo(() => ({
    'Wi-Fi': <WifiIcon className="w-3 h-3" />,
    'Air Conditioning': <WindIcon className="w-3 h-3" />,
    'Attached Bathroom': <DropletIcon className="w-3 h-3" />,
    'TV': <TvIcon className="w-3 h-3" />,
    'Study Table': <BedIcon className="w-3 h-3" />
  }), []);

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        availableSpots === 0 
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
          : isSelected
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
      } ${isRecommended ? 'ring-2 ring-green-200' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          {/* Room Header */}
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              isSelected
                ? 'border-blue-500 bg-blue-500'
                : availableSpots > 0
                  ? 'border-gray-300'
                  : 'border-gray-200'
            }`}>
              {isSelected && <CheckIcon size={12} className="text-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">
                  Room {room.roomNumber}
                  {room.block && ` (Block ${room.block})`}
                </h4>
                {isRecommended && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    Recommended
                  </span>
                )}
                {room.rating && (
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-600">{room.rating}</span>
                  </div>
                )}
              </div>
              {room.roomType && (
                <p className="text-xs text-gray-500 capitalize">{room.roomType.replace('-', ' ')}</p>
              )}
            </div>
          </div>

          {/* Occupancy Information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Occupancy:</span>
              <span className="font-medium">
                {room.occupied}/{room.capacity} students
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  occupancyPercentage === 100 ? 'bg-red-500' :
                  occupancyPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>

          {/* Additional Information */}
          {showDetails && (
            <div className="space-y-2">
              {room.floor && (
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <MapPinIcon className="w-3 h-3" />
                  <span>Floor {room.floor}</span>
                </div>
              )}
              
              {room.rent && (
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <DollarSignIcon className="w-3 h-3" />
                  <span>₹{room.rent.toLocaleString()}/month</span>
                </div>
              )}

              {room.amenities && room.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {room.amenities.slice(0, 4).map(amenity => (
                    <span 
                      key={amenity}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs"
                      title={amenity}
                    >
                      {amenityIcons[amenity as keyof typeof amenityIcons] || <InfoIcon className="w-3 h-3" />}
                      <span className="truncate max-w-16">{amenity}</span>
                    </span>
                  ))}
                  {room.amenities.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                      +{room.amenities.length - 4} more
                    </span>
                  )}
                </div>
              )}

              {student?.preferences && compatibilityScore > 0 && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-600">Compatibility:</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${
                          compatibilityScore >= 80 ? 'bg-green-500' :
                          compatibilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${compatibilityScore}%` }}
                      />
                    </div>
                    <span className="font-medium text-gray-700">{compatibilityScore}%</span>
                  </div>
                </div>
              )}

              {room.occupants && room.occupants.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 mb-1">Current occupants:</p>
                  <div className="flex flex-wrap gap-1">
                    {room.occupants.map(occupant => (
                      <span 
                        key={occupant.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {occupant.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="ml-4">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            availableSpots > 0
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {availableSpots > 0 ? `${availableSpots} available` : 'Full'}
          </span>
        </div>
      </div>
    </div>
  );
});

RoomCard.displayName = 'RoomCard';

// Student preferences component
const StudentPreferences = memo(({ student }: { student: Student }) => {
  if (!student?.preferences) return null;

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
        <StarIcon className="w-4 h-4" />
        <span>Student Preferences</span>
      </h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {student.preferences.roomType && (
          <div>
            <span className="text-blue-700 font-medium">Room Type:</span>
            <p className="text-blue-600 capitalize">{student.preferences.roomType.replace('-', ' ')}</p>
          </div>
        )}
        {student.preferences.floor && (
          <div>
            <span className="text-blue-700 font-medium">Preferred Floor:</span>
            <p className="text-blue-600">{student.preferences.floor}</p>
          </div>
        )}
        {student.preferences.maxRent && (
          <div>
            <span className="text-blue-700 font-medium">Max Rent:</span>
            <p className="text-blue-600">₹{student.preferences.maxRent.toLocaleString()}</p>
          </div>
        )}
        {student.preferences.amenities && student.preferences.amenities.length > 0 && (
          <div className="col-span-2">
            <span className="text-blue-700 font-medium">Preferred Amenities:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {student.preferences.amenities.map(amenity => (
                <span key={amenity} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

StudentPreferences.displayName = 'StudentPreferences';

export const OptimizedRoomAssignmentModal = memo<OptimizedRoomAssignmentModalProps>(({
  isOpen,
  onClose,
  student,
  rooms,
  onAssign,
  onDeallocate,
  isReassignment = false,
  showAdvancedFilters = false,
  enablePreferences = false,
  showRoomDetails = false,
  allowBulkAssignment = false,
  onValidation,
  customValidationRules = []
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  
  // State management
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'roomNumber' | 'availability' | 'compatibility' | 'rent'>('roomNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filters state
  const [filters, setFilters] = useState<RoomFilters>({
    block: 'all',
    floor: 'all',
    roomType: 'all',
    minCapacity: '',
    maxCapacity: '',
    maxRent: '',
    availableOnly: true,
    hasAmenities: [],
    searchQuery: ''
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedRoomId('');
      setError('');
      setValidationErrors([]);
      setFilters(prev => ({ ...prev, availableOnly: true }));
    }
  }, [isOpen]);

  // Filter and sort rooms
  const filteredAndSortedRooms = useMemo(() => {
    let filtered = rooms.filter(room => {
      // Basic availability filter
      const hasAvailability = room.capacity > room.occupied;
      if (filters.availableOnly && !hasAvailability) return false;

      // Block filter
      if (filters.block !== 'all' && room.block !== filters.block) return false;

      // Floor filter
      if (filters.floor !== 'all' && room.floor?.toString() !== filters.floor) return false;

      // Room type filter
      if (filters.roomType !== 'all' && room.roomType !== filters.roomType) return false;

      // Capacity filters
      if (filters.minCapacity && room.capacity < parseInt(filters.minCapacity)) return false;
      if (filters.maxCapacity && room.capacity > parseInt(filters.maxCapacity)) return false;

      // Rent filter
      if (filters.maxRent && room.rent && room.rent > parseFloat(filters.maxRent)) return false;

      // Amenities filter
      if (filters.hasAmenities.length > 0) {
        const hasRequiredAmenities = filters.hasAmenities.every(amenity =>
          room.amenities?.includes(amenity)
        );
        if (!hasRequiredAmenities) return false;
      }

      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = `${room.roomNumber} ${room.block || ''} ${room.description || ''}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      return true;
    });

    // Sort rooms
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'roomNumber':
          aValue = a.roomNumber;
          bValue = b.roomNumber;
          break;
        case 'availability':
          aValue = a.capacity - a.occupied;
          bValue = b.capacity - b.occupied;
          break;
        case 'compatibility':
          // Calculate compatibility score for sorting
          aValue = calculateCompatibilityScore(a);
          bValue = calculateCompatibilityScore(b);
          break;
        case 'rent':
          aValue = a.rent || 0;
          bValue = b.rent || 0;
          break;
        default:
          aValue = a.roomNumber;
          bValue = b.roomNumber;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [rooms, filters, sortBy, sortOrder]);

  // Calculate compatibility score
  const calculateCompatibilityScore = useCallback((room: Room): number => {
    if (!student?.preferences) return 0;
    
    let score = 0;
    let maxScore = 0;

    if (student.preferences.roomType) {
      maxScore += 3;
      if (room.roomType === student.preferences.roomType) score += 3;
    }

    if (student.preferences.floor && room.floor) {
      maxScore += 2;
      if (room.floor === student.preferences.floor) score += 2;
    }

    if (student.preferences.maxRent && room.rent) {
      maxScore += 2;
      if (room.rent <= student.preferences.maxRent) score += 2;
    }

    if (student.preferences.amenities?.length && room.amenities?.length) {
      maxScore += 3;
      const matchedAmenities = student.preferences.amenities.filter(
        amenity => room.amenities?.includes(amenity)
      );
      score += (matchedAmenities.length / student.preferences.amenities.length) * 3;
    }

    return maxScore > 0 ? (score / maxScore) * 100 : 0;
  }, [student?.preferences]);

  // Get recommended rooms based on preferences
  const recommendedRooms = useMemo(() => {
    if (!enablePreferences || !student?.preferences) return [];
    
    return filteredAndSortedRooms
      .filter(room => calculateCompatibilityScore(room) >= 70)
      .slice(0, 3);
  }, [filteredAndSortedRooms, calculateCompatibilityScore, enablePreferences, student?.preferences]);

  // Validation
  const validateAssignment = useCallback(async (studentId: string, roomId: string): Promise<string[]> => {
    const errors: string[] = [];
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) {
      errors.push('Selected room not found');
      return errors;
    }

    if (!student) {
      errors.push('No student selected');
      return errors;
    }

    // Check room availability
    if (room.occupied >= room.capacity) {
      errors.push('Room is at full capacity');
    }

    // Check if room is active
    if (room.isActive === false) {
      errors.push('Room is currently inactive');
    }

    // Check custom validation rules
    for (const rule of customValidationRules) {
      if (!rule.rule(student, room)) {
        errors.push(rule.message);
      }
    }

    // External validation
    if (onValidation) {
      try {
        const isValid = await onValidation(studentId, roomId);
        if (!isValid) {
          errors.push('Assignment validation failed');
        }
      } catch (err) {
        errors.push('Validation check failed');
      }
    }

    return errors;
  }, [rooms, student, customValidationRules, onValidation]);

  // Handle room selection
  const handleRoomSelect = useCallback(async (roomId: string) => {
    setSelectedRoomId(roomId);
    setValidationErrors([]);

    if (student) {
      const errors = await validateAssignment(student.id, roomId);
      setValidationErrors(errors);
    }
  }, [student, validateAssignment]);

  // Handle assignment
  const handleAssign = useCallback(async () => {
    if (!selectedRoomId || !student) {
      setError('Please select a room');
      return;
    }

    const errors = await validateAssignment(student.id, selectedRoomId);
    if (errors.length > 0) {
      setValidationErrors(errors);
      setError('Please resolve validation errors before proceeding');
      return;
    }

    setLoading(true);
    try {
      // If this is a reassignment, deallocate first
      if (isReassignment && onDeallocate && student.allocations) {
        const activeAllocation = student.allocations.find(
          allocation => allocation.status === 'active'
        );
        if (activeAllocation) {
          await onDeallocate(activeAllocation.id);
        }
      }

      // Assign the new room
      const assignmentData = {
        assignmentDate: new Date().toISOString(),
        preferences: student.preferences,
        roomDetails: rooms.find(r => r.id === selectedRoomId)
      };

      await onAssign({
        studentId: student.id,
        roomId: selectedRoomId,
        assignmentData
      });

      toast.success(
        isReassignment ? 'Room reassigned successfully' : 'Room assigned successfully'
      );
      onClose();
    } catch (err) {
      console.error('Assignment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign room');
    } finally {
      setLoading(false);
    }
  }, [selectedRoomId, student, validateAssignment, isReassignment, onDeallocate, onAssign, rooms, onClose]);

  // Handle filter change
  const handleFilterChange = useCallback((key: keyof RoomFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      block: 'all',
      floor: 'all',
      roomType: 'all',
      minCapacity: '',
      maxCapacity: '',
      maxRent: '',
      availableOnly: true,
      hasAmenities: [],
      searchQuery: ''
    });
  }, []);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const blocks = Array.from(new Set(rooms.map(r => r.block).filter(Boolean))) as string[];
    const floors = Array.from(new Set(rooms.map(r => r.floor).filter(Boolean))) as number[];
    
    return { blocks, floors };
  }, [rooms]);

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-0 sm:p-4">
      <div className="relative top-0 sm:top-10 mx-auto p-4 sm:p-6 border-0 sm:border w-full h-full sm:h-auto max-w-none sm:max-w-4xl shadow-none sm:shadow-lg rounded-none sm:rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <HomeIcon className="w-5 h-5" />
            <h3 className="text-xl font-bold text-gray-900">
              {isReassignment ? 'Reassign Room to Student' : 'Assign Room to Student'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Student Info & Filters */}
          <div className="space-y-6">
            {/* Student Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>Student Information</span>
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-600">{student.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-600">{student.email}</p>
                </div>
                {student.course && (
                  <div>
                    <span className="font-medium text-gray-700">Course:</span>
                    <p className="text-gray-600">{student.course}</p>
                  </div>
                )}
                {student.year && (
                  <div>
                    <span className="font-medium text-gray-700">Year:</span>
                    <p className="text-gray-600">{student.year}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Current Room (for reassignment) */}
            {isReassignment && student.allocations && (
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-3 flex items-center space-x-2">
                  <AlertTriangleIcon className="w-4 h-4" />
                  <span>Current Room</span>
                </h4>
                {student.allocations
                  .filter(allocation => allocation.status === 'active')
                  .map(allocation => (
                    <div key={allocation.id} className="text-sm">
                      <p className="text-orange-800">
                        Room {allocation.room.roomNumber}
                        {allocation.room.block && ` (Block ${allocation.room.block})`}
                      </p>
                      {allocation.startDate && (
                        <p className="text-orange-600 text-xs mt-1">
                          Since: {new Date(allocation.startDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* Student Preferences */}
            {enablePreferences && <StudentPreferences student={student} />}

            {/* Filters */}
            {showAdvancedFilters && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <FilterIcon className="w-4 h-4" />
                    <span>Filters</span>
                  </h4>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </button>
                </div>

                {showFilters && (
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search rooms..."
                        value={filters.searchQuery}
                        onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Block Filter */}
                    <select
                      value={filters.block}
                      onChange={(e) => handleFilterChange('block', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Blocks</option>
                      {filterOptions.blocks.map(block => (
                        <option key={block} value={block}>{block}</option>
                      ))}
                    </select>

                    {/* Floor Filter */}
                    <select
                      value={filters.floor}
                      onChange={(e) => handleFilterChange('floor', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Floors</option>
                      {filterOptions.floors.map(floor => (
                        <option key={floor} value={floor}>Floor {floor}</option>
                      ))}
                    </select>

                    {/* Room Type Filter */}
                    <select
                      value={filters.roomType}
                      onChange={(e) => handleFilterChange('roomType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Room Types</option>
                      {ROOM_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>

                    {/* Max Rent Filter */}
                    <Input
                      type="number"
                      placeholder="Max rent"
                      value={filters.maxRent}
                      onChange={(e) => handleFilterChange('maxRent', e.target.value)}
                      className="text-sm"
                    />

                    {/* Available Only Toggle */}
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.availableOnly}
                        onChange={(e) => handleFilterChange('availableOnly', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Available rooms only</span>
                    </label>

                    <button
                      onClick={handleClearFilters}
                      className="w-full text-sm text-gray-600 hover:text-gray-800 py-2"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Room Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sort and Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="roomNumber">Room Number</option>
                    <option value="availability">Availability</option>
                    {enablePreferences && <option value="compatibility">Compatibility</option>}
                    <option value="rent">Rent</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {sortOrder === 'asc' ? <SortAscIcon className="w-4 h-4" /> : <SortDescIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {filteredAndSortedRooms.length} room{filteredAndSortedRooms.length !== 1 ? 's' : ''} found
              </div>
            </div>

            {/* Recommended Rooms */}
            {recommendedRooms.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <StarIcon className="w-4 h-4 text-green-500" />
                  <span>Recommended Rooms</span>
                </h4>
                <div className="space-y-3">
                  {recommendedRooms.map(room => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      student={student}
                      isSelected={selectedRoomId === room.id}
                      onSelect={handleRoomSelect}
                      showDetails={showRoomDetails}
                      isRecommended={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Rooms */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                <HomeIcon className="w-4 h-4" />
                <span>All Available Rooms</span>
              </h4>
              
              {filteredAndSortedRooms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <HomeIcon className="mx-auto h-12 w-12" />
                  </div>
                  <p className="text-gray-500 mb-2">No rooms found</p>
                  <p className="text-sm text-gray-400">
                    {filters.availableOnly ? 'Try adjusting your filters' : 'All rooms are currently occupied'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAndSortedRooms.map(room => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      student={student}
                      isSelected={selectedRoomId === room.id}
                      onSelect={handleRoomSelect}
                      showDetails={showRoomDetails}
                      isRecommended={recommendedRooms.some(r => r.id === room.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h5 className="font-medium text-red-900 mb-2 flex items-center space-x-2">
                  <XCircleIcon className="w-4 h-4" />
                  <span>Validation Errors</span>
                </h5>
                <ul className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start space-x-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 flex items-center space-x-2">
                  <AlertCircleIcon className="w-4 h-4" />
                  <span>{error}</span>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={loading || !selectedRoomId || validationErrors.length > 0}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRightIcon className="w-4 h-4" />
                )}
                <span>
                  {loading 
                    ? (isReassignment ? 'Reassigning...' : 'Assigning...') 
                    : (isReassignment ? 'Reassign Room' : 'Assign Room')
                  }
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedRoomAssignmentModal.displayName = 'OptimizedRoomAssignmentModal';

export default OptimizedRoomAssignmentModal;
