'use client';

/**
 * 🎯 INTELLIGENT LANDING PAGE RESOLVER
 * 
 * Determines the appropriate landing page based on user permissions
 * without forcing dashboard access for users who don't need it.
 */

export interface UserPermissions {
  [key: string]: boolean;
}

export interface LandingPageResult {
  path: string;
  section: string;
  autoExpand?: string | null;
  reason: string;
}

export class IntelligentLandingResolver {
  
  /**
   * 🎯 SECTION PRIORITY MAPPING
   * Defines the order of sections to check for landing pages
   */
  private static SECTION_PRIORITIES = [
    // Dashboard removed as explicit permission; hostel_read implies base dashboard
    {
      section: 'dashboard',
      permission: 'hostel_read',
      path: '/dashboard',
      autoExpand: null,
      description: 'Base Dashboard Access'
    },
    {
      section: 'students',
      permission: 'student_read',
      path: '/dashboard/students',
      autoExpand: 'students',
      description: 'Student Management'
    },
    {
      section: 'rooms',
      permission: 'room_read', 
      path: '/dashboard/rooms',
      autoExpand: 'rooms',
      description: 'Room Management'
    },
    {
      section: 'complaints',
      permission: 'complaint_read',
      path: '/dashboard/complaints',
      autoExpand: 'complaints', 
      description: 'Complaint Management'
    },
    {
      section: 'visitors',
      permission: 'visitor_read',
      path: '/dashboard/visitors',
      autoExpand: 'visitors',
      description: 'Visitor Management'
    },
    {
      section: 'staff',
      permission: 'staff_read',
      path: '/dashboard/staff',
      autoExpand: 'staff',
      description: 'Staff Management'
    },
    {
      section: 'reports',
      permission: 'view_reports',
      path: '/dashboard/reports',
      autoExpand: 'reports',
      description: 'Reports & Analytics'
    },
    {
      section: 'billing',
      permission: 'view_billing',
      path: '/dashboard/billing',
      autoExpand: 'billing',
      description: 'Billing Management'
    },
    {
      section: 'settings',
      permission: 'hostel_read',
      path: '/dashboard/settings',
      autoExpand: 'settings',
      description: 'Hostel Settings'
    }
  ];

  /**
   * 🎯 Determine the appropriate landing page for a user
   * @param permissions - User's permissions object
   * @param role - User's primary role (optional)
   * @returns Landing page information
   */
  static determineLandingPage(permissions: UserPermissions, role?: string): LandingPageResult {
    // role is currently not used in resolution logic
    void role;
    console.log('🎯 Determining landing page for permissions:', Object.keys(permissions).filter(p => permissions[p]));
    
    // 1. Check each section in priority order
    for (const section of this.SECTION_PRIORITIES) {
      if (permissions[section.permission]) {
        console.log(`✅ Found landing page: ${section.path} (${section.description})`);
        return {
          path: section.path,
          section: section.section,
          autoExpand: section.autoExpand,
          reason: `User has ${section.permission} permission - directing to ${section.description}`
        };
      }
    }
    
    // 2. Fallback: Check for any operational permission
    const operationalPermissions = Object.keys(permissions).filter(perm => 
      permissions[perm] && 
      !['profile_read', 'profile_update'].includes(perm) &&
      perm.includes('_')
    );
    
    if (operationalPermissions.length > 0) {
      console.log(`🔄 Fallback: Found operational permissions:`, operationalPermissions);
      
      // Try to map to a section
      const firstPerm = operationalPermissions[0];
      const category = firstPerm.split('_')[0]; // e.g., 'student' from 'student_create'
      
      const fallbackSection = this.SECTION_PRIORITIES.find(s => 
        s.section === category || s.section === `${category}s`
      );
      
      if (fallbackSection) {
        return {
          path: fallbackSection.path,
          section: fallbackSection.section,
          autoExpand: fallbackSection.autoExpand,
          reason: `Fallback: Mapped ${firstPerm} to ${fallbackSection.description}`
        };
      }
    }
    
    // 3. Last resort: Profile page if they can read their own profile
    if (permissions['profile_read']) {
      console.log(`📋 Last resort: Directing to profile page`);
      return {
        path: '/dashboard/profile',
        section: 'profile',
        autoExpand: 'profile',
        reason: 'User can only access profile - minimal permissions'
      };
    }
    
    // 4. No permissions found - this shouldn't happen with proper auth
    console.warn('❌ No valid permissions found for landing page');
    return {
      path: '/auth/login',
      section: 'login',
      reason: 'No valid permissions found - redirecting to login'
    };
  }

  /**
   * 🎯 Get available sections for sidebar rendering
   * @param permissions - User's permissions object
   * @returns Array of available sections
   */
  static getAvailableSections(permissions: UserPermissions): string[] {
    return this.SECTION_PRIORITIES
      .filter(section => permissions[section.permission])
      .map(section => section.section);
  }

  /**
   * 🎯 Check if user has dashboard access
   * @param permissions - User's permissions object
   * @returns Boolean indicating dashboard access
   */
  static hasDashboardAccess(permissions: UserPermissions): boolean {
  return permissions['hostel_read'] === true;
  }

  /**
   * 🎯 Get permission summary for debugging
   * @param permissions - User's permissions object
   * @returns Permission analysis
   */
  static analyzePermissions(permissions: UserPermissions) {
    const activePermissions = Object.keys(permissions).filter(p => permissions[p]);
    const availableSections = this.getAvailableSections(permissions);
    const hasDashboard = this.hasDashboardAccess(permissions);
    const landingPage = this.determineLandingPage(permissions);
    
    return {
      totalPermissions: activePermissions.length,
      activePermissions,
      availableSections,
      hasDashboard,
      recommendedLanding: landingPage,
      permissionCategories: this.categorizePermissions(activePermissions)
    };
  }

  /**
   * 🎯 Categorize permissions for analysis
   * @param permissions - Array of permission names
   * @returns Categorized permissions
   */
  private static categorizePermissions(permissions: string[]) {
    const categories: { [key: string]: string[] } = {};
    
    permissions.forEach(perm => {
      const category = perm.split('_')[0];
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(perm);
    });
    
    return categories;
  }
}

export default IntelligentLandingResolver;
