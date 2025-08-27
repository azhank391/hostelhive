// utils/routes.ts - Central repository for all route paths
export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  OWNER: {
    HOSTEL_SELECTOR: '/owner/hostel-selector',
    DASHBOARD: '/owner/dashboard/[hostelId]',
    DASHBOARD_WITH_ID: (hostelId: string) => `/owner/dashboard/${hostelId}`,
    PROFILE: '/owner/profile',
    SETTINGS: '/owner/settings',
  },
  WARDEN: {
    DASHBOARD: '/warden/dashboard',
    PROFILE: '/warden/profile',
    SETTINGS: '/warden/settings',
  },
  STUDENT: {
    DASHBOARD: '/student/dashboard',
    PROFILE: '/student/profile',
    BOOKINGS: '/student/bookings',
    PAYMENTS: '/student/payments',
  },
  SUPERADMIN: {
    DASHBOARD: '/superadmin/dashboard',
    OWNERS: '/superadmin/owners',
    OWNER_DETAILS: (ownerId: string) => `/superadmin/owners/${ownerId}`,
    HOSTELS: '/superadmin/hostels',
    HOSTEL_DETAILS: (hostelId: string) => `/superadmin/hostels/${hostelId}`,
    WARDENS: '/superadmin/wardens',
    WARDEN_DETAILS: (wardenId: string) => `/superadmin/wardens/${wardenId}`,
    STUDENTS: '/superadmin/students',
    STUDENT_DETAILS: (studentId: string) => `/superadmin/students/${studentId}`,
    SETTINGS: '/superadmin/settings',
  },
} as const;
