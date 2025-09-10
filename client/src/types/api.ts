export interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  error?: string;
}

export interface Student {
  id: string;
  name: string;
  room?: string;
}

export interface Room {
  id: string;
  number: string;
  occupied: boolean;
  capacity: number;
}

export interface Visitor {
  id: string;
  visitorName: string;
  studentName: string;
  relation: string;
  checkIn: string;
  checkOut?: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'resolved' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  totalComplaints: number;
  complaints: Complaint[];
  occupancyRate?: number;
}
