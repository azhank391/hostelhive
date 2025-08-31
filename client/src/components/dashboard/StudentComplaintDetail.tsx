'use client';

import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { AlertCircleIcon, CheckCircleIcon, ClockIcon, PencilIcon, TrashIcon, UserIcon, CalendarIcon } from 'lucide-react';
import toast from '@/lib/toast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/modals/Modal';
import { studentApi } from '@/lib/api';
import { Complaint as ApiComplaint } from '@/lib/types';

// ==========================================
// TYPES & INTERFACES
// ==========================================

interface ExtendedComplaint extends Omit<ApiComplaint, 'status' | 'priority'> {
  status: string; // Transformed status from backend
  priority: string; // Transformed priority from backend
  category?: string;
  dateSubmitted?: string;
  dateResolved?: string;
  assignedTo?: string;
  response?: string;
  resolution?: string; // Main resolution text
  resolutionNotes?: string; // Additional notes from warden/owner
  attachments?: string[];
  studentName?: string;
  roomNumber?: string;
}

interface ComplaintFormData {
  title: string;
  description: string;
  priority: string;
  category?: string;
}

interface StudentComplaintDetailProps {
  complaintId?: string;
  onComplaintUpdate?: (complaint: ExtendedComplaint) => void;
  onComplaintDelete?: (complaintId: string) => void;
}

// ==========================================
// MEMOIZED HELPERS
// ==========================================

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Open':
      return <ClockIcon className="w-4 h-4" />;
    case 'In Progress':
      return <AlertCircleIcon className="w-4 h-4" />;
    case 'Resolved':
      return <CheckCircleIcon className="w-4 h-4" />;
    case 'Closed':
      return <ClockIcon className="w-4 h-4" />;
    default:
      return <ClockIcon className="w-4 h-4" />;
  }
};

const getStatusVariant = (status: string): 'primary' | 'success' | 'warning' | 'error' | 'neutral' => {
  switch (status) {
    case 'Open':
      return 'warning';
    case 'In Progress':
      return 'primary';
    case 'Resolved':
      return 'success';
    case 'Closed':
      return 'neutral';
    default:
      return 'neutral';
  }
};

const getPriorityVariant = (priority?: string): 'primary' | 'success' | 'warning' | 'error' | 'neutral' => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'warning';
    case 'medium':
      return 'primary';
    case 'low':
      return 'neutral';
    default:
      return 'neutral';
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const StudentComplaintDetail: React.FC<StudentComplaintDetailProps> = memo(({
  complaintId,
  onComplaintUpdate,
  onComplaintDelete
}) => {
  console.log('🎯 StudentComplaintDetail rendered with complaintId:', complaintId);
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  const [selectedComplaint, setSelectedComplaint] = useState<ExtendedComplaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<ComplaintFormData>({
    title: '',
    description: '',
    priority: 'Medium',
    category: ''
  });

  // ==========================================
  // MEMOIZED CALCULATIONS
  // ==========================================

  const displayComplaint = useMemo(() => {
    return selectedComplaint;
  }, [selectedComplaint]);

  const canEdit = useMemo(() => {
    return displayComplaint?.status === 'Open' || displayComplaint?.status === 'In Progress';
  }, [displayComplaint?.status]);

  const formattedDate = useMemo(() => {
    if (!displayComplaint?.dateSubmitted) return '';
    return new Date(displayComplaint.dateSubmitted).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [displayComplaint?.dateSubmitted]);

  const formattedResolvedDate = useMemo(() => {
    if (!displayComplaint?.dateResolved) return '';
    return new Date(displayComplaint.dateResolved).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [displayComplaint?.dateResolved]);

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchComplaint = useCallback(async () => {
    if (!complaintId) return;
    
    console.log('🔍 Fetching complaint with ID:', complaintId);
    try {
      setIsLoading(true);
      const complaint = await studentApi.getComplaintById(complaintId);
      
      console.log('📡 Raw complaint data from API:', complaint);
      
      if (complaint) {
        const extendedComplaint: ExtendedComplaint = {
          ...complaint,
          category: complaint.title, // Use title as category fallback
          dateSubmitted: complaint.createdAt || new Date().toISOString(),
          dateResolved: complaint.resolvedAt,
          studentName: complaint.user?.name || 'Unknown Student',
          roomNumber: complaint.room?.roomNumber,
          assignedTo: undefined,
          response: complaint.resolutionNotes,
          resolution: complaint.resolution,
          resolutionNotes: complaint.resolutionNotes,
          attachments: []
        };
        console.log('✨ Extended complaint data:', extendedComplaint);
        setSelectedComplaint(extendedComplaint);
      } else {
        console.log('❌ No complaint data received from API');
      }
    } catch (error) {
      console.error('💥 Error fetching complaint:', error);
      toast.error('Failed to fetch complaint details');
      setSelectedComplaint(null);
    } finally {
      setIsLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    console.log('🔄 useEffect triggered, calling fetchComplaint');
    fetchComplaint();
  }, [fetchComplaint]);

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  const handleEditClick = useCallback(() => {
    if (!displayComplaint) return;
    
    setEditFormData({
      title: displayComplaint.title,
      description: displayComplaint.description,
      priority: displayComplaint.priority,
      category: displayComplaint.category
    });
    setIsEditModalOpen(true);
  }, [displayComplaint]);

  const handleEditSubmit = useCallback(async () => {
    if (!displayComplaint) return;

    try {
      // Transform priority back to raw value for API
      const apiUpdates = {
        ...editFormData,
        priority: editFormData.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent'
      };
      
      await studentApi.updateComplaint(displayComplaint.id, apiUpdates);
      
      const updatedComplaint = { ...displayComplaint, ...editFormData };
      setSelectedComplaint(updatedComplaint);
      
      onComplaintUpdate?.(updatedComplaint);
      setIsEditModalOpen(false);
      toast.success('Complaint updated successfully');
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('Failed to update complaint');
    }
  }, [displayComplaint, editFormData, onComplaintUpdate]);

  const handleDeleteClick = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!displayComplaint) return;

    try {
      await studentApi.deleteComplaint(displayComplaint.id);
      
      setSelectedComplaint(null);
      
      onComplaintDelete?.(displayComplaint.id);
      setIsDeleteModalOpen(false);
      toast.success('Complaint deleted successfully');
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('Failed to delete complaint');
    }
  }, [displayComplaint, onComplaintDelete]);

  const handleFormChange = useCallback((field: keyof ComplaintFormData, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  }, []);



  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const renderComplaintsList = useMemo(() => {
    // This component is for detail view only, no list needed
    return null;
  }, []);

  const renderComplaintDetail = useMemo(() => {
    if (!displayComplaint) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {complaintId ? 'Complaint not found' : 'Select a complaint to view details'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{displayComplaint.title}</h2>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <>
                <Button variant="outline" onClick={handleEditClick}>
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" onClick={handleDeleteClick}>
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusVariant(displayComplaint.status)}>
                  {getStatusIcon(displayComplaint.status)}
                  <span className="ml-1 capitalize">{displayComplaint.status}</span>
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <div className="mt-1">
                <Badge variant={getPriorityVariant(displayComplaint.priority)}>
                  {displayComplaint.priority || 'Medium'}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <p className="mt-1 text-gray-900">{displayComplaint.category}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Submitted</label>
              <div className="mt-1 flex items-center text-gray-600">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {formattedDate}
              </div>
            </div>

            {displayComplaint.dateResolved && (
              <div>
                <label className="text-sm font-medium text-gray-700">Resolved</label>
                <div className="mt-1 flex items-center text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {formattedResolvedDate}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Student</label>
              <div className="mt-1 flex items-center text-gray-600">
                <UserIcon className="w-4 h-4 mr-2" />
                {displayComplaint.studentName}
                {displayComplaint.roomNumber && ` - Room ${displayComplaint.roomNumber}`}
              </div>
            </div>

            {displayComplaint.assignedTo && (
              <div>
                <label className="text-sm font-medium text-gray-700">Assigned To</label>
                <p className="mt-1 text-gray-900">{displayComplaint.assignedTo}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <div className="mt-1 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-900 whitespace-pre-wrap">{displayComplaint.description}</p>
          </div>
        </div>

        {/* Resolution Details - Show when complaint is resolved */}
        {displayComplaint.status === 'Resolved' && (
          <div className="space-y-4">
            {displayComplaint.resolution && (
              <div>
                <label className="text-sm font-medium text-gray-700">Resolution</label>
                <div className="mt-1 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{displayComplaint.resolution}</p>
                </div>
              </div>
            )}
            
            {displayComplaint.resolutionNotes && (
              <div>
                <label className="text-sm font-medium text-gray-700">Resolution Notes</label>
                <div className="mt-1 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{displayComplaint.resolutionNotes}</p>
                </div>
              </div>
            )}
            
            {displayComplaint.dateResolved && (
              <div>
                <label className="text-sm font-medium text-gray-700">Resolved On</label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center text-gray-900">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {new Date(displayComplaint.dateResolved).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legacy Response field - keep for backward compatibility */}
        {displayComplaint.response && displayComplaint.status !== 'Resolved' && (
          <div>
            <label className="text-sm font-medium text-gray-700">Response</label>
            <div className="mt-1 p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{displayComplaint.response}</p>
            </div>
          </div>
        )}
      </div>
    );
  }, [displayComplaint, canEdit, formattedDate, formattedResolvedDate, handleEditClick, handleDeleteClick]);

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <div className="space-y-6">
      <div className="w-full">
        {renderComplaintDetail}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Complaint">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Edit Complaint</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <Input
              value={editFormData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              placeholder="Enter complaint title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Input
              value={editFormData.category || ''}
              onChange={(e) => handleFormChange('category', e.target.value)}
              placeholder="Enter category"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={editFormData.priority}
              onChange={(e) => handleFormChange('priority', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={editFormData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              placeholder="Enter complaint description"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>
              Update Complaint
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Complaint">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-600">Delete Complaint</h3>
          <p className="text-gray-600">
            Are you sure you want to delete this complaint? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
});

StudentComplaintDetail.displayName = 'StudentComplaintDetail';

export default StudentComplaintDetail;

// Export as named export for compatibility
export { StudentComplaintDetail as StudentComplaintDetail };