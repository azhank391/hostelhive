'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { MapPinIcon, BuildingIcon, HomeIcon, BedIcon } from 'lucide-react';
interface HostelFormData {
  name: string;
  location: string;
  address: string;
  totalRooms: number;
  description: string;
  image: string;
}

interface HostelFormProps {
  initialData?: HostelFormData;
  onSubmit: (data: HostelFormData) => void;
  onCancel: () => void;
}
export function HostelForm({
  initialData,
  onSubmit,
  onCancel
}: HostelFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    location: initialData?.location || '',
    address: initialData?.address || '',
    totalRooms: initialData?.totalRooms || 0,
    description: initialData?.description || '',
    image: initialData?.image || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'totalRooms' ? parseInt(value) || 0 : value
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
    if (!formData.name.trim()) {
      newErrors.name = 'Hostel name is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (formData.totalRooms <= 0) {
      newErrors.totalRooms = 'Total rooms must be greater than 0';
    }
    if (!formData.image.trim()) {
      newErrors.image = 'Image URL is required';
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
  return <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Hostel Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BuildingIcon size={18} className="text-gray-400" />
          </div>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.name ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="Al-Hafeez Hostel" />
        </div>
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPinIcon size={18} className="text-gray-400" />
          </div>
          <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.location ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="Gulberg, Lahore" />
        </div>
        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Full Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HomeIcon size={18} className="text-gray-400" />
          </div>
          <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.address ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="123 Main Street, Gulberg III, Lahore" />
        </div>
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
      </div>
      <div>
        <label htmlFor="totalRooms" className="block text-sm font-medium text-gray-700 mb-1">
          Total Rooms
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BedIcon size={18} className="text-gray-400" />
          </div>
          <input type="number" id="totalRooms" name="totalRooms" min="1" value={formData.totalRooms} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.totalRooms ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="50" />
        </div>
        {errors.totalRooms && <p className="mt-1 text-sm text-red-600">{errors.totalRooms}</p>}
      </div>
      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
          Image URL
        </label>
        <div className="relative">
          <input type="text" id="image" name="image" value={formData.image} onChange={handleChange} className={`block w-full rounded-md border ${errors.image ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="https://example.com/hostel-image.jpg" />
        </div>
        {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
        {formData.image && <div className="mt-2">
            <Image src={formData.image} alt="Hostel Preview" width={400} height={160} className="h-40 w-full object-cover rounded-md" onError={e => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
        }} />
          </div>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Describe your hostel..." />
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update Hostel' : 'Create Hostel'}
        </Button>
      </div>
    </form>;
}