'use client'

import React, { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeftIcon, 
  MessageSquareIcon, 
  UserIcon, 
  ClockIcon, 
  BuildingIcon, 
  HomeIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  PencilIcon, 
  AlertCircleIcon,
  FileTextIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  PhoneIcon,
  MailIcon,
  TagIcon,
  StarIcon,
  DownloadIcon,
  ShareIcon,
  PrinterIcon,
  RefreshCwIcon,
  PaperclipIcon,
  EyeIcon,
  ThumbsUpIcon,
  SendIcon,
  SearchIcon,
  MoreHorizontalIcon,
  CameraIcon,
  MicIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/modals/Modal';
import { AdminComplaintForm } from '../../components/forms/AdminComplaintForm';
import toast from '@/lib/toast';

interface TimelineEvent {
  id: string;
  type: 'created' | 'status_change' | 'assigned' | 'comment' | 'escalated' | 'resolved' | 'attached' | 'updated';
  user: {
    id: string;
    name: string;
    role: string;
    image?: string;
    email?: string;
  };
  timestamp: string;
  content: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
  metadata?: {
    oldValue?: string;
    newValue?: string;
    category?: string;
    priority?: string;
  };
  reactions?: Array<{
    id: string;
    type: 'like' | 'dislike' | 'helpful' | 'resolved';
    userId: string;
    userName: string;
  }>;
  isPrivate?: boolean;
  mentionedUsers?: string[];
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Escalated';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  category?: string;
  subcategory?: string;
  urgencyScore?: number;
  estimatedResolution?: string;
  actualResolution?: string;
  reportedBy: {
    id: string;
    name: string;
    role: string;
    image?: string;
    email?: string;
    phone?: string;
  };
  hostel: {
    id: string;
    name: string;
    block?: string;
    floor?: number;
  };
  room?: string;
  assignedTo?: {
    id: string;
    name: string;
    role: string;
    image?: string;
    email?: string;
    workload?: number;
  };
  tags?: string[];
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedBy: string;
    uploadedAt: string;
  }>;
  watchers?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  relatedComplaints?: string[];
  satisfactionRating?: number;
  feedback?: string;
  costEstimate?: number;
  resolutionTime?: number;
  slaViolation?: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  timeline: TimelineEvent[];
}

interface ComplaintDetailProps {
  id: string;
  currentUserRole?: string;
  enableAdvancedFeatures?: boolean;
  showMetrics?: boolean;
  allowEditing?: boolean;
  allowStatusChange?: boolean;
  allowAssignment?: boolean;
  allowComments?: boolean;
  enableNotifications?: boolean;
  enableCollaboration?: boolean;
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    action: (complaint: Complaint) => void;
    condition?: (complaint: Complaint) => boolean;
    variant?: 'primary' | 'outline' | 'text';
  }>;
}

// Memoized timeline event component
const TimelineEventCard = memo(({ 
  event, 
  onReaction, 
  onReply, 
  enableReactions = true 
}: {
  event: TimelineEvent;
  onReaction?: (eventId: string, reactionType: string) => void;
  onReply?: (eventId: string, content: string) => void;
  enableReactions?: boolean;
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const timeAgo = useMemo(() => {
    const date = new Date(event.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, [event.timestamp]);

  const getEventIcon = useCallback(() => {
    switch (event.type) {
      case 'created':
        return <AlertCircleIcon className="w-4 h-4 text-blue-600" />;
      case 'status_change':
        return <RefreshCwIcon className="w-4 h-4 text-orange-600" />;
      case 'assigned':
        return <UserIcon className="w-4 h-4 text-purple-600" />;
      case 'comment':
        return <MessageSquareIcon className="w-4 h-4 text-green-600" />;
      case 'escalated':
        return <TrendingUpIcon className="w-4 h-4 text-red-600" />;
      case 'resolved':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'attached':
        return <PaperclipIcon className="w-4 h-4 text-gray-600" />;
      case 'updated':
        return <PencilIcon className="w-4 h-4 text-blue-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-600" />;
    }
  }, [event.type]);

  const handleReply = useCallback(() => {
    if (onReply && replyContent.trim()) {
      onReply(event.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    }
  }, [onReply, event.id, replyContent]);

  return (
    <div className={`bg-white rounded-lg border ${event.isPrivate ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'} p-4 shadow-sm`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {event.user.image ? (
            <Image 
              src={event.user.image} 
              alt={event.user.name} 
              width={32} 
              height={32} 
              className="w-8 h-8 rounded-full object-cover" 
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
              {event.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {getEventIcon()}
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{event.user.name}</span>
              <span className="text-sm text-gray-500">({event.user.role})</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{timeAgo}</span>
              {event.isPrivate && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Private
                </span>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-900 mb-2">
            {event.content}
          </div>

          {event.metadata && (
            <div className="text-xs text-gray-600 mb-2">
              {event.metadata.oldValue && event.metadata.newValue && (
                <span>
                  Changed from <span className="font-medium">{event.metadata.oldValue}</span> to{' '}
                  <span className="font-medium">{event.metadata.newValue}</span>
                </span>
              )}
            </div>
          )}

          {event.attachments && event.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {event.attachments.map(attachment => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-100"
                >
                  <PaperclipIcon className="w-3 h-3" />
                  <span>{attachment.name}</span>
                  {attachment.size && (
                    <span className="text-blue-500">({Math.round(attachment.size / 1024)}KB)</span>
                  )}
                </a>
              ))}
            </div>
          )}

          {/* Reactions and Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-3">
              {enableReactions && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onReaction?.(event.id, 'like')}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <ThumbsUpIcon className="w-3 h-3" />
                    <span>{event.reactions?.filter(r => r.type === 'like').length || 0}</span>
                  </button>
                  <button
                    onClick={() => onReaction?.(event.id, 'helpful')}
                    className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                  >
                    <StarIcon className="w-3 h-3" />
                    <span>{event.reactions?.filter(r => r.type === 'helpful').length || 0}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {onReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-gray-600 hover:text-blue-600"
                >
                  Reply
                </button>
              )}
              <button className="text-xs text-gray-600 hover:text-gray-800">
                <MoreHorizontalIcon className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <div className="mt-3 border-t pt-3">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                  <SendIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TimelineEventCard.displayName = 'TimelineEventCard';

// Memoized status badge component
const StatusBadge = memo(({ status, slaViolation }: { status: string; slaViolation?: boolean }) => {
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'Open':
        return { variant: 'error' as const, color: 'bg-red-100 text-red-800' };
      case 'In Progress':
        return { variant: 'warning' as const, color: 'bg-yellow-100 text-yellow-800' };
      case 'Resolved':
        return { variant: 'success' as const, color: 'bg-green-100 text-green-800' };
      case 'Closed':
        return { variant: 'neutral' as const, color: 'bg-gray-100 text-gray-800' };
      case 'Escalated':
        return { variant: 'error' as const, color: 'bg-red-100 text-red-800' };
      default:
        return { variant: 'neutral' as const, color: 'bg-gray-100 text-gray-800' };
    }
  }, [status]);

  return (
    <div className="flex items-center space-x-2">
      <Badge variant={statusConfig.variant}>{status}</Badge>
      {slaViolation && (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
          <AlertTriangleIcon className="w-3 h-3 mr-1" />
          SLA Violated
        </span>
      )}
    </div>
  );
});

StatusBadge.displayName = 'StatusBadge';

export const ComplaintDetail = memo<ComplaintDetailProps>(({ 
  id,
  currentUserRole = 'admin',
  enableAdvancedFeatures = true,
  showMetrics = true,
  allowEditing = true,
  allowStatusChange = true,
  allowAssignment = true,
  allowComments = true,
  enableNotifications = true,
  enableCollaboration = false,
  customActions = []
}) => {
  // Mark intentionally unused props to satisfy lint rules without altering API
  void currentUserRole;
  void allowAssignment;
  void enableNotifications;
  
  // State management
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddCommentModalOpen, setIsAddCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedActions, setShowAdvancedActions] = useState(false);
  
  // Refs
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data - in real app, this would come from API
  const mockComplaint: Complaint = useMemo(() => ({
    id: id || '1',
    title: 'Water leakage in bathroom ceiling',
    description: 'There is a continuous water leak from the bathroom ceiling that started 3 days ago. The leak is getting worse and water is dripping onto the floor. This is causing slip hazards and potential water damage to personal belongings. The issue seems to be coming from the apartment above.',
    status: 'In Progress',
    priority: 'High',
    category: 'Plumbing',
    subcategory: 'Water Leak',
    urgencyScore: 85,
    estimatedResolution: '2024-08-26T18:00:00',
    reportedBy: {
      id: 'user1',
      name: 'Faisal Ahmed',
      role: 'Student',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
      email: 'faisal.ahmed@university.edu',
      phone: '+92-300-1234567'
    },
    hostel: {
      id: '1',
      name: 'Al-Hafeez Hostel',
      block: 'A',
      floor: 3
    },
    room: '101',
    assignedTo: {
      id: 'staff1',
      name: 'Ahmed Khan',
      role: 'Maintenance Staff',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
      email: 'ahmed.khan@hostel.com',
      workload: 12
    },
    tags: ['urgent', 'plumbing', 'safety-hazard', 'water-damage'],
    attachments: [
      {
        id: 'att1',
        name: 'leak-photo-1.jpg',
        url: '#',
        type: 'image/jpeg',
        size: 245760,
        uploadedBy: 'Faisal Ahmed',
        uploadedAt: '2024-08-24T10:30:00'
      },
      {
        id: 'att2',
        name: 'leak-video.mp4',
        url: '#',
        type: 'video/mp4',
        size: 2048000,
        uploadedBy: 'Faisal Ahmed',
        uploadedAt: '2024-08-24T10:32:00'
      }
    ],
    watchers: [
      { id: 'w1', name: 'Saira Malik', role: 'Warden' },
      { id: 'w2', name: 'Dr. Hassan Ali', role: 'Hostel Manager' }
    ],
    relatedComplaints: ['complaint-45', 'complaint-67'],
    satisfactionRating: undefined,
    costEstimate: 5000,
    resolutionTime: 24,
    slaViolation: false,
    createdAt: '2024-08-24T10:30:00',
    updatedAt: '2024-08-24T16:45:00',
    timeline: [
      {
        id: '1',
        type: 'created',
        user: {
          id: 'user1',
          name: 'Faisal Ahmed',
          role: 'Student',
          image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
          email: 'faisal.ahmed@university.edu'
        },
        timestamp: '2024-08-24T10:30:00',
        content: 'Complaint submitted with photos and video evidence',
        attachments: [
          { id: 'att1', name: 'leak-photo-1.jpg', url: '#', type: 'image/jpeg' },
          { id: 'att2', name: 'leak-video.mp4', url: '#', type: 'video/mp4' }
        ]
      },
      {
        id: '2',
        type: 'status_change',
        user: {
          id: 'warden1',
          name: 'Saira Malik',
          role: 'Warden',
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
        },
        timestamp: '2024-08-24T11:45:00',
        content: 'Status changed from Open to In Progress',
        metadata: {
          oldValue: 'Open',
          newValue: 'In Progress'
        }
      },
      {
        id: '3',
        type: 'assigned',
        user: {
          id: 'warden1',
          name: 'Saira Malik',
          role: 'Warden',
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
        },
        timestamp: '2024-08-24T11:46:00',
        content: 'Assigned to Ahmed Khan (Maintenance Staff) for immediate inspection'
      },
      {
        id: '4',
        type: 'comment',
        user: {
          id: 'staff1',
          name: 'Ahmed Khan',
          role: 'Maintenance Staff',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
        },
        timestamp: '2024-08-24T14:20:00',
        content: 'I have inspected the issue. The leak is coming from the apartment above. I will coordinate with the upper floor tenant and plumber. Estimated completion: tomorrow evening.',
        reactions: [
          { id: 'r1', type: 'helpful', userId: 'user1', userName: 'Faisal Ahmed' },
          { id: 'r2', type: 'like', userId: 'warden1', userName: 'Saira Malik' }
        ]
      },
      {
        id: '5',
        type: 'comment',
        user: {
          id: 'user1',
          name: 'Faisal Ahmed',
          role: 'Student',
          image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80'
        },
        timestamp: '2024-08-24T15:05:00',
        content: 'Thank you for the quick response! I will be available from 9 AM to 11 AM tomorrow. The leak has gotten worse since this morning.'
      }
    ]
  }), [id]);

  // Load complaint data
  useEffect(() => {
    const loadComplaint = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In real app, fetch from API
        // const data = await apiWithHostel.getComplaint(id);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        setComplaint(mockComplaint);
      } catch (err) {
        console.error('Error loading complaint:', err);
        setError('Failed to load complaint details');
      } finally {
        setLoading(false);
      }
    };

    loadComplaint();
  }, [id, mockComplaint]);

  // Memoized filtered timeline
  const filteredTimeline = useMemo(() => {
    if (!complaint) return [];
    
    let filtered = complaint.timeline;

    if (timelineFilter !== 'all') {
      filtered = filtered.filter(event => event.type === timelineFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.content.toLowerCase().includes(query) ||
        event.user.name.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [complaint, timelineFilter, searchQuery]);

  // Event handlers
  const handleEditComplaint = useCallback(async () => {
    setIsProcessing(true);
    try {
      // In real app: await apiWithHostel.updateComplaint(id, formData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditModalOpen(false);
      toast.success('Complaint updated successfully');
      // Reload complaint data
    } catch {
      toast.error('Failed to update complaint');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) return;
    
    setIsProcessing(true);
    try {
      // In real app: await apiWithHostel.addComplaintComment(id, commentText);
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsAddCommentModalOpen(false);
      setCommentText('');
      toast.success('Comment added successfully');
      // Add to timeline
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setIsProcessing(false);
    }
  }, [commentText]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    setIsProcessing(true);
    try {
      // In real app: await apiWithHostel.updateComplaintStatus(id, newStatus);
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`Status updated to ${newStatus}`);
      // Update complaint state
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleReaction = useCallback(async (...args: unknown[]) => {
    void args;
    try {
      toast.success('Reaction added');
    } catch {
      toast.error('Failed to add reaction');
    }
  }, []);

  const handleShare = useCallback(async () => {
    try {
      const url = `${window.location.origin}/dashboard/complaints/${id}`;
      if (navigator.share) {
        await navigator.share({
          title: `Complaint: ${complaint?.title}`,
          text: complaint?.description,
          url
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch {
      toast.error('Failed to share complaint');
    }
  }, [id, complaint]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExport = useCallback(async () => {
    try {
      // Generate and download PDF
      toast.success('Complaint exported successfully');
    } catch {
      toast.error('Failed to export complaint');
    }
  }, []);

  // Memoized helper functions
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'Critical': return 'error';
      case 'High': return 'error';
      case 'Medium': return 'warning';
      case 'Low': return 'primary';
      default: return 'neutral';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCwIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="text-center py-12">
        <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Complaint</h3>
        <p className="text-gray-600 mb-4">{error || 'Complaint not found'}</p>
        <Link href="/dashboard/complaints">
          <Button variant="outline">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Complaints
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-start space-x-4">
          <Link href="/dashboard/complaints" className="text-gray-500 hover:text-gray-700 mt-1">
            <ArrowLeftIcon size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{complaint.title}</h1>
              <StatusBadge status={complaint.status} slaViolation={complaint.slaViolation} />
              <Badge variant={getPriorityColor(complaint.priority)}>
                {complaint.priority} Priority
              </Badge>
              {complaint.urgencyScore && complaint.urgencyScore > 80 && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
                  <AlertTriangleIcon className="w-3 h-3 mr-1" />
                  High Urgency ({complaint.urgencyScore}%)
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center">
                <AlertCircleIcon className="w-4 h-4 mr-1" />
                #{complaint.id}
              </span>
              <span className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Created {formatDate(complaint.createdAt)}
              </span>
              {complaint.category && (
                <span className="flex items-center">
                  <TagIcon className="w-4 h-4 mr-1" />
                  {complaint.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <ShareIcon className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          {allowEditing && (
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          <Button 
            variant="text" 
            size="sm"
            onClick={() => setShowAdvancedActions(!showAdvancedActions)}
          >
            <MoreHorizontalIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Details */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed mb-6">
                {complaint.description}
              </p>

              {/* Tags */}
              {complaint.tags && complaint.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {complaint.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Attachments</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {complaint.attachments.map(attachment => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {attachment.type.startsWith('image/') ? (
                            <CameraIcon className="w-5 h-5 text-blue-600" />
                          ) : attachment.type.startsWith('video/') ? (
                            <MicIcon className="w-5 h-5 text-purple-600" />
                          ) : (
                            <FileTextIcon className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{attachment.name}</p>
                          <p className="text-sm text-gray-500">
                            {Math.round(attachment.size / 1024)}KB • {attachment.uploadedBy}
                          </p>
                        </div>
                        <ExternalLinkIcon className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Location Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <BuildingIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span>{complaint.hostel.name}</span>
                      {complaint.hostel.block && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          Block {complaint.hostel.block}
                        </span>
                      )}
                    </div>
                    {complaint.room && (
                      <div className="flex items-center">
                        <HomeIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span>Room {complaint.room}</span>
                        {complaint.hostel.floor && (
                          <span className="ml-2 text-gray-500">• Floor {complaint.hostel.floor}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Reporter Information</h4>
                  <div className="flex items-center space-x-3">
                    {complaint.reportedBy.image ? (
                      <Image 
                        src={complaint.reportedBy.image} 
                        alt={complaint.reportedBy.name} 
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {complaint.reportedBy.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{complaint.reportedBy.name}</p>
                      <p className="text-sm text-gray-600">{complaint.reportedBy.role}</p>
                    </div>
                  </div>
                  {complaint.reportedBy.email && (
                    <div className="mt-2 flex items-center space-x-2">
                      <a href={`mailto:${complaint.reportedBy.email}`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                        <MailIcon className="w-4 h-4 mr-1" />
                        {complaint.reportedBy.email}
                      </a>
                    </div>
                  )}
                  {complaint.reportedBy.phone && (
                    <div className="mt-1 flex items-center space-x-2">
                      <a href={`tel:${complaint.reportedBy.phone}`} className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                        <PhoneIcon className="w-4 h-4 mr-1" />
                        {complaint.reportedBy.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Info */}
              {complaint.assignedTo && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Assigned To</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {complaint.assignedTo.image ? (
                        <Image 
                          src={complaint.assignedTo.image} 
                          alt={complaint.assignedTo.name} 
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
                          {complaint.assignedTo.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{complaint.assignedTo.name}</p>
                        <p className="text-sm text-gray-600">{complaint.assignedTo.role}</p>
                      </div>
                    </div>
                    {complaint.assignedTo.workload && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        complaint.assignedTo.workload > 15 ? 'bg-red-100 text-red-800' :
                        complaint.assignedTo.workload > 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {complaint.assignedTo.workload} active tasks
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                <h3 className="text-lg font-medium text-gray-900">Activity Timeline</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search timeline..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 text-sm"
                    />
                  </div>
                  <select
                    value={timelineFilter}
                    onChange={(e) => setTimelineFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Events</option>
                    <option value="comment">Comments</option>
                    <option value="status_change">Status Changes</option>
                    <option value="assigned">Assignments</option>
                    <option value="attached">Attachments</option>
                  </select>
                  {allowComments && (
                    <Button size="sm" onClick={() => setIsAddCommentModalOpen(true)}>
                      <MessageSquareIcon className="w-4 h-4 mr-2" />
                      Add Comment
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {filteredTimeline.length > 0 ? (
                  filteredTimeline.map((event, index) => (
                    <div key={event.id} className="relative">
                      {index !== filteredTimeline.length - 1 && (
                        <div className="absolute top-12 left-4 w-0.5 h-full bg-gray-200" />
                      )}
                      <TimelineEventCard
                        event={event}
                        onReaction={enableCollaboration ? handleReaction : undefined}
                        enableReactions={enableCollaboration}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquareIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No timeline events found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            
            {allowStatusChange && (
              <div className="space-y-3 mb-6">
                {complaint.status === 'Open' && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusChange('In Progress')}
                    disabled={isProcessing}
                  >
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    Start Progress
                  </Button>
                )}
                
                {complaint.status === 'In Progress' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={() => handleStatusChange('Resolved')}
                    disabled={isProcessing}
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}

                {(complaint.status === 'Open' || complaint.status === 'In Progress') && (
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50" 
                    onClick={() => handleStatusChange('Closed')}
                    disabled={isProcessing}
                  >
                    <XCircleIcon className="w-4 h-4 mr-2" />
                    Close Without Resolving
                  </Button>
                )}

                {complaint.status === 'In Progress' && enableAdvancedFeatures && (
                  <Button 
                    variant="outline" 
                    className="w-full text-orange-600 border-orange-200 hover:bg-orange-50" 
                    onClick={() => handleStatusChange('Escalated')}
                    disabled={isProcessing}
                  >
                    <TrendingUpIcon className="w-4 h-4 mr-2" />
                    Escalate
                  </Button>
                )}
              </div>
            )}

            {allowComments && (
              <div className="border-t pt-4">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setIsAddCommentModalOpen(true)}
                >
                  <MessageSquareIcon className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            )}

            {/* Custom Actions */}
            {customActions.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="space-y-2">
                  {customActions
                    .filter(action => !action.condition || action.condition(complaint))
                    .map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'outline'}
                        className="w-full"
                        onClick={() => action.action(complaint)}
                      >
                        {action.icon}
                        <span className="ml-2">{action.label}</span>
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Metrics Panel */}
          {showMetrics && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Metrics</h3>
              <div className="space-y-4">
                {complaint.urgencyScore && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Urgency Score</span>
                      <span className="text-sm font-medium">{complaint.urgencyScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          complaint.urgencyScore >= 80 ? 'bg-red-500' :
                          complaint.urgencyScore >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${complaint.urgencyScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {complaint.resolutionTime && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Est. Resolution</span>
                    <span className="text-sm font-medium">{complaint.resolutionTime}h</span>
                  </div>
                )}

                {complaint.costEstimate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cost Estimate</span>
                    <span className="text-sm font-medium">₹{complaint.costEstimate.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Timeline Events</span>
                  <span className="text-sm font-medium">{complaint.timeline.length}</span>
                </div>

                {complaint.watchers && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Watchers</span>
                    <span className="text-sm font-medium">{complaint.watchers.length}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Related Information</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Hostel</h4>
                <Link 
                  href={`/dashboard/hostels/${complaint.hostel.id}`} 
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <BuildingIcon className="w-4 h-4 mr-2" />
                  <span>{complaint.hostel.name}</span>
                  <ExternalLinkIcon className="w-3 h-3 ml-1" />
                </Link>
              </div>

              {complaint.room && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Room</h4>
                  <Link 
                    href={`/dashboard/rooms?hostel=${complaint.hostel.id}&room=${complaint.room}`} 
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <HomeIcon className="w-4 h-4 mr-2" />
                    <span>Room {complaint.room}</span>
                    <ExternalLinkIcon className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Reported By</h4>
                <Link 
                  href={`/dashboard/students?id=${complaint.reportedBy.id}`} 
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  <span>{complaint.reportedBy.name}</span>
                  <ExternalLinkIcon className="w-3 h-3 ml-1" />
                </Link>
              </div>

              {complaint.relatedComplaints && complaint.relatedComplaints.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Related Complaints</h4>
                  <div className="space-y-1">
                    {complaint.relatedComplaints.slice(0, 3).map(relatedId => (
                      <Link 
                        key={relatedId}
                        href={`/dashboard/complaints/${relatedId}`} 
                        className="block text-blue-600 hover:text-blue-800 text-sm"
                      >
                        #{relatedId}
                      </Link>
                    ))}
                    {complaint.relatedComplaints.length > 3 && (
                      <p className="text-xs text-gray-500">+{complaint.relatedComplaints.length - 3} more</p>
                    )}
                  </div>
                </div>
              )}

              {complaint.watchers && complaint.watchers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Watchers</h4>
                  <div className="space-y-1">
                    {complaint.watchers.map(watcher => (
                      <div key={watcher.id} className="flex items-center space-x-2 text-sm">
                        <EyeIcon className="w-3 h-3 text-gray-400" />
                        <span>{watcher.name} ({watcher.role})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isEditModalOpen && (
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          title="Edit Complaint" 
          size="lg"
        >
          <AdminComplaintForm 
            hostels={[]} // Pass actual hostels data
            rooms={[]} // Pass actual rooms data
            staff={[]} // Pass actual staff data
            initialData={{
              title: complaint.title,
              description: complaint.description,
              priority: complaint.priority,
              hostelId: complaint.hostel.id,
              roomId: complaint.room,
              status: complaint.status as 'Open' | 'In Progress' | 'Resolved' | 'Closed',
              assignedToId: complaint.assignedTo?.id,
            }}
            onSubmit={handleEditComplaint}
            onCancel={() => setIsEditModalOpen(false)}
            isEditMode={true}
          />
        </Modal>
      )}

      {isAddCommentModalOpen && (
        <Modal 
          isOpen={isAddCommentModalOpen} 
          onClose={() => setIsAddCommentModalOpen(false)} 
          title="Add Comment"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Your Comment
              </label>
              <textarea
                ref={commentRef}
                id="comment"
                rows={4}
                className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add your comment here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <input type="file" ref={fileInputRef} className="hidden" multiple />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                >
                  <PaperclipIcon className="w-4 h-4" />
                  <span>Attach files</span>
                </button>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddCommentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleAddComment} 
                  disabled={!commentText.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <SendIcon className="w-4 h-4 mr-2" />
                  )}
                  {isProcessing ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
});

ComplaintDetail.displayName = 'ComplaintDetail';

export default ComplaintDetail;
