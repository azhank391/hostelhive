/**
 * 🎯 Context-Aware API Hooks
 * 
 * Simple hooks that provide hostelId from context for easier API calls
 * This eliminates the need for components to manually get hostelId
 */

import { useHostel } from '../context/HostelContext';
import { adminApi, studentApi, hostelApi } from './api';
import { useMemo } from 'react';

// ==========================================
// SIMPLE HOSTEL ID HOOK
// ==========================================

/**
 * Hook that provides current hostelId with automatic error handling
 */
export const useCurrentHostelId = () => {
  const { getCurrentHostelId, getCurrentHostelIdWithUrlFallback, isReady, currentHostel } = useHostel();

  // 🚀 CRITICAL FIX: Memoize the functions to prevent infinite loops
  const getHostelId = useMemo((): (() => string) => {
    return (): string => {
      // First try to get from currentHostel directly
      if (currentHostel?.id) {
        return currentHostel.id;
      }
      
      // Then try context methods
      const hostelId = getCurrentHostelId() || getCurrentHostelIdWithUrlFallback();
      if (!hostelId) {
        // Try localStorage as final fallback
        if (typeof window !== 'undefined') {
          const activeHostel = localStorage.getItem('activeHostel');
          if (activeHostel) {
            return activeHostel;
          }
        }
        throw new Error('No active hostel selected. Please select a hostel first.');
      }
      
      return hostelId;
    };
  }, [currentHostel?.id, getCurrentHostelId, getCurrentHostelIdWithUrlFallback]);

  const getHostelIdSafe = useMemo((): (() => string | null) => {
    return (): string | null => {
      try {
        const id = getHostelId();
        return id;
      } catch (error) {
        // Try localStorage as final fallback
        if (typeof window !== 'undefined') {
          const activeHostel = localStorage.getItem('activeHostel');
          if (activeHostel) {
            return activeHostel;
          }
        }
        return null;
      }
    };
  }, [getHostelId]);

  const hasHostel = useMemo(() => {
    try {
      const hostelId = getHostelIdSafe();
      return !!hostelId;
    } catch (error) {
      return false;
    }
  }, [getHostelIdSafe]);

  return {
    hasHostel,
    getHostelId: getHostelId as () => string,
    getHostelIdSafe: getHostelIdSafe as () => string | null,
    isReady
  };
};

// ==========================================
// ENHANCED API HOOKS WITH AUTO HOSTEL-ID
// ==========================================

/**
 * Admin API hook with automatic hostelId injection
 * Usage: const admin = useAdminApiWithHostel();
 *        const students = await admin.getStudents(params);
 */
export const useAdminApiWithHostel = () => {
  const { getHostelId, getHostelIdSafe } = useCurrentHostelId();

  // 🚀 CRITICAL FIX: Use useMemo to stabilize the API object reference
  // This prevents infinite loops when components depend on this hook
  return useMemo(() => ({
    // Dashboard
    getDashboardStats: () => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for dashboard stats'));
      }
      return adminApi.getDashboardStats(hostelId);
    },

    // Room Allocation
    allocateRoom: (allocationData: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for room allocation'));
      }
      return adminApi.allocateRoom(hostelId, allocationData);
    },
    deallocateRoom: (studentId: string) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for room deallocation'));
      }
      return adminApi.deallocateRoom(hostelId, studentId);
    },

    // Room Management
    getRooms: (params?: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for rooms'));
      }
      return adminApi.getRooms(hostelId, params);
    },
    createRoom: (roomData: any) => {
      const hostelId = getHostelIdSafe();
      console.log('🔍 DEBUG: createRoom - hostelId:', hostelId);
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for creating room'));
      }
      return adminApi.createRoom(hostelId, roomData);
    },
    updateRoom: (roomId: string, updates: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for updating room'));
      }
      return adminApi.updateRoom(hostelId, roomId, updates);
    },
    deleteRoom: (roomId: string) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for deleting room'));
      }
      return adminApi.deleteRoom(hostelId, roomId);
    },

    // Student Management
    getStudents: (params?: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for students'));
      }
      return adminApi.getStudents(hostelId, params);
    },
    createStudent: (studentData: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for creating student'));
      }
      return adminApi.createStudent(hostelId, studentData);
    },
    updateStudent: (studentId: string, updates: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for updating student'));
      }
      return adminApi.updateStudent(hostelId, studentId, updates);
    },
    deleteStudent: (studentId: string) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for deleting student'));
      }
      return adminApi.deleteStudent(hostelId, studentId);
    },

    // Warden Management
    getWardens: () => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for getting wardens'));
      }
      return adminApi.getWardens(hostelId);
    },
    createWarden: (wardenData: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for creating warden'));
      }
      return adminApi.createWarden(hostelId, wardenData);
    },
    updateWarden: (wardenId: string, updates: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for updating warden'));
      }
      return adminApi.updateWarden(hostelId, wardenId, updates);
    },
    deleteWarden: (wardenId: string) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for deleting warden'));
      }
      return adminApi.deleteWarden(hostelId, wardenId);
    },

    // Room Allocation (if available)
    getRoomAllocations: (params?: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for room allocations'));
      }
      if ('getRoomAllocations' in adminApi) {
        return (adminApi as any).getRoomAllocations(hostelId, params);
      }
      throw new Error('getRoomAllocations method not available');
    },

    // Complaint Management
    getComplaints: (params?: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for complaints'));
      }
      return adminApi.getComplaints(hostelId, params);
    },
    updateComplaint: (complaintId: string, updates: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for updating complaint'));
      }
      return adminApi.updateComplaint(hostelId, complaintId, updates);
    },
    resolveComplaint: (complaintId: string, resolutionNotes: string) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for resolving complaint'));
      }
      return adminApi.resolveComplaint(hostelId, complaintId, resolutionNotes);
    },

    // Visitor Management
    getVisitorLogs: (params?: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for visitor logs'));
      }
      return adminApi.getVisitorLogs(hostelId, params);
    },
    createVisitorLog: (visitorData: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for creating visitor log'));
      }
      return adminApi.createVisitorLog(hostelId, visitorData);
    },
    updateVisitorLog: (visitorId: string, updates: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for updating visitor log'));
      }
      return adminApi.updateVisitorLog(hostelId, visitorId, updates);
    },
    deleteVisitorLog: (visitorId: string) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for deleting visitor log'));
      }
      return adminApi.deleteVisitorLog(hostelId, visitorId);
    },
    checkoutVisitor: (visitorId: string) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for checking out visitor'));
      }
      return adminApi.checkoutVisitor(hostelId, visitorId);
    },

    // Utility
    getCurrentHostelId: getHostelId,
  }), [getHostelId, getHostelIdSafe]); // Only depend on stable functions, not objects
};

/**
 * Student API hook with automatic hostelId injection
 * Usage: const student = useStudentApiWithHostel();
 *        const dashboard = await student.getDashboard();
 */
export const useStudentApiWithHostel = () => {
  const { getHostelId } = useCurrentHostelId();

  // 🚀 CRITICAL FIX: Use useMemo to stabilize the API object reference
  return useMemo(() => ({
    // Dashboard
    getDashboard: () => studentApi.getDashboard(),
    getProfile: () => studentApi.getProfile(),
    updateProfile: (updates: any) => studentApi.updateProfile(updates),

    // Room
    getRoom: () => studentApi.getRoom(),

    // Complaints
    getComplaints: () => studentApi.getComplaints(),
    lodgeComplaint: (complaintData: any) => studentApi.lodgeComplaint(complaintData),
    updateComplaint: (complaintId: string, updates: any) => studentApi.updateComplaint(complaintId, updates),

    // Visitor Logs
    getVisitorLogs: () => studentApi.getVisitorLogs(),
    createVisitorLog: (visitorData: any) => studentApi.createVisitorLog(visitorData),

    // Utility
    getCurrentHostelId: getHostelId,
  }), [getHostelId]); // Only depend on stable function, not objects
};

/**
 * Hostel API hook with automatic hostelId injection for current hostel operations
 */
export const useHostelApiWithContext = () => {
  const { getHostelIdSafe } = useCurrentHostelId();

  // 🚀 CRITICAL FIX: Use useMemo to stabilize the API object reference
  return useMemo(() => ({
    // Operations that don't need hostelId (user-specific)
    getUserHostels: hostelApi.getUserHostels,
    createHostel: hostelApi.createHostel,

    // Operations that use current hostel context
    getCurrentHostelDetails: () => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for getting hostel details'));
      }
      return hostelApi.getHostelDetails(hostelId);
    },
    updateCurrentHostel: (updates: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for updating hostel'));
      }
      return hostelApi.updateHostel(hostelId, updates);
    },

    // Utility
    getCurrentHostelId: getHostelIdSafe,
  }), [getHostelIdSafe]); // Only depend on stable function, not objects
};

// ==========================================
// USAGE EXAMPLES FOR COMPONENTS
// ==========================================

/*
// Example 1: Simple hostelId access
function MyComponent() {
  const { hostelId, hasHostel } = useCurrentHostelId();
  
  if (!hasHostel) return <div>Please select a hostel</div>;
  
  const loadData = async () => {
    const rooms = await adminApi.getRooms(hostelId, params);
  };
}

// Example 2: Auto-injected API calls
function StudentManagement() {
  const admin = useAdminApiWithHostel();
  
  const loadStudents = async () => {
    // hostelId automatically injected!
    const students = await admin.getStudents({ page: 1, limit: 10 });
  };
  
  const createStudent = async (studentData) => {
    // hostelId automatically injected!
    const newStudent = await admin.createStudent(studentData);
  };
}

// Example 3: Current hostel operations
function HostelSettings() {
  const hostel = useHostelApiWithContext();
  
  const loadHostelDetails = async () => {
    // Uses current hostel from context
    const details = await hostel.getCurrentHostelDetails();
  };
  
  const updateHostel = async (updates) => {
    // Updates current hostel from context
    await hostel.updateCurrentHostel(updates);
  };
}
*/
