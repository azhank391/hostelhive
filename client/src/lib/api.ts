/**
 * 🎯 URL-Based API Services
 * 
 * Organized by domain with URL-based routing support
 * Replaces legacy context-based approach
 */

import { apiClient, PaginatedResponse, apiPerformance } from './api-client';
import { STORAGE_KEYS } from './config';
import type { 
  Hostel, 
  User, 
  Room, 
  Complaint, 
  VisitorLog, 
  RoomAllocation,
  DashboardStats 
} from './types';

/**
 * Gets the active hostel ID from localStorage
 */
export const getActiveHostelId = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_HOSTEL);
};

// ==========================================
// AUTHENTICATION API (Token-based)
// ==========================================

export const authApi = {
  async login(credentials: { email: string; password: string; }) {
    apiPerformance.startMeasure('auth-login');
    try {
      const result = await apiClient.post('/auth/login', credentials, {
        cacheTTL: 0, // Never cache auth requests
        skipCache: true
      });
      return result;
    } finally {
      apiPerformance.endMeasure('auth-login');
    }
  },

  async registerOwner(userData: {
    name: string;
    email: string;
    password: string;
    hostelData?: {
      name: string;
      plan: string;
      country?: string;
      city?: string;
      address?: string;
    };
  }) {
    return apiClient.post('/auth/register-owner', userData, {
      skipCache: true
    });
  },

  async registerUser(userData: {
    name: string;
    email: string;
    password: string;
    role: 'Owner';
    hostelId: string;
  }) {
    return apiClient.post('/auth/register', userData, {
      skipCache: true
    });
  },

  async getCurrentUser() {
    return apiClient.get<User>('/auth/profile', {
      cacheTTL: 60000 // Cache for 1 minute
    });
  },

  async getUserHostels() {
    const result = await apiClient.get<Hostel[]>('/auth/hostels', {
      cacheTTL: 300000 // Cache for 5 minutes
    });
    return result;
  },

  async setActiveHostel(hostelId: string) {
    try {
      // Check if we have authentication before making the call
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
          console.warn('No authentication token available for setActiveHostel');
          return; // Return early instead of throwing
        }
      }
      
      const response = await apiClient.post<{
        message: string;
        token: string;
        hostel: {
          id: string;
          name: string;
          subdomain: string;
        };
      }>('/auth/set-active-hostel', { hostelId }, {
        skipCache: true
      });
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        // Add context to the error
        error.message = `Failed to set active hostel: ${error.message}`;
      }
      throw error;
    }
  },

  // Legacy compatibility methods
  getProfile: () => authApi.getCurrentUser(),
  register: (userData: any) => authApi.registerUser(userData)
};

// ==========================================
// HOSTEL MANAGEMENT API (URL-based)
// ==========================================

export const hostelApi = {
  // Basic hostel operations
  async getUserHostels() {
    return apiClient.get<Hostel[]>('/auth/hostels', {
      cacheTTL: 300000 // Cache for 5 minutes
    });
  },

  async createHostel(hostelData: {
    name: string;
    plan: string;
    country?: string;
    city?: string;
    address?: string;
  }) {
    const result = await apiClient.post<Hostel>('/hostels', hostelData, {
      skipCache: true
    });
    
    // Invalidate hostels cache
    apiClient.invalidateCache('/hostels');
    return result;
  },

  async getHostelDetails(hostelId: string) {
          const url = `/hostels/${hostelId}`;
      const result = await apiClient.get<Hostel>(url, {
        cacheTTL: 600000 // Cache for 10 minutes
      });
    return result;
  },

  async updateHostel(hostelId: string, updates: Partial<Hostel>) {
    const result = await apiClient.put<Hostel>(`/hostels/${hostelId}`, updates, {
      skipCache: true
    });
    
    // Invalidate related caches
    apiClient.invalidateCache(`/hostels/${hostelId}`);
    apiClient.invalidateCache('/hostels');
    return result;
  },

  // Admin endpoints (URL-based: /hostels/:hostelId/admin/*)
  async getDashboardMetrics(hostelId: string) {
    const url = `/hostels/${hostelId}/stats`;
    return apiClient.get<DashboardStats>(url, {
      cacheTTL: 30000 // Cache for 30 seconds
    });
  },

  async getRooms(hostelId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    return apiClient.get<PaginatedResponse<Room>>(`/hostels/${hostelId}/rooms`, {
      params,
      cacheTTL: 60000 // Cache for 1 minute
    });
  },

  async createRoom(hostelId: string, roomData: {
    roomNumber: string;
    capacity: number;
    block?: string;
  }) {
    const result = await apiClient.post<Room>(`/hostels/${hostelId}/admin/rooms`, roomData, {
      skipCache: true
    });
    
    // Invalidate rooms cache
    apiClient.invalidateCache(`/hostels/${hostelId}/admin/rooms`);
    return result;
  },

  async updateRoom(hostelId: string, roomId: string, updates: Partial<Room>) {
    const result = await apiClient.put<Room>(`/hostels/${hostelId}/admin/rooms/${roomId}`, updates, {
      skipCache: true
    });
    
    // Invalidate rooms cache
    apiClient.invalidateCache(`/hostels/${hostelId}/admin/rooms`);
    return result;
  },

  async deleteRoom(hostelId: string, roomId: string) {
    const result = await apiClient.delete(`/hostels/${hostelId}/admin/rooms/${roomId}`, {
      skipCache: true
    });
    
    // Invalidate rooms cache
    apiClient.invalidateCache(`/hostels/${hostelId}/admin/rooms`);
    return result;
  },

  async getStudents(hostelId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    return apiClient.get<PaginatedResponse<User>>(`/hostels/${hostelId}/students`, {
      params,
      cacheTTL: 60000 // Cache for 1 minute
    });
  },

  async createStudent(hostelId: string, studentData: {
    name: string;
    email: string;
    phone?: string;
  }) {
    const result = await apiClient.post<User>(`/hostels/${hostelId}/students`, studentData, {
      skipCache: true
    });
    
    // Invalidate students cache
    apiClient.invalidateCache(`/hostels/${hostelId}/students`);
    return result;
  },

  async updateStudent(hostelId: string, studentId: string, updates: Partial<User>) {
    const result = await apiClient.put<User>(`/hostels/${hostelId}/students/${studentId}`, updates, {
      skipCache: true
    });
    
    // Invalidate students cache
    apiClient.invalidateCache(`/hostels/${hostelId}/students`);
    return result;
  },

  async deleteStudent(hostelId: string, studentId: string) {
    const result = await apiClient.delete(`/hostels/${hostelId}/students/${studentId}`, {
      skipCache: true
    });
    
    // Invalidate students cache
    apiClient.invalidateCache(`/hostels/${hostelId}/students`);
    return result;
  },

  async getWardens(hostelId: string) {
    return apiClient.get<User[]>(`/hostels/${hostelId}/admin/wardens`, {
      cacheTTL: 300000 // Cache for 5 minutes
    });
  },

  async createWarden(hostelId: string, wardenData: {
    name: string;
    email: string;
    password: string;
  }) {
    const result = await apiClient.post<User>(`/hostels/${hostelId}/admin/wardens`, wardenData, {
      skipCache: true
    });
    
    // Invalidate wardens cache
    apiClient.invalidateCache(`/hostels/${hostelId}/admin/wardens`);
    return result;
  },

  async updateWarden(hostelId: string, wardenId: string, updates: Partial<User>) {
    const result = await apiClient.put<User>(`/hostels/${hostelId}/admin/wardens/${wardenId}`, updates, {
      skipCache: true
    });
    
    // Invalidate wardens cache
    apiClient.invalidateCache(`/hostels/${hostelId}/admin/wardens`);
    return result;
  },

  async deleteWarden(hostelId: string, wardenId: string) {
    const result = await apiClient.delete(`/hostels/${hostelId}/admin/wardens/${wardenId}`, {
      skipCache: true
    });
    
    // Invalidate wardens cache
    apiClient.invalidateCache(`/hostels/${hostelId}/admin/wardens`);
    return result;
  },

  async allocateRoom(hostelId: string, allocationData: {
    studentId: string;
    roomId: string;
  }) {
    const result = await apiClient.post<RoomAllocation>(`/hostels/${hostelId}/room-allocations`, allocationData, {
      skipCache: true
    });
    
    // Invalidate related caches
    apiClient.invalidateCache(`/hostels/${hostelId}/admin/rooms`);
    apiClient.invalidateCache(`/hostels/${hostelId}/admin/students`);
    return result;
  },

  async deallocateRoom(hostelId: string, studentId: string) {
    const result = await apiClient.delete(`/hostels/${hostelId}/room-allocations/${studentId}`, {
      skipCache: true
    });
    
    // Invalidate related caches
    apiClient.invalidateCache(`/hostels/${hostelId}/admin/rooms`);
    apiClient.invalidateCache(`/hostels/${hostelId}/admin/students`);
    return result;
  },

  async getComplaints(hostelId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
  }) {
    return apiClient.get<PaginatedResponse<Complaint>>(`/hostels/${hostelId}/complaints`, {
      params,
      cacheTTL: 30000 // Cache for 30 seconds
    });
  },

  async createComplaint(hostelId: string, complaintData: {
    title: string;
    description: string;
    studentId?: string;
  }) {
    const result = await apiClient.post<Complaint>(`/hostels/${hostelId}/complaints`, complaintData, {
      skipCache: true
    });
    
    // Invalidate complaints cache
    apiClient.invalidateCache(`/hostels/${hostelId}/complaints`);
    return result;
  },

  async updateComplaint(hostelId: string, complaintId: string, updates: Partial<Complaint>) {
    const result = await apiClient.put<Complaint>(`/hostels/${hostelId}/complaints/${complaintId}/status`, updates, {
      skipCache: true
    });
    
    // Invalidate complaints cache
    apiClient.invalidateCache(`/hostels/${hostelId}/complaints`);
    return result;
  },

  async deleteComplaint(hostelId: string, complaintId: string) {
    const result = await apiClient.delete(`/hostels/${hostelId}/complaints/${complaintId}`, {
      skipCache: true
    });
    
    // Invalidate complaints cache
    apiClient.invalidateCache(`/hostels/${hostelId}/complaints`);
    return result;
  },

  async resolveComplaint(hostelId: string, complaintId: string, resolution?: string) {
    const result = await apiClient.put(`/hostels/${hostelId}/complaints/${complaintId}/resolve`, 
      resolution ? { resolution } : {}, 
      { skipCache: true }
    );
    
    // Invalidate complaints cache
    apiClient.invalidateCache(`/hostels/${hostelId}/complaints`);
    return result;
  },

  async getVisitors(hostelId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    return apiClient.get<PaginatedResponse<VisitorLog>>(`/hostels/${hostelId}/visitors`, {
      params,
      cacheTTL: 30000 // Cache for 30 seconds
    });
  },

  async createVisitor(hostelId: string, visitorData: {
    visitorName: string;
    relation: string;
    studentId: string;
  }) {
    const result = await apiClient.post<VisitorLog>(`/hostels/${hostelId}/visitors`, visitorData, {
      skipCache: true
    });
    
    // Invalidate visitor logs cache
    apiClient.invalidateCache(`/hostels/${hostelId}/visitors`);
    return result;
  },

  async updateVisitor(hostelId: string, visitorId: string, updates: Partial<VisitorLog>) {
    const result = await apiClient.put<VisitorLog>(`/hostels/${hostelId}/visitors/${visitorId}`, updates, {
      skipCache: true
    });
    
    // Invalidate visitor logs cache
    apiClient.invalidateCache(`/hostels/${hostelId}/visitors`);
    return result;
  },

  async deleteVisitor(hostelId: string, visitorId: string) {
    const result = await apiClient.delete(`/hostels/${hostelId}/visitors/${visitorId}`, {
      skipCache: true
    });
    
    // Invalidate visitor logs cache
    apiClient.invalidateCache(`/hostels/${hostelId}/visitors`);
    return result;
  },

  async checkoutVisitor(hostelId: string, visitorId: string) {
    const result = await apiClient.put(`/admin/visitor-logs/${visitorId}/checkout`, {}, {
      skipCache: true
    });
    
    // Invalidate visitor logs cache
    apiClient.invalidateCache(`/admin/visitor-logs`);
    return result;
  }
};

// ==========================================
// STUDENT API (Token-based: /student/*)
// ==========================================

export const studentApi = {
  async getDashboard() {
    return apiClient.get('/student/dashboard', {
      cacheTTL: 30000 // Cache for 30 seconds
    });
  },

  async getProfile() {
    return apiClient.get<User>('/student/profile', {
      cacheTTL: 300000 // Cache for 5 minutes
    });
  },

  async updateProfile(updates: Partial<User>) {
    const result = await apiClient.put<User>('/student/profile', updates, {
      skipCache: true
    });
    
    // Invalidate profile cache
    apiClient.invalidateCache('/student/profile');
    return result;
  },

  async getRoom() {
    return apiClient.get('/student/room', {
      cacheTTL: 300000 // Cache for 5 minutes
    });
  },

  async getComplaints() {
    return apiClient.get<Complaint[]>('/student/complaints', {
      cacheTTL: 60000 // Cache for 1 minute
    });
  },

  async getComplaintById(complaintId: string) {
    return apiClient.get<Complaint>(`/student/complaints/${complaintId}`, {
      cacheTTL: 60000 // Cache for 1 minute
    });
  },

  async lodgeComplaint(complaintData: {
    title: string;
    description: string;
    priority: string;
  }) {
    const result = await apiClient.post<Complaint>('/student/complaints', complaintData, {
      skipCache: true
    });
    
    // Invalidate complaints cache
    apiClient.invalidateCache('/student/complaints');
    return result;
  },

  async updateComplaint(complaintId: string, updates: Partial<Complaint>) {
    const result = await apiClient.put<Complaint>(`/student/complaints/${complaintId}`, updates, {
      skipCache: true
    });
    
    // Invalidate complaints cache
    apiClient.invalidateCache('/student/complaints');
    return result;
  },

  async deleteComplaint(complaintId: string) {
    const result = await apiClient.delete(`/student/complaints/${complaintId}`, {
      skipCache: true
    });
    
    // Invalidate complaints cache
    apiClient.invalidateCache('/student/complaints');
    return result;
  },

  async getVisitorLogs() {
    return apiClient.get<VisitorLog[]>('/student/visitor-logs', {
      cacheTTL: 60000 // Cache for 1 minute
    });
  },

  async createVisitorLog(visitorData: {
    visitorName: string;
    relation: string;
  }) {
    const result = await apiClient.post<VisitorLog>('/student/visitor-logs', visitorData, {
      skipCache: true
    });
    
    // Invalidate visitor logs cache
    apiClient.invalidateCache('/student/visitor-logs');
    return result;
  },

  async updateVisitorLog(visitorId: string, updates: Partial<VisitorLog>) {
    const result = await apiClient.put<VisitorLog>(`/student/visitor-logs/${visitorId}`, updates, {
      skipCache: true
    });
    
    // Invalidate visitor logs cache
    apiClient.invalidateCache('/student/visitor-logs');
    return result;
  },

  async deleteVisitorLog(visitorId: string) {
    const result = await apiClient.delete(`/student/visitor-logs/${visitorId}`, {
      skipCache: true
    });
    
    // Invalidate visitor logs cache
    apiClient.invalidateCache('/student/visitor-logs');
    return result;
  },

  async checkoutVisitor(visitorId: string) {
    const result = await apiClient.put(`/student/visitor-logs/${visitorId}/checkout`, {}, {
      skipCache: true
    });
    
    // Invalidate visitor logs cache
    apiClient.invalidateCache('/student/visitor-logs');
    return result;
  }
};

// ==========================================
// SUPERADMIN API (Cross-hostel: /superadmin/*)
// ==========================================

export const superadminApi = {
  async login(credentials: { email: string; password: string }) {
    return apiClient.post('/superadmin/login', credentials, {
      skipCache: true
    });
  },

  async getDashboard() {
    return apiClient.get('/superadmin/dashboard', {
      cacheTTL: 60000 // Cache for 1 minute
    });
  },

  async getBillingOverview() {
    return apiClient.get('/superadmin/billing-overview', {
      cacheTTL: 300000 // Cache for 5 minutes
    });
  },

  async getAllHostels(params?: {
    page?: number;
    limit?: number;
    plan?: string;
    isActive?: boolean;
    isPaid?: boolean;
  }) {
    return apiClient.get<PaginatedResponse<Hostel>>('/superadmin/hostels', {
      params,
      cacheTTL: 60000 // Cache for 1 minute
    });
  },

  async getHostelDetails(hostelId: string) {
    return apiClient.get<Hostel>(`/superadmin/hostels/${hostelId}`, {
      cacheTTL: 300000 // Cache for 5 minutes
    });
  },

  async getHostelStudents(hostelId: string) {
    return apiClient.get<User[]>(`/superadmin/hostels/${hostelId}/students`, {
      cacheTTL: 300000 // Cache for 5 minutes
    });
  },

  async updateHostelPlan(hostelId: string, plan: string) {
    const result = await apiClient.put(`/superadmin/hostels/${hostelId}/plan`, { plan }, {
      skipCache: true
    });
    
    // Invalidate hostel caches
    apiClient.invalidateCache(`/superadmin/hostels/${hostelId}`);
    apiClient.invalidateCache('/superadmin/hostels');
    return result;
  },

  async updateHostelStatus(hostelId: string, isActive: boolean) {
    const result = await apiClient.put(`/superadmin/hostels/${hostelId}/status`, { isActive }, {
      skipCache: true
    });
    
    // Invalidate hostel caches
    apiClient.invalidateCache(`/superadmin/hostels/${hostelId}`);
    apiClient.invalidateCache('/superadmin/hostels');
    return result;
  },

  async updateBillingStatus(hostelId: string, isPaid: boolean) {
    const result = await apiClient.put(`/superadmin/hostels/${hostelId}/billing`, { isPaid }, {
      skipCache: true
    });
    
    // Invalidate hostel caches
    apiClient.invalidateCache(`/superadmin/hostels/${hostelId}`);
    apiClient.invalidateCache('/superadmin/hostels');
    return result;
  },

  async deleteHostel(hostelId: string) {
    const result = await apiClient.delete(`/superadmin/hostels/${hostelId}`, {
      skipCache: true
    });
    
    // Invalidate hostel caches
    apiClient.invalidateCache('/superadmin/hostels');
    return result;
  },

  async createOwner(ownerData: {
    name: string;
    email: string;
    password: string;
    hostelData?: {
      name: string;
      plan: string;
      country?: string;
      city?: string;
      address?: string;
    };
  }) {
    const result = await apiClient.post('/superadmin/owners', ownerData, {
      skipCache: true
    });
    
    // Invalidate hostels cache if hostel was created
    if (ownerData.hostelData) {
      apiClient.invalidateCache('/superadmin/hostels');
    }
    
    return result;
  },

  async registerHostel(hostelData: {
    name: string;
    email: string;
    subdomain: string;
    plan: string;
    country?: string;
    city?: string;
    address?: string;
  }) {
    const result = await apiClient.post('/superadmin/hostels', hostelData, {
      skipCache: true
    });
    
    // Invalidate hostels cache
    apiClient.invalidateCache('/superadmin/hostels');
    return result;
  },

  async getHostelsByRegion(country?: string) {
    return apiClient.get('/superadmin/hostels-by-region', {
      params: { country },
      cacheTTL: 600000 // Cache for 10 minutes
    });
  }
};

// ==========================================
// WARDEN API (Direct admin endpoints without hostelId)
// ==========================================

export const wardenApi = {
  // Dashboard & Analytics
  getDashboardStats: () => apiClient.get('/admin/stats'),

  // Room Management
  getRooms: (params?: any) => apiClient.get('/admin/rooms', { params }),
  createRoom: (roomData: any) => apiClient.post('/admin/rooms', roomData, { skipCache: true }),
  updateRoom: (roomId: string, updates: any) => apiClient.put(`/admin/rooms/${roomId}`, updates, { skipCache: true }),
  deleteRoom: (roomId: string) => apiClient.delete(`/admin/rooms/${roomId}`, { skipCache: true }),

  // Student Management
  getStudents: (params?: any) => apiClient.get('/admin/students', { params }),
  createStudent: (studentData: any) => apiClient.post('/admin/students', studentData, { skipCache: true }),
  updateStudent: (studentId: string, updates: any) => apiClient.put(`/admin/students/${studentId}`, updates, { skipCache: true }),
  deleteStudent: (studentId: string) => apiClient.delete(`/admin/students/${studentId}`, { skipCache: true }),

  // Room Allocation
  allocateRoom: (allocationData: any) => apiClient.post('/admin/allocate-room', allocationData, { skipCache: true }),
  deallocateRoom: (allocationId: string) => apiClient.put(`/admin/deallocate-room/${allocationId}`, {}, { skipCache: true }),

  // Complaint Management
  getComplaints: (params?: any) => apiClient.get('/admin/complaints', { params }),
  resolveComplaint: (complaintId: string, resolution?: string) => apiClient.put(`/admin/complaints/${complaintId}/resolve`, { resolution }, { skipCache: true }),

  // Visitor Management
  getVisitorLogs: (params?: any) => apiClient.get('/admin/visitor-logs', { params }),
  createVisitorLog: (visitorData: any) => apiClient.post('/admin/visitor-logs', visitorData, { skipCache: true }),
  updateVisitorLog: (visitorId: string, updates: any) => apiClient.put(`/admin/visitor-logs/${visitorId}`, updates, { skipCache: true }),
  deleteVisitorLog: (visitorId: string) => apiClient.delete(`/admin/visitor-logs/${visitorId}`, { skipCache: true }),
  checkoutVisitor: (visitorId: string) => apiClient.put(`/admin/visitor-logs/${visitorId}/checkout`, {}, { skipCache: true }),
  getVisitorStats: () => apiClient.get('/admin/visitor-stats'),
  exportVisitorLogs: () => apiClient.get('/admin/visitor-logs/export')
};

// ==========================================
// ADMIN API (Dedicated interface)
// ==========================================

export const adminApi = {
  // Dashboard & Analytics
  getDashboardStats: (hostelId: string) => hostelApi.getDashboardMetrics(hostelId),

  // Room Management
  getRooms: (hostelId: string, params?: any) => hostelApi.getRooms(hostelId, params),
  createRoom: (hostelId: string, roomData: any) => hostelApi.createRoom(hostelId, roomData),
  updateRoom: (hostelId: string, roomId: string, updates: any) => hostelApi.updateRoom(hostelId, roomId, updates),
  deleteRoom: (hostelId: string, roomId: string) => hostelApi.deleteRoom(hostelId, roomId),

  // Student Management
  getStudents: (hostelId: string, params?: any) => hostelApi.getStudents(hostelId, params),
  createStudent: (hostelId: string, studentData: any) => hostelApi.createStudent(hostelId, studentData),
  updateStudent: (hostelId: string, studentId: string, updates: any) => hostelApi.updateStudent(hostelId, studentId, updates),
  deleteStudent: (hostelId: string, studentId: string) => hostelApi.deleteStudent(hostelId, studentId),

  // Warden Management
  getWardens: (hostelId: string) => hostelApi.getWardens(hostelId),
  createWarden: (hostelId: string, wardenData: any) => hostelApi.createWarden(hostelId, wardenData),
  updateWarden: (hostelId: string, wardenId: string, updates: any) => hostelApi.updateWarden(hostelId, wardenId, updates),
  deleteWarden: (hostelId: string, wardenId: string) => hostelApi.deleteWarden(hostelId, wardenId),

  // Room Allocation
  allocateRoom: (hostelId: string, allocationData: any) => hostelApi.allocateRoom(hostelId, allocationData),
  deallocateRoom: (hostelId: string, allocationId: string) => hostelApi.deallocateRoom(hostelId, allocationId),

  // Complaint Management
  getComplaints: (hostelId: string, params?: any) => hostelApi.getComplaints(hostelId, params),
  createComplaint: (hostelId: string, complaintData: any) => hostelApi.createComplaint(hostelId, complaintData),
  updateComplaint: (hostelId: string, complaintId: string, updates: any) => hostelApi.updateComplaint(hostelId, complaintId, updates),
  deleteComplaint: (hostelId: string, complaintId: string) => hostelApi.deleteComplaint(hostelId, complaintId),
  resolveComplaint: (hostelId: string, complaintId: string, resolution?: string) => hostelApi.resolveComplaint(hostelId, complaintId, resolution),

  // Visitor Management
  getVisitorLogs: (hostelId: string, params?: any) => {
    return apiClient.get(`/admin/visitor-logs`, {
      params,
      cacheTTL: 30000 // Cache for 30 seconds
    });
  },
  createVisitorLog: (hostelId: string, visitorData: any) => {
    return apiClient.post(`/admin/visitor-logs`, visitorData, {
      skipCache: true
    });
  },
  updateVisitorLog: (hostelId: string, visitorId: string, updates: any) => {
    return apiClient.put(`/admin/visitor-logs/${visitorId}`, updates, {
      skipCache: true
    });
  },
  deleteVisitorLog: (hostelId: string, visitorId: string) => {
    return apiClient.delete(`/admin/visitor-logs/${visitorId}`, {
      skipCache: true
    });
  },
  checkoutVisitor: (hostelId: string, visitorId: string) => {
    return apiClient.put(`/admin/visitor-logs/${visitorId}/checkout`, {}, {
      skipCache: true
    });
  }
};

// ==========================================
// CONVENIENCE EXPORTS
// ==========================================

export const api = {
  auth: authApi,
  hostel: hostelApi,
  admin: adminApi,
  warden: wardenApi,
  student: studentApi,
  superadmin: superadminApi,
  client: apiClient
};

// Re-export apiClient for backward compatibility
export { apiClient };

export default api;
