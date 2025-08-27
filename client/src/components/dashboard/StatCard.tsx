'use client'

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  InfoIcon, 
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  BarChart3Icon,
  PieChartIcon,
  LineChartIcon
} from 'lucide-react';

interface StatTrend {
  value: number;
  isPositive: boolean;
  period?: string;
  percentage?: boolean;
  comparison?: string;
}

interface StatAlert {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  threshold?: number;
}

interface StatAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface OptimizedStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: StatTrend;
  className?: string;
  loading?: boolean;
  error?: string;
  alert?: StatAlert;
  actions?: StatAction[];
  formatValue?: boolean;
  animateValue?: boolean;
  showChart?: boolean;
  chartData?: number[];
  chartType?: 'line' | 'bar' | 'pie';
  refreshable?: boolean;
  onRefresh?: () => void;
  clickable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'minimal' | 'bordered';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

// Memoized trend indicator component
const TrendIndicator = memo(({ trend }: { trend: StatTrend }) => {
  const trendIcon = useMemo(() => {
    if (trend.value === 0) return <MinusIcon className="w-4 h-4" />;
    return trend.isPositive ? 
      <ArrowUpIcon className="w-4 h-4" /> : 
      <ArrowDownIcon className="w-4 h-4" />;
  }, [trend.value, trend.isPositive]);

  const trendColor = useMemo(() => {
    if (trend.value === 0) return 'text-gray-500';
    return trend.isPositive ? 'text-green-600' : 'text-red-600';
  }, [trend.value, trend.isPositive]);

  const trendValue = useMemo(() => {
    const formattedValue = trend.percentage ? 
      `${Math.abs(trend.value)}%` : 
      Math.abs(trend.value).toLocaleString();
    
    const prefix = trend.value > 0 ? '+' : trend.value < 0 ? '-' : '';
    return `${prefix}${formattedValue}`;
  }, [trend.value, trend.percentage]);

  return (
    <div className="flex items-center space-x-1">
      <span className={`flex items-center text-sm font-medium ${trendColor}`}>
        {trendIcon}
        <span className="ml-1">{trendValue}</span>
      </span>
      {trend.period && (
        <span className="text-sm text-gray-500">
          {trend.period}
        </span>
      )}
      {trend.comparison && (
        <span className="text-xs text-gray-400">
          vs {trend.comparison}
        </span>
      )}
    </div>
  );
});

TrendIndicator.displayName = 'TrendIndicator';

// Memoized alert component
const StatAlertComponent = memo(({ alert }: { alert: StatAlert }) => {
  const alertConfig = useMemo(() => {
    switch (alert.type) {
      case 'error':
        return {
          icon: <AlertCircleIcon className="w-4 h-4" />,
          className: 'bg-red-50 border-red-200 text-red-800'
        };
      case 'warning':
        return {
          icon: <AlertCircleIcon className="w-4 h-4" />,
          className: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        };
      case 'success':
        return {
          icon: <CheckCircleIcon className="w-4 h-4" />,
          className: 'bg-green-50 border-green-200 text-green-800'
        };
      default:
        return {
          icon: <InfoIcon className="w-4 h-4" />,
          className: 'bg-blue-50 border-blue-200 text-blue-800'
        };
    }
  }, [alert.type]);

  return (
    <div className={`p-2 rounded-md border flex items-center space-x-2 ${alertConfig.className}`}>
      {alertConfig.icon}
      <span className="text-xs font-medium">{alert.message}</span>
    </div>
  );
});

StatAlertComponent.displayName = 'StatAlertComponent';

// Memoized mini chart component
const MiniChart = memo(({ 
  data, 
  type = 'line',
  height = 40,
  width = 80 
}: { 
  data: number[];
  type?: 'line' | 'bar' | 'pie';
  height?: number;
  width?: number;
}) => {
  const chartIcon = useMemo(() => {
    switch (type) {
      case 'bar': return <BarChart3Icon className="w-8 h-8 text-gray-400" />;
      case 'pie': return <PieChartIcon className="w-8 h-8 text-gray-400" />;
      default: return <LineChartIcon className="w-8 h-8 text-gray-400" />;
    }
  }, [type]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height, width }}>
        {chartIcon}
      </div>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  if (type === 'line') {
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="text-blue-500">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  }

  if (type === 'bar') {
    const barWidth = width / data.length - 2;
    return (
      <svg width={width} height={height} className="text-blue-500">
        {data.map((value, index) => {
          const barHeight = ((value - min) / range) * height;
          const x = index * (barWidth + 2);
          const y = height - barHeight;
          return (
            <rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="currentColor"
            />
          );
        })}
      </svg>
    );
  }

  return (
    <div className="flex items-center justify-center" style={{ height, width }}>
      {chartIcon}
    </div>
  );
});

MiniChart.displayName = 'MiniChart';

// Animated counter component
const AnimatedValue = memo(({ 
  value, 
  formatValue = false,
  duration = 1000 
}: { 
  value: string | number;
  formatValue?: boolean;
  duration?: number;
}) => {
  const [displayValue, setDisplayValue] = useState<string | number>(0);

  useEffect(() => {
    if (typeof value === 'string') {
      setDisplayValue(value);
      return;
    }

    const startValue = 0;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);
      
      if (formatValue) {
        setDisplayValue(currentValue.toLocaleString());
      } else {
        setDisplayValue(currentValue);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [value, formatValue, duration]);

  return <span>{displayValue}</span>;
});

AnimatedValue.displayName = 'AnimatedValue';

export const StatCard = memo<OptimizedStatCardProps>(({
  title,
  value,
  icon,
  description,
  trend,
  className = '',
  loading = false,
  error,
  alert,
  actions = [],
  formatValue = false,
  animateValue = false,
  showChart = false,
  chartData = [],
  chartType = 'line',
  refreshable = false,
  onRefresh,
  clickable = false,
  onClick,
  size = 'md',
  variant = 'default',
  priority = 'medium'
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Card styling based on variant and size
  const cardClasses = useMemo(() => {
    const baseClasses = 'relative transition-all duration-200 overflow-hidden';
    
    const sizeClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    const variantClasses = {
      default: 'bg-white rounded-lg shadow hover:shadow-md',
      gradient: 'bg-gradient-to-br from-white to-gray-50 rounded-lg shadow hover:shadow-md',
      minimal: 'bg-gray-50 rounded-md border border-gray-200 hover:bg-white hover:shadow-sm',
      bordered: 'bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300'
    };

    const priorityClasses = {
      low: '',
      medium: '',
      high: 'ring-2 ring-orange-200',
      critical: 'ring-2 ring-red-200'
    };

    const interactiveClasses = clickable ? 'cursor-pointer transform hover:scale-105' : '';

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${priorityClasses[priority]} ${interactiveClasses} ${className}`;
  }, [size, variant, priority, clickable, className]);

  // Icon styling
  const iconClasses = useMemo(() => {
    const sizeClasses = {
      sm: 'p-2',
      md: 'p-3',
      lg: 'p-4'
    };

    const priorityClasses = {
      low: 'bg-gray-50 text-gray-600',
      medium: 'bg-blue-50 text-blue-600',
      high: 'bg-orange-50 text-orange-600',
      critical: 'bg-red-50 text-red-600'
    };

    return `rounded-full ${sizeClasses[size]} ${priorityClasses[priority]}`;
  }, [size, priority]);

  // Value formatting
  const formattedValue = useMemo(() => {
    if (typeof value === 'string') return value;
    return formatValue ? value.toLocaleString() : value;
  }, [value, formatValue]);

  // Handle card click
  const handleCardClick = useCallback(() => {
    if (clickable && onClick) {
      onClick();
    }
  }, [clickable, onClick]);

  // Handle refresh
  const handleRefresh = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // Handle mouse events for hover effects
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Action button handler
  const handleActionClick = useCallback((action: StatAction, e: React.MouseEvent) => {
    e.stopPropagation();
    action.onClick();
  }, []);

  return (
    <div 
      className={cardClasses}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <RefreshCwIcon className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center z-10 p-4">
          <div className="text-center">
            <AlertCircleIcon className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title and refresh button */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
            {refreshable && (
              <button
                onClick={handleRefresh}
                className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <RefreshCwIcon className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {/* Value */}
          <div className="mt-1 mb-2">
            <p className="text-3xl font-semibold text-gray-900">
              {animateValue ? (
                <AnimatedValue 
                  value={value} 
                  formatValue={formatValue}
                />
              ) : (
                formattedValue
              )}
            </p>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-500 mb-2">{description}</p>
          )}

          {/* Trend */}
          {trend && (
            <div className="mb-2">
              <TrendIndicator trend={trend} />
            </div>
          )}

          {/* Alert */}
          {alert && (
            <div className="mb-2">
              <StatAlertComponent alert={alert} />
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex items-center space-x-2 mt-4">
              {actions.map((action, index) => {
                const actionClasses = {
                  primary: 'bg-blue-600 text-white hover:bg-blue-700',
                  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  danger: 'bg-red-600 text-white hover:bg-red-700'
                };

                return (
                  <button
                    key={index}
                    onClick={(e) => handleActionClick(action, e)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      actionClasses[action.variant || 'secondary']
                    }`}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Icon and Chart */}
        <div className="flex flex-col items-end space-y-2 ml-4">
          <div className={iconClasses}>
            {icon}
          </div>
          
          {showChart && chartData.length > 0 && (
            <div className="mt-2">
              <MiniChart 
                data={chartData} 
                type={chartType}
                height={size === 'sm' ? 30 : size === 'lg' ? 50 : 40}
                width={size === 'sm' ? 60 : size === 'lg' ? 100 : 80}
              />
            </div>
          )}
        </div>
      </div>

      {/* Hover effect overlay */}
      {isHovered && clickable && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-20 rounded-lg pointer-events-none" />
      )}

      {/* Priority indicator */}
      {priority === 'critical' && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
      {priority === 'high' && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
