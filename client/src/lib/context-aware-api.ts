/**
 * 🎯 Context-Aware API Hooks
 * 
 * Simple hooks that provide hostelId from context for easier API calls
 * This eliminates the need for components to manually get hostelId
 */

import { useHostel } from '../context/HostelContext';
import { adminApi, studentApi, hostelApi } from './api';

// ==========================================
// SIMPLE HOSTEL ID HOOK
// ==========================================

/**
 * Hook that provides current hostelId with automatic error handling
 */
export const useCurrentHostelId = () => {
  const { getCurrentHostelId, getCurrentHostelIdWithUrlFallback, isReady, currentHostel } = useHostel();

  const getHostelId = (): string => {
    // First try to get from currentHostel directly
    if (currentHostel?.id) {
      return currentHostel.id;
    }
    
    // Then try context methods
    const hostelId = getCurrentHostelId() || getCurrentHostelIdWithUrlFallback();
    if (!hostelId) {
      throw new Error('No active hostel selected. Please select a hostel first.');
    }
    
    return hostelId;
  };

  const getHostelIdSafe = (): string | null => {
    try {
      const id = getHostelId();
      return id;
    } catch (error) {
      return null;
    }
  };

  const hasHostel = !!getHostelIdSafe();

  return {
    hasHostel,
    getHostelId,
    getHostelIdSafe,
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

  return {
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
    createRoom: (roomData: any) => adminApi.createRoom(getHostelId(), roomData),
    updateRoom: (roomId: string, updates: any) => adminApi.updateRoom(getHostelId(), roomId, updates),
    deleteRoom: (roomId: string) => adminApi.deleteRoom(getHostelId(), roomId),

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
    getWardens: () => adminApi.getWardens(getHostelId()),
    createWarden: (wardenData: any) => adminApi.createWarden(getHostelId(), wardenData),
    updateWarden: (wardenId: string, updates: any) => adminApi.updateWarden(getHostelId(), wardenId, updates),
    deleteWarden: (wardenId: string) => adminApi.deleteWarden(getHostelId(), wardenId),

    // Room Allocation (if available)
    getRoomAllocations: (params?: any) => {
      if ('getRoomAllocations' in adminApi) {
        return (adminApi as any).getRoomAllocations(getHostelId(), params);
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
    updateComplaint: (complaintId: string, updates: any) => adminApi.updateComplaint(getHostelId(), complaintId, updates),

    // Visitor Management
    getVisitorLogs: (params?: any) => {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return Promise.reject(new Error('No hostel selected for visitor logs'));
      }
      return adminApi.getVisitorLogs(hostelId, params);
    },
    checkoutVisitor: (visitorId: string) => adminApi.checkoutVisitor(getHostelId(), visitorId),

    // Utility
    getCurrentHostelId: getHostelId,
  };
};

/**
 * Student API hook with automatic hostelId injection
 * Usage: const student = useStudentApiWithHostel();
 *        const dashboard = await student.getDashboard();
 */
export const useStudentApiWithHostel = () => {
  const { getHostelId } = useCurrentHostelId();

  return {
    // Dashboard
    getDashboard: () => studentApi.getDashboard(),
    
    // Profile
    getProfile: () => studentApi.getProfile(),
    updateProfile: (updates: any) => studentApi.updateProfile(updates),
    
    // Room
    getRoom: () => studentApi.getRoom(),
    
    // Complaints
    getComplaints: () => studentApi.getComplaints(),
    lodgeComplaint: (complaintData: any) => studentApi.lodgeComplaint(complaintData),
    updateComplaint: (complaintId: string, updates: any) => studentApi.updateComplaint(complaintId, updates),
    deleteComplaint: (complaintId: string) => studentApi.deleteComplaint(complaintId),
    
    // Visitor Logs
    getVisitorLogs: () => studentApi.getVisitorLogs(),
    createVisitorLog: (visitorData: any) => studentApi.createVisitorLog(visitorData),
    
    // Utility
    getCurrentHostelId: getHostelId,
  };
};

/**
 * Hostel API hook with automatic hostelId injection for current hostel operations
 */
export const useHostelApiWithContext = () => {
  const { getHostelId } = useCurrentHostelId();

  return {
    // Operations that don't need hostelId (user-specific)
    getUserHostels: hostelApi.getUserHostels,
    createHostel: hostelApi.createHostel,

    // Operations that use current hostel context
    getCurrentHostelDetails: () => hostelApi.getHostelDetails(getHostelId()),
    updateCurrentHostel: (updates: any) => hostelApi.updateHostel(getHostelId(), updates),

    // Utility
    getCurrentHostelId: getHostelId,
  };
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
