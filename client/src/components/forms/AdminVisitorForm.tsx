'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { UserIcon, MapPinIcon, ClockIcon } from '@/components/ui/icons';

interface Student {
  id: string;
  name: string;
}

interface VisitorFormData {
  studentId: string;
  visitorName: string;
  relation: string;
  checkIn: string;
}

interface AdminVisitorFormProps {
  students: Student[];
  onSubmit: (data: VisitorFormData) => void;
  onCancel: () => void;
  initialData?: Partial<VisitorFormData>;
  isEditMode?: boolean;
}

export function AdminVisitorForm({
  students,
  onSubmit,
  onCancel,
  initialData
}: AdminVisitorFormProps) {
  const [formData, setFormData] = useState<VisitorFormData>({
    studentId: initialData?.studentId || '',
    visitorName: initialData?.visitorName || '',
    relation: initialData?.relation || '',
    checkIn: initialData?.checkIn || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Visitor name is required';
    }
    if (!formData.studentId) {
      newErrors.studentId = 'Student selection is required';
    }
    if (!formData.relation.trim()) {
      newErrors.relation = 'Relation is required';
    }
    if (!formData.checkIn) {
      newErrors.checkIn = 'Check-in time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="visitorName" className="block text-sm font-medium text-gray-700 mb-1">
            Visitor Name *
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
            />
          </div>
          {errors.visitorName && <p className="mt-1 text-sm text-red-600">{errors.visitorName}</p>}
        </div>

        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
            Visiting Student *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPinIcon size={18} className="text-gray-400" />
            </div>
            <select 
              id="studentId" 
              name="studentId" 
              value={formData.studentId} 
              onChange={handleChange} 
              className={`pl-10 block w-full rounded-md border ${errors.studentId ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Select student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
          {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
        </div>

        <div>
          <label htmlFor="relation" className="block text-sm font-medium text-gray-700 mb-1">
            Relation *
          </label>
          <select 
            id="relation" 
            name="relation" 
            value={formData.relation} 
            onChange={handleChange} 
            className={`block w-full rounded-md border ${errors.relation ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">Select relation</option>
            <option value="Family">Family</option>
            <option value="Friend">Friend</option>
            <option value="Colleague">Colleague</option>
            <option value="Other">Other</option>
          </select>
          {errors.relation && <p className="mt-1 text-sm text-red-600">{errors.relation}</p>}
        </div>

        <div>
          <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700 mb-1">
            Check-In Time *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ClockIcon size={18} className="text-gray-400" />
            </div>
            <input 
              type="datetime-local" 
              id="checkIn" 
              name="checkIn" 
              value={formData.checkIn} 
              onChange={handleChange} 
              className={`pl-10 block w-full rounded-md border ${errors.checkIn ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} 
            />
          </div>
          {errors.checkIn && <p className="mt-1 text-sm text-red-600">{errors.checkIn}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update Visitor' : 'Register Visitor'}
        </Button>
      </div>
    </form>
  );
}
