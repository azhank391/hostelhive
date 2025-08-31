'use client'

import React, { memo, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Clock, 
  User, 
  Building, 
  ArrowRight, 
  AlertCircle,
  CheckCircle,
  Timer,
  Calendar,
  MapPin,
  Flag,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Settings,
  Archive,
  Share2,
  Bell,
  Star,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import toast from '@/lib/toast';

interface ComplaintCardProps {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  reportedBy: {
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
  };
  room?: string;
  category?: string;
  estimatedResolution?: string;
  assignedTo?: {
    name: string;
    role: string;
    avatar?: string;
  };
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  urgencyScore?: number;
  lastUpdated?: string;
  resolutionTime?: number;
  tags?: string[];
  comments?: number;
  createdAt: string;
  onResolve?: (complaintId: string, resolution: string) => void;
  onAssign?: (complaintId: string, assigneeId: string) => void;
  onStatusChange?: (complaintId: string, newStatus: string) => void;
  onPriorityChange?: (complaintId: string, newPriority: string) => void;
  onArchive?: (complaintId: string) => void;
  onShare?: (complaintId: string) => void;
  onNotify?: (complaintId: string) => void;
  currentUserRole?: string;
  showAdvancedActions?: boolean;
  showMetrics?: boolean;
  compact?: boolean;
  enableQuickActions?: boolean;
  enableDragDrop?: boolean;
  showTimeline?: boolean;
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    action: (complaintId: string) => void;
    condition?: (complaint: any) => boolean;
  }>;
}

// Memoized priority badge component
const PriorityBadge = memo(({ priority, urgencyScore }: { priority: string; urgencyScore?: number }) => {
  const priorityConfig = useMemo(() => {
    switch (priority) {
      case 'Critical':
        return { 
          variant: 'error' as const, 
          icon: <AlertCircle className="w-3 h-3" />,
          color: 'text-red-600 bg-red-50 border-red-200'
        };
      case 'High':
        return { 
          variant: 'error' as const, 
          icon: <Flag className="w-3 h-3" />,
          color: 'text-red-600 bg-red-50 border-red-200'
        };
      case 'Medium':
        return { 
          variant: 'warning' as const, 
          icon: <Timer className="w-3 h-3" />,
          color: 'text-orange-600 bg-orange-50 border-orange-200'
        };
      case 'Low':
        return { 
          variant: 'primary' as const, 
          icon: <Activity className="w-3 h-3" />,
          color: 'text-blue-600 bg-blue-50 border-blue-200'
        };
      default:
        return { 
          variant: 'neutral' as const, 
          icon: <Timer className="w-3 h-3" />,
          color: 'text-gray-600 bg-gray-50 border-gray-200'
        };
    }
  }, [priority]);

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${priorityConfig.color}`}>
      {priorityConfig.icon}
      <span>{priority} Priority</span>
      {urgencyScore && urgencyScore > 70 && (
        <span className="ml-1 px-1 bg-red-500 text-white rounded-full text-xs">!</span>
      )}
    </div>
  );
});

PriorityBadge.displayName = 'PriorityBadge';

// Memoized status badge component
const StatusBadge = memo(({ status, lastUpdated }: { status: string; lastUpdated?: string }) => {
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'Open':
        return { 
          variant: 'error' as const, 
          icon: <AlertCircle className="w-3 h-3" />,
          color: 'text-red-600 bg-red-50'
        };
      case 'In Progress':
        return { 
          variant: 'warning' as const, 
          icon: <Timer className="w-3 h-3 animate-pulse" />,
          color: 'text-orange-600 bg-orange-50'
        };
      case 'Resolved':
        return { 
          variant: 'success' as const, 
          icon: <CheckCircle className="w-3 h-3" />,
          color: 'text-green-600 bg-green-50'
        };
      case 'Closed':
        return { 
          variant: 'neutral' as const, 
          icon: <Archive className="w-3 h-3" />,
          color: 'text-gray-600 bg-gray-50'
        };
      default:
        return { 
          variant: 'neutral' as const, 
          icon: <Timer className="w-3 h-3" />,
          color: 'text-gray-600 bg-gray-50'
        };
    }
  }, [status]);

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
      {statusConfig.icon}
      <span>{status}</span>
      {lastUpdated && (
        <span className="text-xs opacity-75 ml-1">
          • {new Date(lastUpdated).toLocaleDateString()}
        </span>
      )}
    </div>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Memoized user avatar component
const UserAvatar = memo(({ user, size = 'sm' }: { 
  user: { name: string; image?: string; role?: string }; 
  size?: 'xs' | 'sm' | 'md' | 'lg' 
}) => {
  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'xs': return 'w-4 h-4 text-xs';
      case 'sm': return 'w-5 h-5 text-xs';
      case 'md': return 'w-8 h-8 text-sm';
      case 'lg': return 'w-10 h-10 text-base';
      default: return 'w-5 h-5 text-xs';
    }
  }, [size]);

  if (user.image) {
    return (
      <Image 
        src={user.image} 
        alt={user.name} 
        width={size === 'lg' ? 40 : size === 'md' ? 32 : 20} 
        height={size === 'lg' ? 40 : size === 'md' ? 32 : 20} 
        className={`${sizeClasses} rounded-full object-cover`} 
      />
    );
  }

  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium`}>
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

export const ComplaintCard = memo<ComplaintCardProps>(({
  id,
  title,
  description,
  status,
  priority,
  reportedBy,
  hostel,
  room,
  category,
  estimatedResolution,
  assignedTo,
  attachments,
  urgencyScore,
  lastUpdated,
  resolutionTime,
  tags,
  comments = 0,
  createdAt,
  onResolve,
  onAssign,
  onStatusChange,
  onPriorityChange,
  onArchive,
  onShare,
  onNotify,
  currentUserRole,
  showAdvancedActions = false,
  showMetrics = false,
  compact = false,
  enableQuickActions = true,
  enableDragDrop = false,
  showTimeline = false,
  customActions = []
}) => {
  // State management
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Memoized calculations
  const timeAgo = useMemo(() => {
    const date = new Date(createdAt);
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
  }, [createdAt]);

  const formattedDate = useMemo(() => {
    const date = new Date(createdAt);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [createdAt]);

  const isOverdue = useMemo(() => {
    if (!estimatedResolution) return false;
    const resolutionDate = new Date(estimatedResolution);
    const now = new Date();
    return now > resolutionDate && status !== 'Resolved' && status !== 'Closed';
  }, [estimatedResolution, status]);

  const detailsUrl = useMemo(() => {
    return currentUserRole?.toLowerCase() === 'student' 
      ? `/dashboard/student/complaints/${id}` 
      : `/dashboard/complaints/${id}`;
  }, [currentUserRole, id]);

  // Event handlers
  const handleResolve = useCallback(async () => {
    if (!onResolve) return;
    
    const resolution = prompt('Enter resolution details:');
    if (resolution && resolution.trim()) {
      setIsProcessing(true);
      try {
        await onResolve(id, resolution.trim());
        toast.success('Complaint resolved successfully');
      } catch (error) {
        toast.error('Failed to resolve complaint');
      } finally {
        setIsProcessing(false);
      }
    }
  }, [onResolve, id]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!onStatusChange) return;
    
    setIsProcessing(true);
    try {
      await onStatusChange(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  }, [onStatusChange, id]);

  const handleShare = useCallback(async () => {
    if (onShare) {
      await onShare(id);
    } else {
      // Default share functionality
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Complaint: ${title}`,
            text: description,
            url: window.location.origin + detailsUrl
          });
        } catch (error) {
          // Fallback to clipboard
          await navigator.clipboard.writeText(window.location.origin + detailsUrl);
          toast.success('Link copied to clipboard');
        }
      } else {
        await navigator.clipboard.writeText(window.location.origin + detailsUrl);
        toast.success('Link copied to clipboard');
      }
    }
  }, [onShare, id, title, description, detailsUrl]);

  const handleNotify = useCallback(async () => {
    if (onNotify) {
      await onNotify(id);
      toast.success('Notification sent');
    }
  }, [onNotify, id]);

  // Quick action items
  const quickActions = useMemo(() => {
    const actions = [];

    if (onStatusChange && status !== 'Resolved' && status !== 'Closed') {
      actions.push({
        label: 'Mark In Progress',
        icon: <Timer className="w-4 h-4" />,
        action: () => handleStatusChange('In Progress'),
        condition: status === 'Open'
      });
      
      actions.push({
        label: 'Resolve',
        icon: <CheckCircle className="w-4 h-4" />,
        action: handleResolve,
        condition: status === 'Open' || status === 'In Progress'
      });
    }

    if (onArchive && (status === 'Resolved' || status === 'Closed')) {
      actions.push({
        label: 'Archive',
        icon: <Archive className="w-4 h-4" />,
        action: () => onArchive(id),
        condition: true
      });
    }

    actions.push({
      label: 'Share',
      icon: <Share2 className="w-4 h-4" />,
      action: handleShare,
      condition: true
    });

    if (onNotify && currentUserRole !== 'student') {
      actions.push({
        label: 'Notify',
        icon: <Bell className="w-4 h-4" />,
        action: handleNotify,
        condition: true
      });
    }

    // Add custom actions
    actions.push(...customActions.map(action => ({
      ...action,
      condition: action.condition ? action.condition({ id, status, priority, reportedBy, hostel }) : true
    })));

    return actions.filter(action => action.condition);
  }, [onStatusChange, status, onArchive, onNotify, currentUserRole, customActions, id, priority, reportedBy, hostel, handleStatusChange, handleResolve, handleShare, handleNotify]);

  if (compact) {
    return (
      <div className="bg-white border rounded-lg p-3 hover:shadow-sm transition-all">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">{title}</h4>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-gray-600 truncate">{description}</p>
            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
              <span>{reportedBy.name}</span>
              <span>•</span>
              <span>{timeAgo}</span>
              {room && (
                <>
                  <span>•</span>
                  <span>Room {room}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <PriorityBadge priority={priority} urgencyScore={urgencyScore} />
            <Link href={detailsUrl}>
              <Button variant="outline" size="sm">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 ${
        isOverdue ? 'ring-2 ring-red-200' : ''
      } ${enableDragDrop ? 'cursor-move' : ''}`}
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => setShowQuickActions(false)}
    >
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start space-x-2 mb-2">
              <h3 
                className="text-lg font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setExpanded(!expanded)}
              >
                {title}
              </h3>
              {isOverdue && (
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Overdue
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} lastUpdated={lastUpdated} />
              <PriorityBadge priority={priority} urgencyScore={urgencyScore} />
              {category && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {category}
                </span>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          {enableQuickActions && showQuickActions && quickActions.length > 0 && (
            <div className="flex items-center space-x-1 ml-2">
              {quickActions.slice(0, 3).map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => action.action(id)}
                  disabled={isProcessing}
                  className="opacity-75 hover:opacity-100"
                  title={action.label}
                >
                  {action.icon}
                </Button>
              ))}
              {quickActions.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickActions(true)}
                  title="More actions"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className={`text-gray-600 mb-4 ${expanded ? '' : 'line-clamp-2'}`}>
          {description}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Building className="w-4 h-4 mr-2 text-gray-400" />
            <span>{hostel.name}</span>
            {hostel.block && <span className="ml-1 text-gray-500">({hostel.block})</span>}
            {room && (
              <>
                <MapPin className="w-4 h-4 ml-2 mr-1 text-gray-400" />
                <span>Room {room}</span>
              </>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            <UserAvatar user={reportedBy} size="sm" />
            <span className="ml-2">
              {reportedBy.name} ({reportedBy.role})
            </span>
            {reportedBy.email && (
              <a href={`mailto:${reportedBy.email}`} className="ml-2 text-blue-600 hover:text-blue-800">
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span>Reported {timeAgo} ({formattedDate})</span>
          </div>

          {assignedTo && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              <span>Assigned to:</span>
              <UserAvatar user={assignedTo} size="sm" />
              <span className="ml-2">{assignedTo.name} ({assignedTo.role})</span>
            </div>
          )}

          {estimatedResolution && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span>
                Expected resolution: {new Date(estimatedResolution).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Metrics */}
        {showMetrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            {comments > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{comments}</span>
                </div>
                <span className="text-xs text-gray-500">Comments</span>
              </div>
            )}
            
            {urgencyScore && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{urgencyScore}%</span>
                </div>
                <span className="text-xs text-gray-500">Urgency</span>
              </div>
            )}

            {resolutionTime && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Timer className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{resolutionTime}h</span>
                </div>
                <span className="text-xs text-gray-500">Resolution</span>
              </div>
            )}

            {attachments && attachments.length > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Archive className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-900">{attachments.length}</span>
                </div>
                <span className="text-xs text-gray-500">Files</span>
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {attachments && attachments.length > 0 && expanded && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Attachments</h5>
            <div className="flex flex-wrap gap-2">
              {attachments.map(attachment => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-100"
                >
                  <Archive className="w-3 h-3" />
                  <span>{attachment.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Action */}
        {onResolve && status !== 'Resolved' && status !== 'Closed' && currentUserRole !== 'student' && (
          <div className="mb-4">
            <Button
              onClick={handleResolve}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              {isProcessing ? (
                <Timer className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? 'Resolving...' : 'Resolve Complaint'}
            </Button>
          </div>
        )}

        {/* View Details Link */}
        <Link 
          href={detailsUrl} 
          className="flex items-center justify-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Details
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
});

ComplaintCard.displayName = 'ComplaintCard';

export default ComplaintCard;
