'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { UserIcon, PhoneIcon, MailIcon, MapPinIcon, GraduationCapIcon, HomeIcon } from 'lucide-react';

interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  university: string;
  guardianName: string;
  guardianPhone: string;
  hostelId: string;
  roomId?: string;
  image?: string;
}

interface StudentFormProps {
  hostels: {
    id: string;
    name: string;
  }[];
  rooms?: {
    id: string;
    number: string;
    hostelId: string;
  }[];
  initialData?: StudentFormData;
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
}

export const StudentForm = React.memo(({
  hostels,
  rooms = [],
  initialData,
  onSubmit,
  onCancel
}: StudentFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    university: initialData?.university || '',
    guardianName: initialData?.guardianName || '',
    guardianPhone: initialData?.guardianPhone || '',
    hostelId: initialData?.hostelId || hostels[0]?.id || '',
    roomId: initialData?.roomId || '',
    image: initialData?.image || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    if (!formData.university.trim()) {
      newErrors.university = 'University is required';
    }
    if (!formData.guardianName.trim()) {
      newErrors.guardianName = 'Guardian name is required';
    }
    if (!formData.guardianPhone.trim()) {
      newErrors.guardianPhone = 'Guardian phone is required';
    }
    if (!formData.hostelId) {
      newErrors.hostelId = 'Hostel is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  }, [validate, onSubmit, formData]);

  // Filter rooms based on selected hostel - memoized for performance
  const filteredRooms = useMemo(() => 
    rooms.filter(room => room.hostelId === formData.hostelId),
    [rooms, formData.hostelId]
  );
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon size={18} className="text-gray-400" />
            </div>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.name ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="Faisal Ahmed" />
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
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.email ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="student@example.com" />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon size={18} className="text-gray-400" />
            </div>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.phone ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="0300-1234567" />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
        <div>
          <label htmlFor="university" className="block text-sm font-medium text-gray-700 mb-1">
            University / Institute
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <GraduationCapIcon size={18} className="text-gray-400" />
            </div>
            <input type="text" id="university" name="university" value={formData.university} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.university ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="LUMS" />
          </div>
          {errors.university && <p className="mt-1 text-sm text-red-600">{errors.university}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Permanent Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPinIcon size={18} className="text-gray-400" />
          </div>
          <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.address ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="123 Main Street, City, Province" />
        </div>
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="guardianName" className="block text-sm font-medium text-gray-700 mb-1">
            Guardian Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon size={18} className="text-gray-400" />
            </div>
            <input type="text" id="guardianName" name="guardianName" value={formData.guardianName} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.guardianName ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="Parent/Guardian Name" />
          </div>
          {errors.guardianName && <p className="mt-1 text-sm text-red-600">{errors.guardianName}</p>}
        </div>
        <div>
          <label htmlFor="guardianPhone" className="block text-sm font-medium text-gray-700 mb-1">
            Guardian Phone
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon size={18} className="text-gray-400" />
            </div>
            <input type="tel" id="guardianPhone" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className={`pl-10 block w-full rounded-md border ${errors.guardianPhone ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`} placeholder="0300-7654321" />
          </div>
          {errors.guardianPhone && <p className="mt-1 text-sm text-red-600">{errors.guardianPhone}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="hostelId" className="block text-sm font-medium text-gray-700 mb-1">
            Hostel
          </label>
          <select id="hostelId" name="hostelId" value={formData.hostelId} onChange={handleChange} className={`block w-full rounded-md border ${errors.hostelId ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}>
            <option value="">Select a hostel</option>
            {hostels.map(hostel => <option key={hostel.id} value={hostel.id}>
                {hostel.name}
              </option>)}
          </select>
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
            <select id="roomId" name="roomId" value={formData.roomId} onChange={handleChange} className="pl-10 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" disabled={!formData.hostelId}>
              <option value="">Select a room</option>
              {filteredRooms.map(room => <option key={room.id} value={room.id}>
                  {room.number}
                </option>)}
            </select>
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
          Profile Image URL (Optional)
        </label>
        <input type="text" id="image" name="image" value={formData.image} onChange={handleChange} className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="https://example.com/profile.jpg" />
        {formData.image && <div className="mt-2">
            <Image src={formData.image} alt="Profile Preview" width={80} height={80} className="h-20 w-20 rounded-full object-cover mx-auto" onError={e => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x200?text=Profile';
        }} />
          </div>}
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update Student' : 'Register Student'}
        </Button>
      </div>
    </form>
  );
});

StudentForm.displayName = 'StudentForm';