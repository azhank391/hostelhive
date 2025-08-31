/**
 * 🏗️ TypeScript Type Definitions
 * 
 * Centralized type definitions for the HostelHive application
 */

// ==========================================
// CORE ENTITY TYPES
// ==========================================

export interface Hostel {
  id: string;
  name: string;
  subdomain: string;
  isActive: boolean;
  plan?: string;
  email?: string;
  isPaid?: boolean;
  ownerId: string;
  location?: {
    country?: string;
    city?: string;
    address?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'warden' | 'student';
  hostelId?: string;
  phone?: string;
  isActive?: boolean;
  requiresPasswordChange?: boolean; // Only relevant for students/wardens with default passwords
  allocations?: RoomAllocation[]; // Room allocations for students
}

export interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  block?: string;
  status: 'available' | 'occupied' | 'maintenance';
  hostelId: string;
  occupied?: number; // Number of students currently in the room
  occupants?: User[];
  allocations?: RoomAllocation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
  hostelId: string;
  user?: User & { allocations?: RoomAllocation[] };
  room?: {
    roomNumber: string;
    block?: string;
  };
  resolution?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisitorLog {
  id: string;
  visitorName: string;
  relation: string;
  entryTime: string;
  exitTime?: string;
  status: 'checked-in' | 'checked-out';
  studentId: string;
  hostelId: string;
  student?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomAllocation {
  id: string;
  userId: string;
  roomId: string;
  hostelId: string;
  allocatedAt: string;
  deallocatedAt?: string;
  status: 'active' | 'inactive';
  user?: User;
  room?: Room;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuperAdmin {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface DashboardStats {
  stats: {
    totalStudents: number;
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    totalComplaints: number;
    pendingComplaints: number;
    totalVisitors?: number;
    activeVisitors?: number;
    totalWardens?: number;
  };
  recentComplaints?: Complaint[];
  recentVisitors?: VisitorLog[];
  recentAllocations?: RoomAllocation[];
}

export interface DashboardMetrics extends DashboardStats {
  complaints: Complaint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==========================================
// AUTHENTICATION TYPES
// ==========================================

export interface LoginCredentials {
  email: string;
  password: string;
  subdomain?: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'warden';
  hostelId?: string;
}

export interface RegisterOwnerData {
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
}

// AuthUser combines properties from both User and SuperAdmin models
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'warden' | 'student' | 'superadmin';
  token?: string;
  hostelId?: string;
  phone?: string;
  isActive?: boolean;
  requiresPasswordChange?: boolean;
  createdAt?: string;
  updatedAt?: string;
  activeHostelId?: string;
  permissions?: string[];
  hostels?: Hostel[];
  isSuperadmin?: boolean;
}

// ==========================================
// FORM DATA TYPES
// ==========================================

export interface CreateRoomData {
  roomNumber: string;
  capacity: number;
  block?: string;
}

export interface CreateComplaintData {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  studentId?: string;
}

export interface CreateVisitorData {
  visitorName: string;
  relation: string;
  studentId?: string;
}

export interface CreateHostelData {
  name: string;
  plan: string;
  country?: string;
  city?: string;
  address?: string;
  subdomain?: string;
  email?: string;
}

export interface RoomAllocationData {
  studentId: string;
  roomId: string;
}

// ==========================================
// FILTER AND SEARCH TYPES
// ==========================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RoomFilters extends SearchParams {
  status?: 'available' | 'occupied' | 'maintenance';
  block?: string;
  capacity?: number;
}

export interface StudentFilters extends SearchParams {
  status?: string;
  hasRoom?: boolean;
}

export interface ComplaintFilters extends SearchParams {
  status?: 'pending' | 'in-progress' | 'resolved';
  priority?: 'low' | 'medium' | 'high';
  studentId?: string;
}

export interface VisitorFilters extends SearchParams {
  status?: 'checked-in' | 'checked-out';
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface HostelFilters extends SearchParams {
  plan?: string;
  isActive?: boolean;
  isPaid?: boolean;
  country?: string;
}

// ==========================================
// SUPERADMIN TYPES
// ==========================================

export interface SuperAdminDashboard {
  totalHostels: number;
  activeHostels: number;
  totalUsers: number;
  revenue: {
    total: number;
    monthly: number;
    pending: number;
  };
  recentHostels: Hostel[];
  planDistribution: {
    plan: string;
    count: number;
    revenue: number;
  }[];
}

export interface BillingOverview {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  paidHostels: number;
  unpaidHostels: number;
  revenueByPlan: {
    plan: string;
    revenue: number;
    count: number;
  }[];
  monthlyTrend: {
    month: string;
    revenue: number;
    hostels: number;
  }[];
}

// ==========================================
// UTILITY TYPES
// ==========================================

export type UserRole = 'owner' | 'admin' | 'warden' | 'student' | 'superadmin';
export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type ComplaintStatus = 'pending' | 'in-progress' | 'resolved';
export type ComplaintPriority = 'low' | 'medium' | 'high';
export type VisitorStatus = 'checked-in' | 'checked-out';
export type HostelPlan = 'free' | 'basic' | 'premium' | 'enterprise';

// Helper type for partial updates
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Type for API endpoints that might return different data structures
export type ApiEndpointResponse<T> = T | ApiResponse<T>;

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: ValidationError[];
  code?: string;
}

// ==========================================
// COMPONENT PROP TYPES
// ==========================================

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

export interface FilterOption {
  label: string;
  value: string | number | boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// ==========================================
// CONTEXT TYPES
// ==========================================

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
}

export interface HostelContextValue {
  currentHostel: Hostel | null;
  hostels: Hostel[];
  isLoading: boolean;
  setActiveHostel: (hostelId: string, syncToServer?: boolean) => Promise<void>;
  refreshHostels: () => Promise<void>;
  createHostel: (hostelData: CreateHostelData) => Promise<Hostel>;
  updateHostel: (hostelId: string, updates: Partial<Hostel>) => Promise<Hostel>;
}

// ==========================================
// HOOK RETURN TYPES
// ==========================================

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UsePaginatedApiResult<T> extends UseApiResult<PaginatedResponse<T>> {
  pagination: PaginatedResponse<T>['pagination'] | null;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export interface UseFormResult<T> {
  values: T;
  errors: Record<keyof T, string>;
  setValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
  isValid: boolean;
  isDirty: boolean;
  reset: () => void;
}
