'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { BuildingIcon, MapPinIcon, MailIcon } from 'lucide-react';

interface EditHostelFormProps {
  initialData: {
    id: string;
    name: string;
    email: string;
    location?: {
      country?: string;
      city?: string;
      address?: string;
    };
  } | null;
  onSubmit: (data: {
    name: string;
    email: string;
    location: {
      country?: string;
      city?: string;
      address?: string;
    };
  }) => void;
  onCancel: () => void;
}

export function EditHostelForm({
  initialData,
  onSubmit,
  onCancel
}: EditHostelFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    location: {
      country: initialData?.location?.country || '',
      city: initialData?.location?.city || '',
      address: initialData?.location?.address || ''
    }
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [field]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
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
    if (!formData.name.trim()) { newErrors.name = 'Hostel name is required'; }
    if (!formData.email.trim()) { newErrors.email = 'Email is required'; } else if (!/\S+@\S+\.\S+/.test(formData.email)) { newErrors.email = 'Please enter a valid email address'; }
    // City and country are optional in the database, so no validation needed
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Hostel Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BuildingIcon size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            className={`pl-10 block w-full rounded-md border ${errors.name ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} 
            placeholder="Enter hostel name" 
          />
        </div>
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MailIcon size={18} className="text-gray-400" />
          </div>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            className={`pl-10 block w-full rounded-md border ${errors.email ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} 
            placeholder="hostel@example.com" 
          />
        </div>
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location.city" className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-gray-500">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPinIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="location.city"
              name="location.city"
              value={formData.location.city}
              onChange={handleChange}
              className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter city"
            />
          </div>
          {errors['location.city'] && <p className="mt-1 text-sm text-red-600">{errors['location.city']}</p>}
        </div>
        <div>
          <label htmlFor="location.country" className="block text-sm font-medium text-gray-700 mb-1">
            Country <span className="text-gray-500">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPinIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="location.country"
              name="location.country"
              value={formData.location.country}
              onChange={handleChange}
              className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter country"
            />
          </div>
          {errors['location.country'] && <p className="mt-1 text-sm text-red-600">{errors['location.country']}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="location.address" className="block text-sm font-medium text-gray-700 mb-1">
          Address <span className="text-gray-500">(Optional)</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPinIcon size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            id="location.address" 
            name="location.address" 
            value={formData.location.address} 
            onChange={handleChange} 
            className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Enter address" 
          />
        </div>
        {errors['location.address'] && (
          <p className="mt-1 text-sm text-red-600">{errors['location.address']}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Update Hostel
        </Button>
      </div>
    </form>
  );
}
