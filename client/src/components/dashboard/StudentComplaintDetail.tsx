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

interface ExtendedComplaint extends ApiComplaint {
  category?: string;
  dateSubmitted?: string;
  dateResolved?: string;
  assignedTo?: string;
  response?: string;
  attachments?: string[];
  studentName?: string;
  roomNumber?: string;
}

interface ComplaintFormData {
  title: string;
  description: string;
  priority: ApiComplaint['priority'];
  category?: string;
}

interface OptimizedStudentComplaintDetailProps {
  complaintId?: string;
  onComplaintUpdate?: (complaint: ExtendedComplaint) => void;
  onComplaintDelete?: (complaintId: string) => void;
}

// ==========================================
// MEMOIZED HELPERS
// ==========================================

const getStatusIcon = memo((status: ApiComplaint['status']) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="w-4 h-4" />;
    case 'in-progress':
      return <AlertCircleIcon className="w-4 h-4" />;
    case 'resolved':
      return <CheckCircleIcon className="w-4 h-4" />;
    default:
      return <ClockIcon className="w-4 h-4" />;
  }
});

getStatusIcon.displayName = 'GetStatusIcon';

const getStatusVariant = (status: ApiComplaint['status']): 'primary' | 'success' | 'warning' | 'error' | 'neutral' => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'in-progress':
      return 'primary';
    case 'resolved':
      return 'success';
    default:
      return 'neutral';
  }
};

const getPriorityVariant = (priority?: ApiComplaint['priority']): 'primary' | 'success' | 'warning' | 'error' | 'neutral' => {
  switch (priority) {
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

const OptimizedStudentComplaintDetail: React.FC<OptimizedStudentComplaintDetailProps> = memo(({
  complaintId,
  onComplaintUpdate,
  onComplaintDelete
}) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  const [complaints, setComplaints] = useState<ExtendedComplaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<ExtendedComplaint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<ComplaintFormData>({
    title: '',
    description: '',
    priority: 'medium',
    category: ''
  });

  // ==========================================
  // MEMOIZED CALCULATIONS
  // ==========================================

  const displayComplaint = useMemo(() => {
    if (complaintId) {
      return complaints.find(c => c.id === complaintId) || null;
    }
    return selectedComplaint;
  }, [complaints, complaintId, selectedComplaint]);

  const canEdit = useMemo(() => {
    return displayComplaint?.status === 'pending';
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

  const fetchComplaints = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await studentApi.getComplaints();
      const extendedData: ExtendedComplaint[] = (data || []).map((complaint: ApiComplaint) => ({
        ...complaint,
        category: complaint.title, // Use title as category fallback
        dateSubmitted: complaint.createdAt || new Date().toISOString(),
        dateResolved: complaint.resolvedAt,
        studentName: complaint.student?.name || 'Unknown Student',
        roomNumber: undefined,
        assignedTo: undefined,
        response: complaint.resolution,
        attachments: []
      }));
      setComplaints(extendedData);
      
      if (complaintId && extendedData) {
        const found = extendedData.find((c: ExtendedComplaint) => c.id === complaintId);
        if (found) {
          setSelectedComplaint(found);
        }
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to fetch complaints');
      setComplaints([]);
    } finally {
      setIsLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

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
      await studentApi.updateComplaint(displayComplaint.id, editFormData);
      
      const updatedComplaint = { ...displayComplaint, ...editFormData };
      setComplaints(prev => prev.map(c => c.id === displayComplaint.id ? updatedComplaint : c));
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
      
      setComplaints(prev => prev.filter(c => c.id !== displayComplaint.id));
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

  const handleComplaintSelect = useCallback((complaint: ExtendedComplaint) => {
    setSelectedComplaint(complaint);
  }, []);

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const renderComplaintsList = useMemo(() => {
    if (complaintId) return null; // Don't show list if specific complaint is requested

    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Your Complaints</h3>
        {complaints.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No complaints found</p>
        ) : (
          <div className="space-y-2">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedComplaint?.id === complaint.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleComplaintSelect(complaint)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{complaint.title}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getPriorityVariant(complaint.priority)}>
                      {complaint.priority || 'medium'}
                    </Badge>
                    <Badge variant={getStatusVariant(complaint.status)}>
                      {getStatusIcon(complaint.status)}
                      <span className="ml-1">{complaint.status}</span>
                    </Badge>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {complaint.description}
                </p>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {complaint.dateSubmitted ? new Date(complaint.dateSubmitted).toLocaleDateString() : 'No date'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [complaintId, complaints, selectedComplaint, handleComplaintSelect]);

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
                  {displayComplaint.priority || 'medium'}
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

        {displayComplaint.response && (
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {!complaintId && (
          <div className="lg:col-span-1">
            {renderComplaintsList}
          </div>
        )}
        <div className={complaintId ? 'lg:col-span-3' : 'lg:col-span-2'}>
          {renderComplaintDetail}
        </div>
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

OptimizedStudentComplaintDetail.displayName = 'OptimizedStudentComplaintDetail';

export default OptimizedStudentComplaintDetail;

// Export as named export for compatibility
export { OptimizedStudentComplaintDetail as StudentComplaintDetail };