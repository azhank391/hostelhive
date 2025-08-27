'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { UserIcon, MailIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@/components/ui/icons'

interface WardenFormData {
  name: string
  email: string
  password?: string
  confirmPassword?: string
}

interface WardenFormProps {
  onSubmit: (data: WardenFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  initialData?: {
    name: string
    email: string
  }
  isEditMode?: boolean
}

export function WardenForm({ onSubmit, onCancel, isLoading = false, initialData, isEditMode = false }: WardenFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      password: '',
      confirmPassword: ''
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



        {/* Password Field - Always show, but with different behavior in edit mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password {isEditMode && <span className="text-gray-500 text-xs">(Leave blank to keep current)</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`pl-10 pr-10 block w-full rounded-md border ${errors.password ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
              autoComplete="new-password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-600"
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {/* Confirm Password Field - Always show */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className={`pl-10 pr-10 block w-full rounded-md border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              placeholder={isEditMode ? "Leave blank to keep current password" : "Confirm password"}
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
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
            <p>The warden will receive login credentials via email</p>
            <p>They can change their password after first login</p>
          </div>
        )}
      </form>
    </div>
  )
}