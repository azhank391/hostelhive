'use client'

import React, { memo, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPinIcon, 
  UsersIcon, 
  HomeIcon, 
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DollarSignIcon,
  StarIcon,
  EyeIcon,
  SettingsIcon,
  EditIcon,
  MoreVerticalIcon,
  WifiIcon,
  CarIcon,
  UtensilsIcon,
  ShieldIcon,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  BarChart3Icon,
  ArrowRightIcon,
  InfoIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ExternalLinkIcon,
  ShareIcon,
  HeartIcon,
  BookmarkIcon
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import toast from '@/lib/toast';

interface HostelStats {
  averageRating?: number;
  monthlyRevenue?: number;
  occupancyTrend?: 'up' | 'down' | 'stable';
  maintenanceRequests?: number;
  avgStayDuration?: number;
  satisfactionScore?: number;
  lastInspection?: string;
  upcomingEvents?: number;
  recentActivity?: string;
}

interface HostelFeatures {
  wifi?: boolean;
  parking?: boolean;
  cafeteria?: boolean;
  security?: boolean;
  laundry?: boolean;
  gym?: boolean;
  library?: boolean;
  commonRoom?: boolean;
}

interface ContactInfo {
  phone?: string;
  email?: string;
  manager?: {
    name: string;
    image?: string;
    phone?: string;
  };
}

interface OptimizedHostelCardProps {
  id: string;
  name: string;
  location: string;
  image: string;
  totalRooms: number;
  occupiedRooms: number;
  totalStudents: number;
  status: 'active' | 'maintenance' | 'inactive' | 'full' | 'new';
  stats?: HostelStats;
  features?: HostelFeatures;
  contact?: ContactInfo;
  pricing?: {
    minRent: number;
    maxRent: number;
    currency?: string;
  };
  tags?: string[];
  priority?: 'high' | 'medium' | 'low';
  isWatchlisted?: boolean;
  showAdvancedMetrics?: boolean;
  showQuickActions?: boolean;
  compact?: boolean;
  enableHover?: boolean;
  onEdit?: (hostelId: string) => void;
  onView?: (hostelId: string) => void;
  onWatchlist?: (hostelId: string, isWatchlisted: boolean) => void;
  onShare?: (hostelId: string) => void;
  onStatusToggle?: (hostelId: string, newStatus: boolean) => Promise<void>;
  customActions?: Array<{
    label: string;
    icon: React.ReactNode;
    action: (hostelId: string) => void;
    variant?: 'primary' | 'outline' | 'text';
  }>;
}

// Memoized status badge component
const StatusBadge = memo(({ 
  status, 
  priority, 
  onToggle, 
  isProcessing = false 
}: { 
  status: string; 
  priority?: string; 
  onToggle?: () => void;
  isProcessing?: boolean;
}) => {
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'active':
        return { variant: 'success' as const, label: 'Active', color: 'bg-green-100 text-green-800' };
      case 'maintenance':
        return { variant: 'warning' as const, label: 'Under Maintenance', color: 'bg-yellow-100 text-yellow-800' };
      case 'inactive':
        return { variant: 'error' as const, label: 'Inactive', color: 'bg-red-100 text-red-800' };
      case 'full':
        return { variant: 'error' as const, label: 'Full Capacity', color: 'bg-red-100 text-red-800' };
      case 'new':
        return { variant: 'primary' as const, label: 'New', color: 'bg-blue-100 text-blue-800' };
      default:
        return { variant: 'neutral' as const, label: status, color: 'bg-gray-100 text-gray-800' };
    }
  }, [status]);

  const isClickable = onToggle && (status === 'active' || status === 'inactive');

  return (
    <div className="flex items-center space-x-2">
      {isClickable ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggle?.();
          }}
          disabled={isProcessing}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-2 border-transparent hover:border-gray-300 ring-2 ring-transparent hover:ring-blue-200 ${statusConfig.color}`}
          title={status === 'active' ? 'Click to deactivate' : 'Click to activate'}
        >
          {isProcessing ? (
            <div className="flex items-center">
              <RefreshCwIcon className="w-3 h-3 mr-1 animate-spin" />
              Updating...
            </div>
          ) : (
            <div className="flex items-center">
              {statusConfig.label}
              <span className="ml-1 text-xs opacity-70 font-bold">↻</span>
            </div>
          )}
        </button>
      ) : (
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      )}
      {priority && priority === 'high' && (
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
          <AlertTriangleIcon className="w-3 h-3 mr-1" />
          High Priority
        </span>
      )}
    </div>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Memoized occupancy display component
const OccupancyDisplay = memo(({ 
  occupiedRooms, 
  totalRooms, 
  showTrend = false, 
  trend 
}: {
  occupiedRooms: number;
  totalRooms: number;
  showTrend?: boolean;
  trend?: 'up' | 'down' | 'stable';
}) => {
  const occupancyPercentage = useMemo(() => 
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
  , [occupiedRooms, totalRooms]);

  const occupancyColor = useMemo(() => {
    if (occupancyPercentage >= 95) return 'bg-red-500';
    if (occupancyPercentage >= 80) return 'bg-yellow-500';
    if (occupancyPercentage >= 60) return 'bg-blue-500';
    return 'bg-green-500';
  }, [occupancyPercentage]);

  const availableRooms = totalRooms - occupiedRooms;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <HomeIcon className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Occupancy</span>
        </div>
        {showTrend && trend && (
          <div className="flex items-center">
            {trend === 'up' && <TrendingUpIcon className="w-4 h-4 text-green-600" />}
            {trend === 'down' && <TrendingDownIcon className="w-4 h-4 text-red-600" />}
            {trend === 'stable' && <ArrowRightIcon className="w-4 h-4 text-gray-600" />}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-900">
            {occupiedRooms}/{totalRooms} rooms
          </span>
          <span className={`font-medium ${
            occupancyPercentage >= 95 ? 'text-red-600' :
            occupancyPercentage >= 80 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {occupancyPercentage}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${occupancyColor}`}
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
        
        {availableRooms > 0 && (
          <p className="text-xs text-gray-500">
            {availableRooms} room{availableRooms !== 1 ? 's' : ''} available
          </p>
        )}
      </div>
    </div>
  );
});

OccupancyDisplay.displayName = 'OccupancyDisplay';

// Memoized features display component
const FeaturesDisplay = memo(({ features }: { features: HostelFeatures }) => {
  const featureIcons = useMemo(() => ({
    wifi: <WifiIcon className="w-3 h-3" />,
    parking: <CarIcon className="w-3 h-3" />,
    cafeteria: <UtensilsIcon className="w-3 h-3" />,
    security: <ShieldIcon className="w-3 h-3" />,
    laundry: <RefreshCwIcon className="w-3 h-3" />,
    gym: <TrendingUpIcon className="w-3 h-3" />,
    library: <BookmarkIcon className="w-3 h-3" />,
    commonRoom: <UsersIcon className="w-3 h-3" />
  }), []);

  const availableFeatures = useMemo(() => 
    Object.entries(features).filter(([_, available]) => available)
  , [features]);

  if (availableFeatures.length === 0) return null;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">Features</p>
      <div className="flex flex-wrap gap-1">
        {availableFeatures.slice(0, 4).map(([feature, _]) => (
          <div 
            key={feature}
            className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
            title={feature.charAt(0).toUpperCase() + feature.slice(1)}
          >
            {featureIcons[feature as keyof typeof featureIcons]}
            <span className="capitalize">{feature}</span>
          </div>
        ))}
        {availableFeatures.length > 4 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
            +{availableFeatures.length - 4} more
          </span>
        )}
      </div>
    </div>
  );
});

FeaturesDisplay.displayName = 'FeaturesDisplay';

// Memoized metrics display component
const MetricsDisplay = memo(({ stats }: { stats: HostelStats }) => {
  const metrics = useMemo(() => {
    const items = [];
    
    if (stats.averageRating) {
      items.push({
        label: 'Rating',
        value: stats.averageRating.toFixed(1),
        icon: <StarIcon className="w-3 h-3" />,
        color: 'text-yellow-600'
      });
    }
    
    if (stats.monthlyRevenue) {
      items.push({
        label: 'Revenue',
        value: `₹${(stats.monthlyRevenue / 1000).toFixed(0)}K`,
        icon: <DollarSignIcon className="w-3 h-3" />,
        color: 'text-green-600'
      });
    }
    
    if (stats.satisfactionScore) {
      items.push({
        label: 'Satisfaction',
        value: `${stats.satisfactionScore}%`,
        icon: <CheckCircleIcon className="w-3 h-3" />,
        color: 'text-blue-600'
      });
    }
    
    if (stats.maintenanceRequests !== undefined) {
      items.push({
        label: 'Maintenance',
        value: stats.maintenanceRequests.toString(),
        icon: <AlertTriangleIcon className="w-3 h-3" />,
        color: stats.maintenanceRequests > 5 ? 'text-red-600' : 'text-gray-600'
      });
    }
    
    return items.slice(0, 2); // Show only top 2 metrics
  }, [stats]);

  if (metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {metrics.map((metric, index) => (
        <div key={index} className="text-center">
          <div className={`flex items-center justify-center space-x-1 ${metric.color}`}>
            {metric.icon}
            <span className="text-sm font-semibold">{metric.value}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{metric.label}</p>
        </div>
      ))}
    </div>
  );
});

MetricsDisplay.displayName = 'MetricsDisplay';

export const HostelCard = memo<OptimizedHostelCardProps>(({
  id,
  name,
  location,
  image,
  totalRooms,
  occupiedRooms,
  totalStudents,
  status,
  stats = {},
  features = {},
  contact,
  pricing,
  tags = [],
  priority,
  isWatchlisted = false,
  showAdvancedMetrics = false,
  showQuickActions = true,
  compact = false,
  enableHover = true,
  onEdit,
  onView,
  onWatchlist,
  onShare,
  onStatusToggle,
  customActions = []
}) => {
  // State management
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Memoized calculations
  const occupancyPercentage = useMemo(() => 
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
  , [occupiedRooms, totalRooms]);

  const isNearCapacity = useMemo(() => occupancyPercentage >= 90, [occupancyPercentage]);
  const isHighOccupancy = useMemo(() => occupancyPercentage >= 80, [occupancyPercentage]);

  const statusColor = useMemo(() => {
    if (status === 'inactive') return 'border-red-200 bg-red-50';
    if (status === 'maintenance') return 'border-yellow-200 bg-yellow-50';
    if (isNearCapacity) return 'border-orange-200 bg-orange-50';
    return 'border-gray-200 bg-white';
  }, [status, isNearCapacity]);

  // Event handlers
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleWatchlist = useCallback(async () => {
    if (!onWatchlist) return;
    
    setIsProcessing(true);
    try {
      await onWatchlist(id, !isWatchlisted);
      toast.success(isWatchlisted ? 'Removed from watchlist' : 'Added to watchlist');
    } catch (error) {
      toast.error('Failed to update watchlist');
    } finally {
      setIsProcessing(false);
    }
  }, [onWatchlist, id, isWatchlisted]);

  const handleShare = useCallback(async () => {
    if (onShare) {
      await onShare(id);
    } else {
      try {
        const url = `${window.location.origin}/dashboard/hostels/${id}`;
        if (navigator.share) {
          await navigator.share({
            title: `Hostel: ${name}`,
            text: `Check out ${name} hostel located at ${location}`,
            url
          });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard');
        }
      } catch (error) {
        toast.error('Failed to share hostel');
      }
    }
  }, [onShare, id, name, location]);

  const handleView = useCallback(() => {
    if (onView) {
      onView(id);
    }
  }, [onView, id]);

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(id);
    }
  }, [onEdit, id]);

  const handleStatusToggle = useCallback(async () => {
    if (!onStatusToggle) return;
    
    setIsProcessing(true);
    try {
      const newStatus = status !== 'active';
      await onStatusToggle(id, newStatus);
      toast.success(newStatus ? 'Hostel activated successfully!' : 'Hostel deactivated successfully!');
    } catch (error) {
      console.error('Failed to toggle hostel status:', error);
      toast.error('Failed to update hostel status');
    } finally {
      setIsProcessing(false);
    }
  }, [onStatusToggle, id, status]);

  // Quick actions
  const quickActions = useMemo(() => {
    const actions = [];

    if (onView) {
      actions.push({
        label: 'View Details',
        icon: <EyeIcon className="w-4 h-4" />,
        action: handleView,
        variant: 'outline' as const
      });
    }

    if (onEdit && status !== 'inactive') {
      actions.push({
        label: 'Edit',
        icon: <EditIcon className="w-4 h-4" />,
        action: handleEdit,
        variant: 'outline' as const
      });
    }

    actions.push({
      label: 'Share',
      icon: <ShareIcon className="w-4 h-4" />,
      action: handleShare,
      variant: 'outline' as const
    });

    // Add custom actions
    actions.push(...customActions);

    return actions;
  }, [onView, onEdit, status, handleView, handleEdit, handleShare, customActions]);

  if (compact) {
    return (
      <div className={`border rounded-lg p-4 transition-all ${statusColor} ${
        enableHover ? 'hover:shadow-md hover:border-blue-300' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
              <StatusBadge 
                status={status} 
                priority={priority} 
                onToggle={onStatusToggle ? handleStatusToggle : undefined}
                isProcessing={isProcessing}
              />
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-1" />
                {location}
              </span>
              <span className="flex items-center">
                <HomeIcon className="w-4 h-4 mr-1" />
                {occupiedRooms}/{totalRooms}
              </span>
              <span className="flex items-center">
                <UsersIcon className="w-4 h-4 mr-1" />
                {totalStudents}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              isNearCapacity ? 'text-red-600' : isHighOccupancy ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {occupancyPercentage}%
            </span>
            <Link href={`/dashboard/hostels/${id}`}>
              <Button variant="outline" size="sm">
                <ExternalLinkIcon className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
        enableHover ? 'hover:shadow-lg hover:scale-[1.01]' : ''
      } ${priority === 'high' ? 'ring-2 ring-red-200' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Image Header */}
      <div className="relative h-40 overflow-hidden">
        {!imageError ? (
          <Image 
            src={image} 
            alt={name} 
            fill 
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <HomeIcon className="w-12 h-12 text-white opacity-50" />
          </div>
        )}
        
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <RefreshCwIcon className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Status Badge Overlay */}
        <div className="absolute top-3 left-3 z-10">
          <StatusBadge 
            status={status} 
            priority={priority} 
            onToggle={onStatusToggle ? handleStatusToggle : undefined}
            isProcessing={isProcessing}
          />
        </div>

        {/* Quick Actions Overlay */}
        {showQuickActions && showActions && quickActions.length > 0 && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-md">
              {onWatchlist && (
                <button
                  onClick={handleWatchlist}
                  disabled={isProcessing}
                  className={`p-1 rounded-md transition-colors ${
                    isWatchlisted 
                      ? 'text-red-600 hover:text-red-700 bg-red-50' 
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  <HeartIcon className={`w-3 h-3 ${isWatchlisted ? 'fill-current' : ''}`} />
                </button>
              )}
              
              {quickActions.slice(0, 2).map((action, index) => (
                <button
                  key={index}
                  onClick={() => action.action(id)}
                  className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title={action.label}
                >
                  {action.icon}
                </button>
              ))}
              
              {quickActions.length > 2 && (
                <button className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors">
                  <MoreVerticalIcon className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{name}</h3>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-2">
                {tags.slice(0, 2).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center text-gray-600 mb-2">
            <MapPinIcon className="w-3 h-3 mr-2 text-blue-500" />
            <span className="text-sm font-medium">{location}</span>
          </div>

          {pricing && (
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
              <DollarSignIcon className="w-3 h-3 mr-1 text-green-500" />
              <span className="font-medium text-xs">
                {pricing.currency || '₹'}{pricing.minRent.toLocaleString()} - {pricing.currency || '₹'}{pricing.maxRent.toLocaleString()}/month
              </span>
            </div>
          )}
        </div>

        {/* Occupancy Display */}
        <div className="mb-4">
          <OccupancyDisplay
            occupiedRooms={occupiedRooms}
            totalRooms={totalRooms}
            showTrend={showAdvancedMetrics}
            trend={stats.occupancyTrend}
          />
        </div>

        {/* Students Count */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center text-gray-700">
              <UsersIcon className="w-4 h-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium">Total Students</span>
            </div>
            <span className="text-lg font-bold text-blue-900">{totalStudents}</span>
          </div>
        </div>

        {/* Advanced Metrics */}
        {showAdvancedMetrics && Object.keys(stats).length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <MetricsDisplay stats={stats} />
          </div>
        )}

        {/* Features */}
        {Object.keys(features).length > 0 && (
          <div className="mb-4">
            <FeaturesDisplay features={features} />
          </div>
        )}

        {/* Contact Info */}
        {contact && (
          <div className="mb-4 text-sm">
            {contact.manager && (
              <div className="flex items-center space-x-2 mb-2 p-2 bg-green-50 rounded-lg">
                <span className="text-gray-500">Manager:</span>
                <span className="font-medium text-green-800">{contact.manager.name}</span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-md transition-colors">
                  <PhoneIcon className="w-3 h-3 mr-1" />
                  <span className="text-xs">{contact.phone}</span>
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-md transition-colors">
                  <MailIcon className="w-3 h-3 mr-1" />
                  <span className="text-xs">Email</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {stats.recentActivity && (
          <div className="mb-4 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-700">
              <InfoIcon className="w-3 h-3" />
              <span className="font-medium text-xs">Recent:</span>
              <span className="text-xs">{stats.recentActivity}</span>
            </div>
          </div>
        )}

        {/* Alerts */}
        {(isNearCapacity || stats.maintenanceRequests && stats.maintenanceRequests > 5) && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-800 text-xs">
              <AlertCircleIcon className="w-3 h-3" />
              <span>
                {isNearCapacity && 'Near capacity • '}
                {stats.maintenanceRequests && stats.maintenanceRequests > 5 && `${stats.maintenanceRequests} pending requests`}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center space-x-2">
          <Link href={`/dashboard/hostels/${id}/detail`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
              <EyeIcon className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </Link>
          
          {showQuickActions && (
            <div className="flex items-center space-x-1">
              {onWatchlist && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleWatchlist}
                  disabled={isProcessing}
                  className={`px-2 py-2 rounded-lg transition-all duration-200 ${
                    isWatchlisted 
                      ? 'text-red-600 border-red-200 hover:bg-red-50' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <HeartIcon className={`w-3 h-3 ${isWatchlisted ? 'fill-current' : ''}`} />
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShare}
                className="px-2 py-2 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <ShareIcon className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

HostelCard.displayName = 'HostelCard';

export default HostelCard;
