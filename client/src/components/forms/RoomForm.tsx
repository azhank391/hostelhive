'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { HomeIcon, UsersIcon, BuildingIcon } from 'lucide-react';

interface RoomFormData {
  roomNumber: string;
  capacity: number;
  block?: string;
}

interface RoomFormProps {
  initialData?: RoomFormData;
  onSubmit: (data: RoomFormData) => void;
  onCancel: () => void;
}

export function RoomForm({
  initialData,
  onSubmit,
  onCancel
}: RoomFormProps) {
  const [formData, setFormData] = useState({
    roomNumber: initialData?.roomNumber || '',
    capacity: initialData?.capacity || 1,
    block: initialData?.block || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'capacity' ? parseInt(value) || 1 : value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
    }
    
    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Room Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HomeIcon size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            id="roomNumber" 
            name="roomNumber" 
            value={formData.roomNumber} 
            onChange={handleChange} 
            className={`pl-10 block w-full rounded-md border ${errors.roomNumber ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} 
            placeholder="101" 
          />
        </div>
        {errors.roomNumber && <p className="mt-1 text-sm text-red-600">{errors.roomNumber}</p>}
      </div>

      <div>
        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
          Capacity
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UsersIcon size={18} className="text-gray-400" />
          </div>
          <input 
            type="number" 
            id="capacity" 
            name="capacity" 
            min="1" 
            value={formData.capacity} 
            onChange={handleChange} 
            className={`pl-10 block w-full rounded-md border ${errors.capacity ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} 
            placeholder="2" 
          />
        </div>
        {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
      </div>

      <div>
        <label htmlFor="block" className="block text-sm font-medium text-gray-700 mb-1">
          Block (Optional)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BuildingIcon size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            id="block" 
            name="block" 
            value={formData.block} 
            onChange={handleChange} 
            className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            placeholder="A, B, C..." 
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update Room' : 'Create Room'}
        </Button>
      </div>
    </form>
  );
}