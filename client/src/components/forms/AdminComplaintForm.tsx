'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '../ui/Button';
import { AlertCircleIcon, MessageSquareIcon, HomeIcon, BuildingIcon } from 'lucide-react';

interface ComplaintFormData {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  hostelId: string;
  roomId?: string;
  status?: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedToId?: string;
  resolution?: string;
}

interface AdminComplaintFormProps {
  hostels: {
    id: string;
    name: string;
  }[];
  rooms?: {
    id: string;
    number: string;
    hostelId: string;
  }[];
  initialData?: ComplaintFormData;
  staff?: {
    id: string;
    name: string;
    role: string;
  }[];
  onSubmit: (data: ComplaintFormData) => void;
  onCancel: () => void;
  isEditMode?: boolean;
}

export const AdminComplaintForm = React.memo(({
  hostels,
  rooms = [],
  initialData,
  staff = [],
  onSubmit,
  onCancel,
  isEditMode = false
}: AdminComplaintFormProps) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'Medium',
    hostelId: initialData?.hostelId || hostels[0]?.id || '',
    roomId: initialData?.roomId || '',
    status: initialData?.status || 'Open',
    assignedToId: initialData?.assignedToId || '',
    resolution: initialData?.resolution || ''
  });
  const [filteredRooms, setFilteredRooms] = useState<typeof rooms>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoized filtered rooms for better performance
  const memoizedFilteredRooms = useMemo(() => {
    if (formData.hostelId) {
      return rooms.filter(room => room.hostelId === formData.hostelId);
    }
    return [];
  }, [rooms, formData.hostelId]);

  // Filter rooms when hostel changes - optimized with useEffect
  useEffect(() => {
    setFilteredRooms(memoizedFilteredRooms);
    
    // If current room is not in this hostel, reset it
    if (formData.roomId && !memoizedFilteredRooms.some(r => r.id === formData.roomId)) {
      setFormData(prev => ({
        ...prev,
        roomId: ''
      }));
    }
  }, [memoizedFilteredRooms, formData.roomId]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  }, [formData, errors]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.hostelId) {
      newErrors.hostelId = 'Hostel is required';
    }
    if (isEditMode && formData.status === 'Resolved' && !formData.resolution.trim()) {
      newErrors.resolution = 'Resolution details are required when marking as resolved';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, isEditMode]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  }, [validate, onSubmit, formData]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Complaint Title
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <AlertCircleIcon size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            id="title" 
            name="title" 
            value={formData.title} 
            onChange={handleChange} 
            className={`pl-10 block w-full rounded-md border ${errors.title ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} 
            placeholder="Brief description of the issue" 
          />
        </div>
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <MessageSquareIcon size={18} className="text-gray-400" />
          </div>
          <textarea 
            id="description" 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            rows={4} 
            className={`pl-10 block w-full rounded-md border ${errors.description ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} 
            placeholder="Detailed description of the issue..." 
          />
        </div>
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="hostelId" className="block text-sm font-medium text-gray-700 mb-1">
            Hostel
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BuildingIcon size={18} className="text-gray-400" />
            </div>
            <select 
              id="hostelId" 
              name="hostelId" 
              value={formData.hostelId} 
              onChange={handleChange} 
              className={`pl-10 block w-full rounded-md border ${errors.hostelId ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Select a hostel</option>
              {hostels.map(hostel => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.name}
                </option>
              ))}
            </select>
          </div>
          {errors.hostelId && <p className="mt-1 text-sm text-red-600">{errors.hostelId}</p>}
        </div>
        <div>
          <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
            Room (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HomeIcon size={18} className="text-gray-400" />
            </div>
            <select 
              id="roomId" 
              name="roomId" 
              value={formData.roomId} 
              onChange={handleChange} 
              className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
              disabled={!formData.hostelId || filteredRooms.length === 0}
            >
              <option value="">Select a room</option>
              {filteredRooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.number}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select 
            id="priority" 
            name="priority" 
            value={formData.priority} 
            onChange={handleChange} 
            className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        {isEditMode && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select 
              id="status" 
              name="status" 
              value={formData.status} 
              onChange={handleChange} 
              className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        )}
      </div>

      {isEditMode && (
        <>
          <div>
            <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To (Optional)
            </label>
            <select 
              id="assignedToId" 
              name="assignedToId" 
              value={formData.assignedToId} 
              onChange={handleChange} 
              className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Unassigned</option>
              {staff.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name} ({person.role})
                </option>
              ))}
            </select>
          </div>
          {(formData.status === 'Resolved' || formData.status === 'Closed') && (
            <div>
              <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-1">
                Resolution
              </label>
              <textarea 
                id="resolution" 
                name="resolution" 
                value={formData.resolution} 
                onChange={handleChange} 
                rows={3} 
                className={`block w-full rounded-md border ${errors.resolution ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} 
                placeholder="Describe how the issue was resolved..." 
              />
              {errors.resolution && <p className="mt-1 text-sm text-red-600">{errors.resolution}</p>}
            </div>
          )}
        </>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditMode ? 'Update Complaint' : 'Submit Complaint'}
        </Button>
      </div>
    </form>
  );
});

AdminComplaintForm.displayName = 'AdminComplaintForm';
