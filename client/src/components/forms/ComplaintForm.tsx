'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { AlertCircleIcon, MessageSquareIcon } from 'lucide-react';

interface ComplaintFormProps {
  hasRoom: boolean;
  onSubmit: (data: { title: string; description: string; priority: string }) => void;
  onCancel: () => void;
  initialData?: { title: string; description: string; priority: string };
  isEditMode?: boolean;
}

export function ComplaintForm({
  hasRoom,
  onSubmit,
  onCancel,
  initialData,
  isEditMode = false
}: ComplaintFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'medium'
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
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

  // If student doesn't have a room, show message instead of form
  if (!hasRoom) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <AlertCircleIcon className="h-16 w-16 mx-auto text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Room Allocated</h3>
        <p className="text-gray-600 mb-4">
          You need to have a room allocated before you can lodge complaints.
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          {isEditMode ? 'Edit Complaint Title' : 'Complaint Title'}
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
          {isEditMode ? 'Edit Description' : 'Description'}
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

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
          {isEditMode ? 'Edit Priority' : 'Priority Level'}
        </label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className={`block w-full rounded-md border ${errors.priority ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        >
          <option value="low">Low - Minor issue, can wait</option>
          <option value="medium">Medium - Standard issue</option>
          <option value="high">High - Important issue</option>
          <option value="urgent">Urgent - Critical issue</option>
        </select>
        {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
      </div>

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
}