'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { UserIcon, UsersIcon } from 'lucide-react';

interface VisitorFormProps {
  hasRoom: boolean;
  initialData?: { visitorName: string; relation: string };
  isEditing?: boolean;
  onSubmit: (data: { visitorName: string; relation: string }) => void;
  onCancel: () => void;
}

export function VisitorForm({
  hasRoom,
  initialData,
  isEditing = false,
  onSubmit,
  onCancel
}: VisitorFormProps) {
  const [formData, setFormData] = useState({
    visitorName: '',
    relation: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Visitor name is required';
    } else if (formData.visitorName.trim().length < 2) {
      newErrors.visitorName = 'Visitor name must be at least 2 characters';
    } else if (formData.visitorName.trim().length > 50) {
      newErrors.visitorName = 'Visitor name must be less than 50 characters';
    }
    
    if (!formData.relation.trim()) {
      newErrors.relation = 'Relation is required';
    } else if (formData.relation.trim().length < 2) {
      newErrors.relation = 'Relation must be at least 2 characters';
    } else if (formData.relation.trim().length > 30) {
      newErrors.relation = 'Relation must be less than 30 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // If student doesn't have a room, show message instead of form
  if (!hasRoom) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <UsersIcon className="h-16 w-16 mx-auto text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Room Allocated</h3>
        <p className="text-gray-600 mb-4">
          You need to have a room allocated before you can register visitors.
        </p>
        <p className="text-sm text-gray-500">
          Please contact your hostel administrator to get assigned a room.
        </p>
        <Button onClick={onCancel} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700 mb-1">
          Visitor Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UserIcon size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            id="visitorName" 
            name="visitorName" 
            value={formData.visitorName} 
            onChange={handleChange} 
            className={`pl-10 block w-full rounded-md border ${errors.visitorName ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} 
            placeholder="Full Name" 
            maxLength={50}
          />
        </div>
        {errors.visitorName && <p className="mt-1 text-sm text-red-600">{errors.visitorName}</p>}
        <p className="mt-1 text-xs text-gray-500">{formData.visitorName.length}/50 characters</p>
      </div>

      <div>
        <label htmlFor="relation" className="block text-sm font-medium text-gray-700 mb-1">
          Relation to You
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UsersIcon size={18} className="text-gray-400" />
          </div>
          <select 
            id="relation" 
            name="relation" 
            value={formData.relation} 
            onChange={handleChange} 
            className={`pl-10 block w-full rounded-md border ${errors.relation ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">Select relation</option>
            <option value="Family">Family</option>
            <option value="Friend">Friend</option>
            <option value="Relative">Relative</option>
            <option value="Colleague">Colleague</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {errors.relation && <p className="mt-1 text-sm text-red-600">{errors.relation}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Visitor' : 'Register Visitor'}
        </Button>
      </div>
    </form>
  );
}