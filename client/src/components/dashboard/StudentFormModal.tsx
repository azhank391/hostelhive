'use client'

import React, { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  XIcon, 
  UserIcon, 
  MailIcon, 
  LockIcon, 
  EyeIcon, 
  EyeOffIcon,
  SaveIcon,
  UserPlusIcon,
  EditIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  CameraIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  RefreshCwIcon,
  CopyIcon,
  ShuffleIcon,
  KeyIcon,
  UsersIcon
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useHostel } from '@/context/HostelContext';
import  toast  from '@/lib/toast';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  hostelId?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  avatar?: string;
  course?: string;
  year?: number;
  rollNumber?: string;
  parentInfo?: {
    fatherName?: string;
    motherName?: string;
    parentPhone?: string;
    parentEmail?: string;
  };
  isActive?: boolean;
  joinDate?: string;
  password?: string;
}

interface StudentFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  course: string;
  year: string;
  rollNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  fatherName: string;
  motherName: string;
  parentPhone: string;
  parentEmail: string;
  avatar: string;
  isActive: boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

interface OptimizedStudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  onSubmit: (data: Partial<Student>) => Promise<void>;
  mode?: 'create' | 'edit' | 'view' | 'profile';
  showAdvancedFields?: boolean;
  autoSave?: boolean;
  onValidationError?: (errors: ValidationError[]) => void;
  onFormChange?: (data: StudentFormData, isValid: boolean) => void;
  existingStudents?: Student[];
  allowDuplicateEmails?: boolean;
}

// Predefined courses
const COURSES = [
  'Computer Science Engineering',
  'Information Technology',
  'Electronics and Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Business Administration',
  'Commerce',
  'Arts',
  'Science',
  'Medicine',
  'Law',
  'Other'
];

const RELATIONSHIPS = [
  'Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 
  'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other'
];

const ACADEMIC_YEARS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
  { value: '5', label: '5th Year' }
];

// Memoized form field component
const FormField = memo(({ 
  label, 
  required = false, 
  error, 
  children, 
  helpText,
  icon,
  className = ''
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  helpText?: string;
  icon?: React.ReactNode;
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
      {icon}
      <span>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
    </label>
    {children}
    {error && (
      <div className="flex items-center space-x-1 text-sm text-red-600">
        <AlertCircleIcon className="w-4 h-4" />
        <span>{error}</span>
      </div>
    )}
    {helpText && !error && (
      <p className="text-xs text-gray-500">{helpText}</p>
    )}
  </div>
));

FormField.displayName = 'FormField';

// Password strength component
const PasswordStrength = memo(({ password }: { password: string }) => {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strengthMap = {
      0: { label: 'Very Weak', color: 'bg-red-500' },
      1: { label: 'Weak', color: 'bg-red-400' },
      2: { label: 'Fair', color: 'bg-yellow-500' },
      3: { label: 'Good', color: 'bg-blue-500' },
      4: { label: 'Strong', color: 'bg-green-500' },
      5: { label: 'Very Strong', color: 'bg-green-600' }
    };

    return { score, ...strengthMap[score as keyof typeof strengthMap] };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600">{strength.label}</span>
      </div>
    </div>
  );
});

PasswordStrength.displayName = 'PasswordStrength';

// Avatar uploader component
const AvatarUploader = memo(({ 
  currentAvatar, 
  onAvatarChange,
  disabled = false 
}: {
  currentAvatar?: string;
  onAvatarChange: (avatar: string) => void;
  disabled?: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64 for demo (in real app, upload to cloud storage)
      const reader = new FileReader();
      reader.onload = (e) => {
        onAvatarChange(e.target?.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
      setUploading(false);
    }
  }, [onAvatarChange]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div className="flex items-center space-x-4">
      <div 
        className={`relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden ${
          !disabled ? 'cursor-pointer hover:border-blue-400' : 'cursor-not-allowed opacity-50'
        }`}
        onClick={handleClick}
      >
        {uploading ? (
          <RefreshCwIcon className="w-6 h-6 text-gray-400 animate-spin" />
        ) : currentAvatar ? (
          <img 
            src={currentAvatar} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <CameraIcon className="w-6 h-6 text-gray-400" />
        )}
        {!disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-full flex items-center justify-center">
            <CameraIcon className="w-5 h-5 text-white opacity-0 hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">Profile Photo</p>
        <p className="text-xs text-gray-500">
          Click to upload a photo (Max 5MB, JPG/PNG)
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
});

AvatarUploader.displayName = 'AvatarUploader';

export const OptimizedStudentFormModal = memo<OptimizedStudentFormModalProps>(({
  isOpen,
  onClose,
  student,
  onSubmit,
  mode = 'create',
  showAdvancedFields = false,
  autoSave = false,
  onValidationError,
  onFormChange,
  existingStudents = [],
  allowDuplicateEmails = false
}) => {
  // const { selectedHostel } = useHostel();
  const formRef = useRef<HTMLFormElement>(null);

  // Form state
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    course: '',
    year: '',
    rollNumber: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    fatherName: '',
    motherName: '',
    parentPhone: '',
    parentEmail: '',
    avatar: '',
    isActive: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'academic' | 'family'>('basic');

  // Initialize form data
  useEffect(() => {
    if (student && (mode === 'edit' || mode === 'view' || mode === 'profile')) {
      const initialData: StudentFormData = {
        name: student.name || '',
        email: student.email || '',
        password: '',
        confirmPassword: '',
        phone: student.phone || '',
        dateOfBirth: student.dateOfBirth || '',
        address: student.address || '',
        course: student.course || '',
        year: student.year?.toString() || '',
        rollNumber: student.rollNumber || '',
        emergencyContactName: student.emergencyContact?.name || '',
        emergencyContactPhone: student.emergencyContact?.phone || '',
        emergencyContactRelationship: student.emergencyContact?.relationship || '',
        fatherName: student.parentInfo?.fatherName || '',
        motherName: student.parentInfo?.motherName || '',
        parentPhone: student.parentInfo?.parentPhone || '',
        parentEmail: student.parentInfo?.parentEmail || '',
        avatar: student.avatar || '',
        isActive: student.isActive !== false
      };
      setFormData(initialData);
      setHasChanges(false);
    } else {
      const defaultData: StudentFormData = {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        course: '',
        year: '1',
        rollNumber: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: 'Father',
        fatherName: '',
        motherName: '',
        parentPhone: '',
        parentEmail: '',
        avatar: '',
        isActive: true
      };
      setFormData(defaultData);
      setHasChanges(false);
    }
    setErrors({});
  }, [student, mode]);

  // Form validation
  const validateForm = useCallback((data: StudentFormData): ValidationError[] => {
    const validationErrors: ValidationError[] = [];

    // Basic validation
    if (!data.name.trim()) {
      validationErrors.push({ field: 'name', message: 'Name is required' });
    } else if (data.name.trim().length < 2) {
      validationErrors.push({ field: 'name', message: 'Name must be at least 2 characters' });
    }

    if (!data.email.trim()) {
      validationErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      validationErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    } else if (!allowDuplicateEmails) {
      const isDuplicate = existingStudents.some(s => 
        s.id !== student?.id && s.email.toLowerCase() === data.email.toLowerCase()
      );
      if (isDuplicate) {
        validationErrors.push({ field: 'email', message: 'Email already exists' });
      }
    }

    // Password validation for new students
    if (mode === 'create') {
      if (!data.password) {
        validationErrors.push({ field: 'password', message: 'Password is required' });
      } else if (data.password.length < 8) {
        validationErrors.push({ field: 'password', message: 'Password must be at least 8 characters' });
      }

      if (data.password !== data.confirmPassword) {
        validationErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
      }
    }

    // Phone validation
    if (data.phone && !/^\+?[\d\s-()]{10,15}$/.test(data.phone)) {
      validationErrors.push({ field: 'phone', message: 'Please enter a valid phone number' });
    }

    // Date of birth validation
    if (data.dateOfBirth) {
      const birthDate = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16 || age > 30) {
        validationErrors.push({ field: 'dateOfBirth', message: 'Age must be between 16 and 30' });
      }
    }

    // Emergency contact validation
    if (data.emergencyContactName && !data.emergencyContactPhone) {
      validationErrors.push({ field: 'emergencyContactPhone', message: 'Emergency contact phone is required when name is provided' });
    }

    // Parent email validation
    if (data.parentEmail && !/\S+@\S+\.\S+/.test(data.parentEmail)) {
      validationErrors.push({ field: 'parentEmail', message: 'Please enter a valid parent email' });
    }

    return validationErrors;
  }, [existingStudents, student?.id, allowDuplicateEmails, mode]);

  // Handle form data change
  const handleFormChange = useCallback((field: keyof StudentFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      setHasChanges(true);
      
      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors(prev => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
      }

      // Auto-fill parent phone from student phone if empty
      if (field === 'phone' && !updated.parentPhone) {
        updated.parentPhone = value;
      }

      // Auto-generate roll number format
      if (field === 'course' || field === 'year') {
        const courseCode = updated.course ? updated.course.substring(0, 3).toUpperCase() : '';
        const year = updated.year ? updated.year : '';
        if (courseCode && year && !updated.rollNumber) {
          const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          updated.rollNumber = `${year}${courseCode}${randomNum}`;
        }
      }

      // Validate form
      const validationErrors = validateForm(updated);
      const errorMap = validationErrors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {} as Record<string, string>);
      setErrors(errorMap);

      // Notify parent of form changes
      if (onFormChange) {
        onFormChange(updated, validationErrors.length === 0);
      }

      return updated;
    });
  }, [errors, validateForm, onFormChange]);

  // Generate strong password
  const generatePassword = useCallback(() => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    handleFormChange('password', password);
    handleFormChange('confirmPassword', password);
    toast.success('Strong password generated');
  }, [handleFormChange]);

  // Copy generated data
  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !hasChanges || mode === 'view') return;

    const autoSaveTimer = setTimeout(() => {
      const validationErrors = validateForm(formData);
      if (validationErrors.length === 0) {
        handleSubmit(new Event('submit') as any, true);
      }
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
  }, [formData, hasChanges, autoSave, mode, validateForm]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent, isAutoSave = false) => {
    e.preventDefault();
    
    if (mode === 'view') return;

    const validationErrors = validateForm(formData);
    
    if (validationErrors.length > 0) {
      const errorMap = validationErrors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {} as Record<string, string>);
      setErrors(errorMap);
      
      if (onValidationError) {
        onValidationError(validationErrors);
      }
      
      if (!isAutoSave) {
        toast.error('Please fix the validation errors');
      }
      return;
    }

    setLoading(true);
    try {
      const submitData: Partial<Student> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address.trim() || undefined,
        course: formData.course || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        rollNumber: formData.rollNumber.trim() || undefined,
        avatar: formData.avatar || undefined,
        isActive: formData.isActive,
        emergencyContact: formData.emergencyContactName ? {
          name: formData.emergencyContactName.trim(),
          phone: formData.emergencyContactPhone.trim(),
          relationship: formData.emergencyContactRelationship
        } : undefined,
        parentInfo: (formData.fatherName || formData.motherName || formData.parentPhone || formData.parentEmail) ? {
          fatherName: formData.fatherName.trim() || undefined,
          motherName: formData.motherName.trim() || undefined,
          parentPhone: formData.parentPhone.trim() || undefined,
          parentEmail: formData.parentEmail.trim() || undefined
        } : undefined
      };

      if (mode === 'create') {
        submitData.password = formData.password;
      } else if (formData.password) {
        submitData.password = formData.password;
      }

      await onSubmit(submitData);
      setHasChanges(false);
      
      if (!isAutoSave) {
        toast.success(
          mode === 'create' ? 'Student created successfully' : 'Student updated successfully'
        );
      }
    } catch (error) {
      console.error('Form submission error:', error);
      if (!isAutoSave) {
        toast.error('Failed to save student. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [formData, mode, validateForm, onSubmit, onValidationError]);

  // Handle close with unsaved changes warning
  const handleClose = useCallback(() => {
    if (hasChanges && mode !== 'view') {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasChanges, mode, onClose]);

  // Tab content
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'basic':
        return (
          <div className="space-y-6">
            {showAdvancedFields && (
              <FormField
                label="Profile Photo"
                helpText="Upload a profile photo (optional)"
              >
                <AvatarUploader
                  currentAvatar={formData.avatar}
                  onAvatarChange={(avatar) => handleFormChange('avatar', avatar)}
                  disabled={mode === 'view'}
                />
              </FormField>
            )}

            <FormField
              label="Full Name"
              required
              error={errors.name}
              helpText="Enter the student's complete name"
              icon={<UserIcon className="w-4 h-4" />}
            >
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Enter student's full name"
                disabled={mode === 'view'}
                required
              />
            </FormField>

            <FormField
              label="Email Address"
              required
              error={errors.email}
              helpText="This will be used for login and communication"
              icon={<MailIcon className="w-4 h-4" />}
            >
              <div className="flex space-x-2">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1"
                  disabled={mode === 'view'}
                  required
                />
                {formData.email && mode !== 'view' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.email, 'Email')}
                    className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
                  >
                    <CopyIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </FormField>

            {(mode === 'create' || (mode === 'edit' && formData.password)) && (
              <>
                <FormField
                  label="Password"
                  required={mode === 'create'}
                  error={errors.password}
                  helpText={mode === 'create' ? 'Must be at least 8 characters' : 'Leave empty to keep current password'}
                  icon={<LockIcon className="w-4 h-4" />}
                >
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleFormChange('password', e.target.value)}
                          placeholder="Enter password"
                          required={mode === 'create'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={generatePassword}
                        className="px-3 py-2 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100"
                        title="Generate strong password"
                      >
                        <ShuffleIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <PasswordStrength password={formData.password} />
                  </div>
                </FormField>

                <FormField
                  label="Confirm Password"
                  required={mode === 'create'}
                  error={errors.confirmPassword}
                  icon={<KeyIcon className="w-4 h-4" />}
                >
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                      placeholder="Confirm password"
                      required={mode === 'create'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>
              </>
            )}

            {showAdvancedFields && (
              <FormField
                label="Status"
                helpText="Student account status"
              >
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleFormChange('isActive', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={mode === 'view'}
                    />
                    <span className="text-sm text-gray-700">Account is active</span>
                  </label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    formData.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </FormField>
            )}
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <FormField
              label="Phone Number"
              error={errors.phone}
              helpText="Student's primary contact number"
              icon={<PhoneIcon className="w-4 h-4" />}
            >
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                placeholder="+91 9876543210"
                disabled={mode === 'view'}
              />
            </FormField>

            <FormField
              label="Date of Birth"
              error={errors.dateOfBirth}
              helpText="Used for age verification"
              icon={<CalendarIcon className="w-4 h-4" />}
            >
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                disabled={mode === 'view'}
                max={new Date(Date.now() - 16 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
              />
            </FormField>

            <FormField
              label="Address"
              helpText="Permanent address"
              icon={<MapPinIcon className="w-4 h-4" />}
            >
              <textarea
                value={formData.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder="Enter permanent address"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={mode === 'view'}
              />
            </FormField>

            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Contact Name"
                  error={errors.emergencyContactName}
                  helpText="Person to contact in emergency"
                >
                  <Input
                    type="text"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleFormChange('emergencyContactName', e.target.value)}
                    placeholder="Enter contact name"
                    disabled={mode === 'view'}
                  />
                </FormField>

                <FormField
                  label="Contact Phone"
                  error={errors.emergencyContactPhone}
                  helpText="Emergency contact number"
                >
                  <Input
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleFormChange('emergencyContactPhone', e.target.value)}
                    placeholder="+91 9876543210"
                    disabled={mode === 'view'}
                  />
                </FormField>
              </div>

              <FormField
                label="Relationship"
                helpText="Relationship with emergency contact"
                className="mt-6"
              >
                <select
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => handleFormChange('emergencyContactRelationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={mode === 'view'}
                >
                  {RELATIONSHIPS.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>
        );

      case 'academic':
        return (
          <div className="space-y-6">
            <FormField
              label="Course/Program"
              helpText="Student's course of study"
            >
              <select
                value={formData.course}
                onChange={(e) => handleFormChange('course', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={mode === 'view'}
              >
                <option value="">Select Course</option>
                {COURSES.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Academic Year"
              helpText="Current year of study"
            >
              <select
                value={formData.year}
                onChange={(e) => handleFormChange('year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={mode === 'view'}
              >
                <option value="">Select Year</option>
                {ACADEMIC_YEARS.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Roll Number"
              helpText="Student's roll number or ID"
            >
              <div className="flex space-x-2">
                <Input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => handleFormChange('rollNumber', e.target.value)}
                  placeholder="Auto-generated or enter manually"
                  className="flex-1"
                  disabled={mode === 'view'}
                />
                {formData.rollNumber && mode !== 'view' && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.rollNumber, 'Roll Number')}
                    className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-md"
                  >
                    <CopyIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </FormField>
          </div>
        );

      case 'family':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Father's Name"
                helpText="Student's father's name"
              >
                <Input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => handleFormChange('fatherName', e.target.value)}
                  placeholder="Enter father's name"
                  disabled={mode === 'view'}
                />
              </FormField>

              <FormField
                label="Mother's Name"
                helpText="Student's mother's name"
              >
                <Input
                  type="text"
                  value={formData.motherName}
                  onChange={(e) => handleFormChange('motherName', e.target.value)}
                  placeholder="Enter mother's name"
                  disabled={mode === 'view'}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Parent Phone"
                helpText="Primary parent contact number"
              >
                <Input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => handleFormChange('parentPhone', e.target.value)}
                  placeholder="+91 9876543210"
                  disabled={mode === 'view'}
                />
              </FormField>

              <FormField
                label="Parent Email"
                error={errors.parentEmail}
                helpText="Parent's email address (optional)"
              >
                <Input
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => handleFormChange('parentEmail', e.target.value)}
                  placeholder="parent@example.com"
                  disabled={mode === 'view'}
                />
              </FormField>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [activeTab, formData, errors, mode, showAdvancedFields, handleFormChange, copyToClipboard, generatePassword, showPassword, showConfirmPassword]);

  // Modal title and icon
  const { title, icon } = useMemo(() => {
    switch (mode) {
      case 'edit':
        return { title: 'Edit Student', icon: <EditIcon className="w-5 h-5" /> };
      case 'view':
        return { title: 'Student Details', icon: <EyeIcon className="w-5 h-5" /> };
      case 'profile':
        return { title: 'My Profile', icon: <UserIcon className="w-5 h-5" /> };
      default:
        return { title: 'Add New Student', icon: <UserPlusIcon className="w-5 h-5" /> };
    }
  }, [mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-0 sm:p-4">
      <div className="relative top-0 sm:top-10 mx-auto p-4 sm:p-6 border-0 sm:border w-full h-full sm:h-auto max-w-none sm:max-w-4xl shadow-none sm:shadow-lg rounded-none sm:rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            {icon}
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            {hasChanges && mode !== 'view' && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                Unsaved changes
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Tabs */}
        {showAdvancedFields && (
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'basic', label: 'Basic Info', icon: <UserIcon className="w-4 h-4" /> },
                { id: 'contact', label: 'Contact', icon: <PhoneIcon className="w-4 h-4" /> },
                { id: 'academic', label: 'Academic', icon: <InfoIcon className="w-4 h-4" /> },
                { id: 'family', label: 'Family', icon: <UsersIcon className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 pb-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {renderTabContent}

          {/* Form Actions */}
          {mode !== 'view' && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || Object.keys(errors).length > 0}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SaveIcon className="w-4 h-4" />
                )}
                <span>
                  {loading ? 'Saving...' : (mode === 'create' ? 'Add Student' : 'Update Student')}
                </span>
              </Button>
            </div>
          )}
        </form>

        {/* Auto-save indicator */}
        {autoSave && hasChanges && mode !== 'view' && (
          <div className="absolute bottom-4 left-4 flex items-center space-x-2 text-sm text-gray-500">
            <RefreshCwIcon className="w-4 h-4 animate-spin" />
            <span>Auto-saving...</span>
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedStudentFormModal.displayName = 'OptimizedStudentFormModal';

export default OptimizedStudentFormModal;
