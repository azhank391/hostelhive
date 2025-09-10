'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHostel } from '@/context/HostelContext';
import { useAdminApiWithHostel, useCurrentHostelId } from '@/lib/context-aware-api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from '@/lib/toast';
import { 
  UsersIcon, 
  ClockIcon, 
  CheckCircleIcon,
  AlertCircleIcon,
  SearchIcon,
  RefreshCwIcon,
  LogOutIcon,
  DownloadIcon,
  FilterIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  CheckIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon
} from 'lucide-react';

interface VisitorLog {
  id: string;
  visitorName: string;
  relation: string;
  checkIn: string;
  checkOut?: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  status?: 'active' | 'checked_out';
}

interface VisitorFormData {
  visitorName: string;
  relation: string;
  studentId: string;
}

interface WardenVisitorStats {
  totalVisitors: number;
  currentVisitors: number;
  todayVisitors: number;
  pendingCheckouts: number;
}

// Modal Components
interface CreateVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: VisitorFormData) => Promise<void>;
  students: Array<{ id: string; name: string; email: string }>;
  loading?: boolean;
}

const CreateVisitorModal: React.FC<CreateVisitorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  students,
  loading = false 
}) => {
  const [formData, setFormData] = useState<VisitorFormData>({
    visitorName: '',
    relation: '',
    studentId: ''
  });
  const [errors, setErrors] = useState<Partial<VisitorFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Partial<VisitorFormData> = {};
    if (!formData.visitorName.trim()) newErrors.visitorName = 'Visitor name is required';
    if (!formData.relation.trim()) newErrors.relation = 'Relation is required';
    if (!formData.studentId) newErrors.studentId = 'Student is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      setFormData({ visitorName: '', relation: '', studentId: '' });
      setErrors({});
    } catch (error) {
      // Error handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof VisitorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Check In New Visitor</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visitor Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  value={formData.visitorName}
                  onChange={(e) => handleInputChange('visitorName', e.target.value)}
                  placeholder="Enter visitor's full name"
                  className={`pl-10 ${errors.visitorName ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.visitorName && <p className="mt-1 text-sm text-red-600">{errors.visitorName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relation to Student <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  value={formData.relation}
                  onChange={(e) => handleInputChange('relation', e.target.value)}
                  placeholder="e.g., Parent, Sibling, Friend"
                  className={`pl-10 ${errors.relation ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.relation && <p className="mt-1 text-sm text-red-600">{errors.relation}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.studentId}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.studentId ? 'border-red-500' : ''
                }`}
                disabled={isSubmitting || loading}
              >
                <option value="">Select a student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
              {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" onClick={onClose} variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex items-center">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking In...
                  </>
                ) : (
                  <>
                    <CheckIcon size={16} className="mr-2" />
                    Check In Visitor
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface EditVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  visitor: VisitorLog | null;
  onSubmit: (data: Partial<VisitorFormData>) => Promise<void>;
  students: Array<{ id: string; name: string; email: string }>;
}

const EditVisitorModal: React.FC<EditVisitorModalProps> = ({ 
  isOpen, 
  onClose, 
  visitor, 
  onSubmit, 
  students 
}) => {
  const [formData, setFormData] = useState<Partial<VisitorFormData>>({});
  const [errors, setErrors] = useState<Partial<VisitorFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when visitor changes
  useEffect(() => {
    if (visitor) {
      setFormData({
        visitorName: visitor.visitorName,
        relation: visitor.relation,
        studentId: visitor.studentId
      });
      setErrors({});
    }
  }, [visitor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Partial<VisitorFormData> = {};
    if (!formData.visitorName?.trim()) newErrors.visitorName = 'Visitor name is required';
    if (!formData.relation?.trim()) newErrors.relation = 'Relation is required';
    if (!formData.studentId) newErrors.studentId = 'Student is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      // Error handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof VisitorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen || !visitor) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Edit Visitor</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visitor Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  value={formData.visitorName || ''}
                  onChange={(e) => handleInputChange('visitorName', e.target.value)}
                  placeholder="Enter visitor's full name"
                  className={`pl-10 ${errors.visitorName ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.visitorName && <p className="mt-1 text-sm text-red-600">{errors.visitorName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relation to Student <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  value={formData.relation || ''}
                  onChange={(e) => handleInputChange('relation', e.target.value)}
                  placeholder="e.g., Parent, Sibling, Friend"
                  className={`pl-10 ${errors.relation ? 'border-red-500' : ''}`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.relation && <p className="mt-1 text-sm text-red-600">{errors.relation}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.studentId || ''}
                onChange={(e) => handleInputChange('studentId', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.studentId ? 'border-red-500' : ''
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select a student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
              {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" onClick={onClose} variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex items-center">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckIcon size={16} className="mr-2" />
                    Update Visitor
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/**
 * 🚀 OPTIMIZED WardenVisitorManagement Component with OPTIMISTIC UPDATES
 * 
 * Performance Improvements:
 * ✅ React.memo for re-render prevention
 * ✅ useMemo for expensive filtering operations
 * ✅ useCallback for stable function references
 * ✅ Context-aware API integration
 * ✅ Batch operations for better performance
 * ✅ Optimized search and filtering
 * ✅ Real-time statistics calculation
 * 
 * 🎯 OPTIMISTIC UPDATES:
 * ✅ CREATE: Shows new visitor immediately
 * ✅ UPDATE: Updates UI instantly, rolls back on error
 * ✅ DELETE: Removes visitor immediately, restores on error
 * ✅ CHECKOUT: Shows checkout immediately, rolls back on error
 */
export const WardenVisitorManagement = React.memo(() => {
  const { user } = useAuth();
  const { hostels } = useHostel();
  const { getHostelIdSafe, hasHostel } = useCurrentHostelId();
  const adminApi = useAdminApiWithHostel();
  
  // State management
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'checked_out'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLog | null>(null);

  // 🎯 PERFORMANCE: Memoized visitor filtering and search
  const filteredVisitors = useMemo(() => {
    let filtered = visitorLogs;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(visitor => {
        const isActive = !visitor.checkOut;
        return statusFilter === 'active' ? isActive : !isActive;
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(visitor => 
        new Date(visitor.checkIn) >= filterDate
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(visitor =>
        visitor.visitorName.toLowerCase().includes(lowercaseQuery) ||
        (visitor.student?.name || 'Unknown Student').toLowerCase().includes(lowercaseQuery) ||
        visitor.relation.toLowerCase().includes(lowercaseQuery)
      );
    }

    return filtered.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
  }, [visitorLogs, statusFilter, dateFilter, searchQuery]);

  // 🎯 PERFORMANCE: Memoized visitor statistics
  const stats = useMemo((): WardenVisitorStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const currentVisitors = visitorLogs.filter(visitor => !visitor.checkOut);
    const todayVisitors = visitorLogs.filter(visitor => 
      new Date(visitor.checkIn) >= today
    );
    
    return {
      totalVisitors: visitorLogs.length,
      currentVisitors: currentVisitors.length,
      todayVisitors: todayVisitors.length,
      pendingCheckouts: currentVisitors.filter(visitor => {
        const checkInTime = new Date(visitor.checkIn);
        const hoursAgo = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        return hoursAgo > 12; // Visitors checked in more than 12 hours ago
      }).length
    };
  }, [visitorLogs]);

  // 🚀 PERFORMANCE: Optimized data fetching
  const fetchVisitorLogs = useCallback(async () => {
    if (!hasHostel) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      const currentHostelId = getHostelIdSafe();
      if (!currentHostelId) {
        setError('No hostel selected');
        setLoading(false);
        return;
      }
      
      // Fetch visitor logs and students in parallel
      const [visitorResponse, studentsResponse] = await Promise.all([
        adminApi.getVisitorLogs(),
        adminApi.getStudents()
      ]);
      
      // Process visitor logs
      const visitorData = Array.isArray(visitorResponse) ? visitorResponse : 
                   (typeof visitorResponse === 'object' && visitorResponse !== null && 'data' in visitorResponse ? 
                     ((visitorResponse as any).data) : 
                     []);
      
      // Process students
      const studentsData = Array.isArray(studentsResponse) ? studentsResponse : 
                          (typeof studentsResponse === 'object' && studentsResponse !== null && 'data' in studentsResponse ? 
                            ((studentsResponse as { data: any[] }).data) : 
                            []);
      
      // Process and enrich visitor data with student information
      const processedLogs = visitorData.map((log: any) => ({
        ...log,
        status: log.checkOut ? 'checked_out' as const : 'active' as const,
        student: studentsData.find(s => s.id === log.studentId) || {
          id: log.studentId,
          name: 'Unknown Student',
          email: 'N/A'
        }
      }));
      
      setVisitorLogs(processedLogs);
      setStudents(studentsData);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch visitor logs';
      setError(errorMessage);
      console.error('Failed to fetch visitor logs:', error);
      toast.error(`Failed to load visitor data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [hasHostel, adminApi, getHostelIdSafe]);

  // 🎯 PERFORMANCE: Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    if (!hasHostel) return;
    
    setRefreshing(true);
    try {
      await fetchVisitorLogs();
      toast.success('Visitor data refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh visitor data');
    } finally {
      setRefreshing(false);
    }
  }, [hasHostel, fetchVisitorLogs]);

  // 🚀 PERFORMANCE: Optimized CRUD handlers with useCallback
  const handleCreateVisitor = useCallback(async (data: VisitorFormData) => {
    if (!hasHostel) return;
    
    // Generate temporary ID for optimistic update
    const tempId = `temp-visitor-${Date.now()}`;
    const student = students.find(s => s.id === data.studentId);
    
    if (!student) {
      toast.error('Selected student not found');
      return;
    }
    
    const optimisticVisitor: VisitorLog = {
      id: tempId,
      visitorName: data.visitorName,
      relation: data.relation,
      checkIn: new Date().toISOString(),
      studentId: data.studentId,
      student: student,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    
    // 1. Update UI immediately (optimistic)
    setVisitorLogs(prev => [...prev, optimisticVisitor]);
    setShowCreateModal(false);
    toast.success('Visitor checked in successfully!');
    
    try {
      // 2. Send request to server
      const response = await adminApi.createVisitorLog(data);
      
      // 3. Replace optimistic visitor with real data from server
      if (response && (response as any).id) {
        setVisitorLogs(prev => prev.map(v => 
          v.id === tempId ? { ...v, id: (response as any).id } : v
        ));
      }
      // NO fetchVisitorLogs() - let optimistic updates persist!
    } catch (err) {
      // 4. Rollback on error
      setVisitorLogs(prev => prev.filter(v => v.id !== tempId));
      const errorMessage = err instanceof Error ? err.message : 'Failed to check in visitor';
      toast.error(errorMessage);
      throw err;
    }
  }, [hasHostel, adminApi, students]);

  const handleUpdateVisitor = useCallback(async (data: Partial<VisitorFormData>) => {
    if (!selectedVisitor || !hasHostel) return;
    
    // 1. Store original data for rollback
    const originalVisitor = visitorLogs.find(v => v.id === selectedVisitor.id);
    if (!originalVisitor) return;
    
    // 2. Update UI immediately (optimistic)
    const updatedVisitor = { ...originalVisitor, ...data };
    if (data.studentId && data.studentId !== originalVisitor.studentId) {
      const student = students.find(s => s.id === data.studentId);
      if (student) {
        updatedVisitor.student = student;
      }
    }
    
    setVisitorLogs(prev => 
      prev.map(v => v.id === selectedVisitor.id ? updatedVisitor : v)
    );
    setShowEditModal(false);
    setSelectedVisitor(null);
    toast.success('Visitor updated successfully!');
    
    try {
      // 3. Send request to server
      await adminApi.updateVisitorLog(selectedVisitor.id, data);
      
      // 4. NO fetchVisitorLogs() - let optimistic updates persist!
    } catch (err) {
      // 5. Rollback on error
      setVisitorLogs(prev => 
        prev.map(v => v.id === selectedVisitor.id ? originalVisitor : v)
      );
      const errorMessage = err instanceof Error ? err.message : 'Failed to update visitor';
      toast.error(errorMessage);
      throw err;
    }
  }, [selectedVisitor, hasHostel, adminApi, visitorLogs, students]);

  const handleDeleteVisitor = useCallback(async (visitorId: string) => {
    if (!hasHostel || !confirm('Are you sure you want to delete this visitor log? This action cannot be undone.')) {
      return;
    }

    // 1. Store original data and position for rollback
    const originalVisitor = visitorLogs.find(v => v.id === visitorId);
    if (!originalVisitor) return;
    const originalIndex = visitorLogs.findIndex(v => v.id === visitorId);
    
    // 2. Remove from UI immediately (optimistic)
    setVisitorLogs(prev => prev.filter(v => v.id !== visitorId));
    toast.success('Visitor log deleted successfully!');
    
    try {
      // 3. Send request to server
      await adminApi.deleteVisitorLog(visitorId);
    } catch (err) {
      // 4. Rollback on error - restore the visitor to original position
      setVisitorLogs(prev => {
        const exists = prev.find(v => v.id === visitorId);
        if (!exists) {
          const newArray = [...prev];
          newArray.splice(originalIndex, 0, originalVisitor);
          return newArray;
        }
        return prev;
      });
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete visitor log';
      toast.error(errorMessage);
    }
  }, [hasHostel, adminApi, visitorLogs]);

  const handleCheckoutVisitor = useCallback(async (visitorId: string) => {
    if (!hasHostel) return;
    
    // 1. Update UI immediately (optimistic)
    const now = new Date().toISOString();
    setVisitorLogs(prev => 
      prev.map(v => 
        v.id === visitorId 
          ? { ...v, checkOut: now, status: 'checked_out' as const }
          : v
      )
    );
    toast.success('Visitor checked out successfully!');
    
    try {
      // 2. Send request to server
      await adminApi.checkoutVisitor(visitorId);
      
      // 3. NO fetchVisitorLogs() - let optimistic updates persist!
    } catch (err) {
      // 4. Rollback on error
      setVisitorLogs(prev => 
        prev.map(v => 
          v.id === visitorId 
            ? { ...v, checkOut: undefined, status: 'active' as const }
            : v
        )
      );
      const errorMessage = err instanceof Error ? err.message : 'Failed to check out visitor';
      toast.error(errorMessage);
      throw err;
    }
  }, [hasHostel, adminApi]);

  // 🎯 PERFORMANCE: Optimized event handlers with useCallback
  const handleEditClick = useCallback((visitor: VisitorLog) => {
    setSelectedVisitor(visitor);
    setShowEditModal(true);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((filter: 'all' | 'active' | 'checked_out') => {
    setStatusFilter(filter);
  }, []);

  const handleDateFilterChange = useCallback((filter: 'today' | 'week' | 'month' | 'all') => {
    setDateFilter(filter);
  }, []);

  // Initial data fetch when hostel changes
  useEffect(() => {
    if (hasHostel) {
      fetchVisitorLogs();
    }
  }, [hasHostel, fetchVisitorLogs]);

  // Utility functions
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getVisitorDuration = (checkIn: string, checkOut?: string) => {
    const checkInTime = new Date(checkIn);
    const checkOutTime = checkOut ? new Date(checkOut) : new Date();
    const durationMs = checkOutTime.getTime() - checkInTime.getTime();
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Loading state
  if (!hasHostel) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Hostel Selected</h3>
          <p className="text-gray-600">Please select a hostel to manage visitors.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading visitors</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with optimized stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
          <p className="mt-1 text-gray-600">
            {stats.totalVisitors} total visitors • {stats.currentVisitors} currently active • {stats.todayVisitors} today
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={refreshing}
            className="flex items-center"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)} 
            className="flex items-center"
          >
            <PlusIcon size={16} className="mr-2" />
            Check In Visitor
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Visitors</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalVisitors}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Currently Active</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.currentVisitors}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Today's Visitors</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.todayVisitors}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertCircleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending Checkouts</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingCheckouts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search visitors by name, student, or relation..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'active' | 'checked_out')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="checked_out">Checked Out</option>
        </select>
        
        <select
          value={dateFilter}
          onChange={(e) => handleDateFilterChange(e.target.value as 'today' | 'week' | 'month' | 'all')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Optimized visitor list rendering */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredVisitors.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all' 
                ? 'No visitors found' 
                : 'No visitors yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Visitor logs will appear here when visitors check in'}
            </p>
            {!searchQuery && statusFilter === 'all' && dateFilter === 'all' && (
              <div className="mt-6">
                <Button onClick={() => setShowCreateModal(true)}>
                  <PlusIcon size={16} className="mr-2" />
                  Check In First Visitor
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In/Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{visitor.visitorName}</div>
                        <div className="text-sm text-gray-500">{visitor.relation}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {visitor.student?.name || 'Unknown Student'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {visitor.student?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        In: {formatDateTime(visitor.checkIn)}
                      </div>
                      {visitor.checkOut && (
                        <div className="text-sm text-gray-500">
                          Out: {formatDateTime(visitor.checkOut)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getVisitorDuration(visitor.checkIn, visitor.checkOut)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        visitor.checkOut 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {visitor.checkOut ? 'Checked Out' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {!visitor.checkOut && (
                        <Button
                          onClick={() => handleCheckoutVisitor(visitor.id)}
                          variant="outline"
                          size="sm"
                          className="inline-flex items-center text-red-600 hover:text-red-700"
                        >
                          <LogOutIcon size={14} className="mr-1" />
                          Check Out
                        </Button>
                      )}
                      <Button
                        onClick={() => handleEditClick(visitor)}
                        variant="outline"
                        size="sm"
                        className="inline-flex items-center text-gray-600 hover:text-gray-700"
                      >
                        <EditIcon size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteVisitor(visitor.id)}
                        variant="outline"
                        size="sm"
                        className="inline-flex items-center text-red-600 hover:text-red-700"
                      >
                        <TrashIcon size={14} className="mr-1" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Show filtered results count */}
      {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredVisitors.length} of {visitorLogs.length} visitors
        </div>
      )}

      {/* Modals */}
      <CreateVisitorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateVisitor}
        students={students}
        loading={loading}
      />

      <EditVisitorModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        visitor={selectedVisitor}
        onSubmit={handleUpdateVisitor}
        students={students}
      />
    </div>
  );
});

WardenVisitorManagement.displayName = 'WardenVisitorManagement';

export default WardenVisitorManagement;
