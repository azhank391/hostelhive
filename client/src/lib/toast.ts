/**
 * 🔔 Optimized Toast Notifications
 * 
 * High-performance toast notifications with proper TypeScript typing
 * Built on Sonner with enhanced functionality
 */

import { toast, type ExternalToast } from 'sonner';

// Enhanced toast options interface
interface ToastOptions extends ExternalToast {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

// Performance-optimized notification system
export const notification = {
  /**
   * Show success notification
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
      ...options,
    });
  },

  /**
   * Show error notification
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 6000, // Longer for errors
      ...options,
    });
  },

  /**
   * Show warning notification
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast.warning(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 5000,
      ...options,
    });
  },

  /**
   * Show info notification
   */
  info: (message: string, options?: ToastOptions) => {
    return toast.info(message, {
      description: options?.description,
      action: options?.action,
      duration: options?.duration || 4000,
      ...options,
    });
  },

  /**
   * Show loading notification
   */
  loading: (message: string, options?: Omit<ToastOptions, 'action'>) => {
    return toast.loading(message, options);
  },

  /**
   * Promise-based notifications with proper typing
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: (data: T) => 
        typeof messages.success === 'function' 
          ? messages.success(data) 
          : messages.success,
      error: (error: Error) => 
        typeof messages.error === 'function' 
          ? messages.error(error) 
          : messages.error,
      ...options,
    });
  },

  /**
   * Dismiss a specific toast
   */
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Custom toast with full control
   */
  custom: (component: (id: string | number) => React.ReactElement, options?: ToastOptions) => {
    return toast.custom(component, options);
  },
};

// Enhanced API Error Handler with better error classification
export const handleApiError = (error: Error, fallbackMessage = 'An unexpected error occurred') => {
  console.error('API Error:', error);
  
  let message = fallbackMessage;
  let description: string | undefined;
  
  if (error.message) {
    // Enhanced error classification
    if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
      message = 'Authentication required';
      description = 'Please log in to continue';
    } else if (error.message.includes('403') || error.message.toLowerCase().includes('forbidden')) {
      message = 'Access denied';
      description = 'You don\'t have permission for this action';
    } else if (error.message.includes('404') || error.message.toLowerCase().includes('not found')) {
      message = 'Resource not found';
      description = 'The requested item could not be found';
    } else if (error.message.includes('409') || error.message.toLowerCase().includes('conflict')) {
      message = 'Data conflict';
      description = 'The data you\'re trying to save conflicts with existing data';
    } else if (error.message.includes('429') || error.message.toLowerCase().includes('rate limit')) {
      message = 'Too many requests';
      description = 'Please wait a moment before trying again';
    } else if (error.message.includes('500') || error.message.toLowerCase().includes('server error')) {
      message = 'Server error';
      description = 'Something went wrong on our end. Please try again later';
    } else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('timeout')) {
      message = 'Network error';
      description = 'Please check your internet connection and try again';
    } else {
      message = error.message;
    }
  }
  
  notification.error(message, { description });
};

// Convenience methods for common API operations
export const apiNotification = {
  /**
   * Standard API success notification
   */
  success: (operation: string, entity?: string) => {
    const message = entity 
      ? `${entity} ${operation} successfully` 
      : `${operation} completed successfully`;
    
    return notification.success(message);
  },

  /**
   * Standard API error notification
   */
  error: (operation: string, error?: Error | string, entity?: string) => {
    const entityText = entity ? ` ${entity}` : '';
    const errorText = typeof error === 'string' ? error : error?.message || 'Unknown error';
    
    return notification.error(`Failed to ${operation}${entityText}`, {
      description: errorText,
    });
  },

  /**
   * API promise notification with standard messages
   */
  promise: <T>(
    promise: Promise<T>,
    operation: string,
    entity?: string
  ) => {
    const entityText = entity ? ` ${entity}` : '';
    
    return notification.promise(promise, {
      loading: `${operation}${entityText}...`,
      success: `${entity || 'Operation'} ${operation} successfully`,
      error: (error: Error) => `Failed to ${operation}${entityText}: ${error.message}`,
    });
  },
};

// Export types for use in other components
export type { ToastOptions };
export default notification;
