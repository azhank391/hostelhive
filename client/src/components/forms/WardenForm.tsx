'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { UserIcon, MailIcon, PhoneIcon } from '@/components/ui/icons'

interface WardenFormData {
  name: string
  email: string
  phone?: string
}

interface WardenFormProps {
  onSubmit: (data: WardenFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  initialData?: {
    name: string
    email: string
    phone?: string
  }
  isEditMode?: boolean
}

export function WardenForm({ onSubmit, onCancel, isLoading = false, initialData, isEditMode = false }: WardenFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<WardenFormData>({
    mode: 'onBlur',
    defaultValues: initialData ? {
      name: initialData.name,
      email: initialData.email,
      phone: initialData.phone || ''
    } : undefined
  })

  const handleFormSubmit = async (data: WardenFormData) => {
    try {
      await onSubmit(data)
      reset()
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className={`pl-10 block w-full rounded-md border ${errors.name ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Enter warden's full name"
              autoComplete="name"
              {...register('name')}
            />
          </div>
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MailIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              className={`pl-10 block w-full rounded-md border ${errors.email ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Enter warden's email"
              autoComplete="email"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        {/* Phone Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              className={`pl-10 block w-full rounded-md border ${errors.phone ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Enter phone number"
              autoComplete="tel"
              {...register('phone')}
            />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={!isValid || isLoading}
            className="flex-1"
          >
            {isLoading ? (isEditMode ? 'Updating Warden...' : 'Adding Warden...') : (isEditMode ? 'Update Warden' : 'Add Warden')}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        {/* Help Text */}
        {!isEditMode && (
          <div className="text-xs text-gray-500 text-center">
            <p>A default password (123456) will be automatically set</p>
            <p>The warden will be prompted to change it on first login</p>
          </div>
        )}
      </form>
    </div>
  )
}