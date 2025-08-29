'use client'

// 🎯 SIMPLE ROOM FORM MODAL - ROOM MANAGEMENT ONLY
// ========================================================================
// ✅ ROOM CRUD - Create, Read, Update, Delete
// ✅ BASIC VALIDATION - Room number, capacity, block
// ✅ BACKEND COMPATIBLE - Only sends expected fields
// ✅ NO COMPLEX FEATURES - Focused on core functionality
// ========================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { 
  XIcon, 
  SaveIcon, 
  PlusIcon, 
  EditIcon, 
  HashIcon, 
  UsersIcon, 
  BuildingIcon,
  AlertCircleIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAdminApiWithHostel } from '@/lib/context-aware-api';
import toast from '@/lib/toast';

interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  block?: string;
}

interface RoomFormData {
  roomNumber: string;
  capacity: string;
  block: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface RoomFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: Room | null;
  mode?: 'create' | 'edit' | 'view';
  hostelBlocks?: string[];
  existingRooms?: Room[];
  adminApi: any; // Using regular adminApi
  hostelId: string; // Add hostelId prop
  onSuccess?: () => void;
}

// Simple form field component
const FormField = ({ 
  label, 
  required = false, 
  error, 
  children, 
  helpText,
  icon 
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  helpText?: string;
  icon?: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
      {icon}
      <span>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
    </label>
    {children}
    {error && (
      <div className="flex items-center space-x-1 text-sm text-red-600">
        <AlertCircleIcon className="w-4 h-4" />
        <span>{error}</span>
      </div>
    )}
    {helpText && !error && (
      <p className="text-xs text-gray-500">{helpText}</p>
    )}
  </div>
);

export const RoomFormModal = ({
  isOpen,
  onClose,
  room,
  mode = 'create',
  hostelBlocks = [],
  existingRooms = [],
  adminApi,
  hostelId,
  onSuccess
}: RoomFormModalProps) => {

  // Form state
  const [formData, setFormData] = useState<RoomFormData>({
    roomNumber: '',
    capacity: '',
    block: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (room && (mode === 'edit' || mode === 'view')) {
      setFormData({
        roomNumber: room.roomNumber,
        capacity: room.capacity.toString(),
        block: room.block || ''
      });
    } else if (mode === 'create') {
      setFormData({
        roomNumber: '',
        capacity: '',
        block: hostelBlocks[0] || ''
      });
    }
    setErrors({});
  }, [room, mode, hostelBlocks]);

  // Form validation
  const validateForm = useCallback((data: RoomFormData): ValidationError[] => {
    const validationErrors: ValidationError[] = [];

    if (!data.roomNumber.trim()) {
      validationErrors.push({ field: 'roomNumber', message: 'Room number is required' });
    } else {
      // Check for duplicate room numbers
      const fullRoomNumber = data.block ? `${data.block}-${data.roomNumber}` : data.roomNumber;
      const isDuplicate = existingRooms.some(r => 
        r.id !== room?.id && 
        (r.block ? `${r.block}-${r.roomNumber}` : r.roomNumber) === fullRoomNumber
      );
      if (isDuplicate) {
        validationErrors.push({ field: 'roomNumber', message: 'Room number already exists' });
      }
    }

    if (!data.capacity) {
      validationErrors.push({ field: 'capacity', message: 'Capacity is required' });
    } else {
      const capacity = parseInt(data.capacity);
      if (isNaN(capacity) || capacity < 1) {
        validationErrors.push({ field: 'capacity', message: 'Capacity must be a positive number' });
      } else if (capacity > 10) {
        validationErrors.push({ field: 'capacity', message: 'Capacity cannot exceed 10 students' });
      }
    }

    return validationErrors;
  }, [existingRooms, room?.id]);

  // Handle form data change
  const handleFormChange = useCallback((field: keyof RoomFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'view') return;

    const validationErrors = validateForm(formData);
    if (validationErrors.length > 0) {
      const errorMap = validationErrors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {} as Record<string, string>);
      setErrors(errorMap);
      toast.error('Please fix the validation errors');
      return;
    }

    setLoading(true);
    try {
      const submitData: Partial<Room> = {
        roomNumber: formData.roomNumber.trim(),
        capacity: parseInt(formData.capacity),
        block: formData.block.trim() || undefined
      };

      if (mode === 'create') {
        // Check if adminApi is wardenApi (no hostelId parameter) or regular adminApi
        if (adminApi.createRoom.length === 1) {
          // wardenApi pattern: createRoom(roomData)
          await adminApi.createRoom(submitData);
        } else {
          // adminApi pattern: createRoom(hostelId, roomData)
          await adminApi.createRoom(hostelId, submitData);
        }
        toast.success('Room created successfully');
      } else if (mode === 'edit' && room?.id) {
        // Check if adminApi is wardenApi (no hostelId parameter) or regular adminApi
        if (adminApi.updateRoom.length === 2) {
          // wardenApi pattern: updateRoom(roomId, updates)
          await adminApi.updateRoom(room.id, submitData);
        } else {
          // adminApi pattern: updateRoom(hostelId, roomId, updates)
          await adminApi.updateRoom(hostelId, room.id, submitData);
        }
        toast.success('Room updated successfully');
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save room. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, mode, validateForm, adminApi, room?.id, hostelId, onSuccess, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Modal title and icon
  const getTitleAndIcon = () => {
    switch (mode) {
      case 'edit':
        return { title: 'Edit Room', icon: <EditIcon className="w-5 h-5" /> };
      case 'view':
        return { title: 'View Room Details', icon: <EditIcon className="w-5 h-5" /> };
      default:
        return { title: 'Create New Room', icon: <PlusIcon className="w-5 h-5" /> };
    }
  };

  const { title, icon } = getTitleAndIcon();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            {icon}
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Room Number */}
          <FormField
            label="Room Number"
            required
            error={errors.roomNumber}
            helpText="Unique identifier for the room"
            icon={<HashIcon className="w-4 h-4" />}
          >
            <Input
              type="text"
              value={formData.roomNumber}
              onChange={(e) => handleFormChange('roomNumber', e.target.value)}
              placeholder="e.g., 101, 201"
              className="w-full"
              disabled={mode === 'view'}
              required
            />
          </FormField>

          {/* Capacity */}
          <FormField
            label="Capacity"
            required
            error={errors.capacity}
            helpText="Maximum number of students"
            icon={<UsersIcon className="w-4 h-4" />}
          >
            <Input
              type="number"
              min="1"
              max="10"
              value={formData.capacity}
              onChange={(e) => handleFormChange('capacity', e.target.value)}
              placeholder="Enter capacity"
              className="w-full"
              disabled={mode === 'view'}
              required
            />
          </FormField>

          {/* Block */}
          <FormField
            label="Block"
            error={errors.block}
            helpText="Building or block identifier (optional)"
            icon={<BuildingIcon className="w-4 h-4" />}
          >
            {hostelBlocks.length > 0 ? (
              <select
                value={formData.block}
                onChange={(e) => handleFormChange('block', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={mode === 'view'}
              >
                <option value="">Select Block</option>
                {hostelBlocks.map(block => (
                  <option key={block} value={block}>{block}</option>
                ))}
              </select>
            ) : (
              <Input
                type="text"
                value={formData.block}
                onChange={(e) => handleFormChange('block', e.target.value)}
                placeholder="e.g., A, B, North Wing"
                disabled={mode === 'view'}
              />
            )}
          </FormField>

          {/* Form Actions */}
          {mode !== 'view' && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <SaveIcon className="w-4 h-4" />
                )}
                <span>
                  {loading ? 'Saving...' : (
                    mode === 'create' ? 'Create Room' : 'Update Room'
                  )}
                </span>
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default RoomFormModal;
