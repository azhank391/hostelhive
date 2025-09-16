'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { notification } from '@/lib/toast';
import { useCurrentHostelId } from '@/lib/context-aware-api';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/ui/PermissionGate';
import { apiClient } from '@/lib/api-client';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  ShieldIcon,
  UsersIcon,
  SettingsIcon,
  UserPlusIcon,
  MailIcon,
  PhoneIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
  DownloadIcon
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: {
    id: string;
    name: string;
    displayName: string;
    isSystemRole: boolean;
    permissions?: Array<{
      id: string;
      name: string;
      displayName: string;
      category: string;
    }>;
  };
  permissions: Array<{
    id: string;
    name: string;
    display_name: string;
    category: string;
  }>;
  isActive: boolean;
  createdAt: string;
}

interface CustomRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystemRole?: boolean;
  permissions: Array<{
    id: string;
    name: string;
    displayName: string;
    category: string;
  }>;
}

interface Permission {
  id: string;
  name: string;
  displayName: string;
  category: string;
  description?: string;
}


// 🎯 Permission Groups for Better UX - Updated with complete database permissions for Owner role
interface PermissionGroup {
  title: string;
  description: string;
  permissions: string[];
  icon: string;
  required?: boolean;
  dependencies?: string[]; // Required permissions for this group to function
  isHighPrivilege?: boolean; // High privilege permissions that need special warnings
  highPrivilegeWarning?: { [key: string]: string }; // Warnings for specific high-privilege permissions
  hideFromOwner?: boolean; // Hide this group from being assigned by owners (for system permissions)
}

const PERMISSION_GROUPS: Record<string, PermissionGroup> = {

  // Core Access (Always included)
  core_access: {
    title: "Dashboard Access",
    description: "Essential permissions for accessing the dashboard",
    permissions: [
      'hostel_read'        // View hostel information (basic access)
    ],
    icon: "🏠",
    required: false
  },

  // Student Management  
  student_management: {
    title: "Student Management",
    description: "Manage student records and room assignments",
    permissions: [
      'student_read',         // View student details
      'student_create',       // Add new students  
      'student_update',       // Edit student information
      'student_delete'        // Remove students (HIGH PRIVILEGE)
    ],
    icon: "👥",
    dependencies: ['hostel_read'],
    highPrivilegeWarning: {
      'student_delete': 'Allows permanent removal of student records. This action cannot be undone and will also remove all associated room allocations and complaint history.'
    }
  },

  // Room Management
  room_management: {
    title: "Room Management", 
    description: "Manage rooms, allocations and availability",
    permissions: [
      'room_read',        // View room details
      'room_create',      // Create new rooms
      'room_update',      // Update room information
      'room_allocation_create', // Assign rooms to students
      'room_allocation_delete', // Remove room assignments
      'room_allocation_read',   // View room allocations
      'room_delete'       // Delete rooms (HIGH PRIVILEGE)
    ],
    icon: "🛏️",
    dependencies: ['hostel_read'],
    highPrivilegeWarning: {
      'room_delete': 'Allows permanent deletion of room records. This will also remove all allocation history for the room and cannot be undone.'
    }
  },

  // Visitor Management
  visitor_management: {
    title: "Visitor Management",
    description: "Track and manage visitor entries and logs",
    permissions: [
      'visitor_read',       // View visitor logs
      'visitor_create',     // Create visitor entries
      'visitor_update',     // Update visitor information / checkout
      'visitor_delete'      // Remove visitor records (HIGH PRIVILEGE)
    ],
    icon: "🚪",
    dependencies: ['hostel_read'],
    highPrivilegeWarning: {
      'visitor_delete': 'Allows deletion of visitor records from the system. This removes the permanent log of visits.'
    }
  },

  // Complaint Management
  complaint_management: {
    title: "Complaint Management", 
    description: "Handle student complaints and maintenance issues",
    permissions: [
      'complaint_read',       // View complaints
      'complaint_create',     // Create complaints
      'complaint_update',     // Update complaint details / resolve
      'complaint_delete'      // Remove complaints (HIGH PRIVILEGE)
    ],
    icon: "📝",
    dependencies: ['hostel_read'],
    highPrivilegeWarning: {
      'complaint_delete': 'Allows permanent removal of complaint records. This action cannot be undone and removes the complaint history.'
    }
  },

  // Staff Management
  staff_management: {
    title: "Staff Management",
    description: "Manage staff members and their accounts",
    permissions: [
      'staff_read',         // View staff members
      'staff_create',       // Create new staff members
      'staff_update',       // Update staff information
      'role_assign',        // Assign roles to staff
      'staff_delete'        // Delete staff members (HIGH PRIVILEGE)
    ],
    icon: "👨‍💼",
    dependencies: ['hostel_read'],
    highPrivilegeWarning: {
      'staff_delete': 'Allows permanent removal of staff accounts. This immediately revokes their access to the system and cannot be undone.',
      'role_assign': 'Allows changing roles of staff members, which can elevate or reduce their access permissions. Use with caution.'
    }
  },

  // Role Management
  

  // Exports & Analytics
  reports_analytics: {
    title: "Data Exports", 
    description: "Access hostel data exports and billing information",
    permissions: [
      'view_billing',      // View billing information
      'export_room_data',  // Export rooms
      'export_staff_data', // Export staff
      'export_student_data', // Export students
      'export_visitor_data', // Export visitors
      'export_complaint_data' // Export complaints
    ],
    icon: "📊",
    dependencies: ['hostel_read'],
    highPrivilegeWarning: {
      'data_export': 'Allows bulk export of sensitive hostel data including student and financial information.'
    }
  },

  // Hostel Management (High Privilege)
  hostel_management: {
    title: "Hostel Creation & Management",
    description: "Create, update and manage hostel properties (High Privilege)",
    permissions: [
      'hostel_create',         // Create new hostels
      'hostel_update',         // Update hostel information  
      'hostel_settings_update', // Update hostel settings
      'hostel_delete'          // Delete hostels (EXTREMELY HIGH PRIVILEGE)
    ],
    icon: "🏗️",
    dependencies: ['hostel_read'],
    isHighPrivilege: true,
    highPrivilegeWarning: {
      'hostel_create': 'Allows creation of new hostel properties. This is typically an owner-level operation.',
      'hostel_delete': 'EXTREMELY DANGEROUS: Allows permanent deletion of entire hostels including ALL student data, rooms, complaints, and history. This action CANNOT be undone.'
    }
  }
};

export const StaffManagement: React.FC = () => {
  const router = useRouter();
  const { getHostelIdSafe } = useCurrentHostelId();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<CustomRole[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateRoleForm, setShowCreateRoleForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingStaffRole, setEditingStaffRole] = useState<StaffMember | null>(null);
  const [editingRolePermissions, setEditingRolePermissions] = useState<Set<string>>(new Set());
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [permissionDisplayNames, setPermissionDisplayNames] = useState<Record<string, string>>({});

  // Helper: humanize permission identifiers as a fallback
  const humanizePermissionName = (name?: string) => {
    if (!name) return '';
    return name
      .toString()
      .replace(/_/g, ' ')
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Build final display name mapping from API and roles
  const buildPermissionDisplayNames = (apiMap: Record<string, string> = {}, rolesList: Array<any> = []) => {
    const map: Record<string, string> = { ...apiMap };

    // add from roles (custom + system)
    rolesList.forEach((r) => {
      (r.permissions || []).forEach((p: any) => {
        const key = p.name || p.id;
        if (!key) return;
        if (!map[key]) {
          map[key] = p.displayName || p.display_name || humanizePermissionName(key);
        }
      });
    });

    // ensure groups provide fallback labels
    Object.values(PERMISSION_GROUPS).forEach((group) => {
      (group.permissions || []).forEach((perm: string) => {
        if (!map[perm]) map[perm] = humanizePermissionName(perm);
      });
    });

    return map;
  };

  // Use permission hook for cleaner permission checking
  const canViewStaff = hasPermission('staff_read');
  const canManageStaff = hasPermission('staff_update');
  const canCreateStaff = hasPermission('staff_create');
  const canDeleteStaff = hasPermission('staff_delete');
  const canToggleStaffStatus = hasPermission('staff_update');
  const canAssignRoles = hasPermission('role_assign');
  const canExportStaff = hasPermission('export_staff_data');

  useEffect(() => {
    if (!canViewStaff) return;

    // load RBAC data and compose displayName map
    const loadRBACData = async () => {
      await fetchStaff();
      await fetchCustomRoles(); // sets customRoles state
      await fetchAvailableRoles(); // sets availableRoles state
      await fetchAvailablePermissions(); // sets availablePermissions and partial map

      // combine maps from API and roles
      const apiMap = permissionDisplayNames || {};
      const rolesCombined = [...(customRoles || []), ...(availableRoles || [])];
      const finalMap = buildPermissionDisplayNames(apiMap, rolesCombined);
      setPermissionDisplayNames(finalMap);
    };

    loadRBACData().catch((err) => console.error('Failed to load RBAC data:', err));
  }, [canViewStaff]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // // 🎯 Update permissions based on selected groups with dependency management
  // const updatePermissionsFromGroups = (groups: Set<string>) => {
  //   const allPermissions = new Set<string>();
  //   const addedGroups = new Set<string>();
    
  //   // Helper function to add group and its dependencies
  //   const addGroupWithDependencies = (groupKey: string) => {
  //     if (addedGroups.has(groupKey)) return; // Avoid circular dependencies
      
  //     const group = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS];
  //     if (!group) return;
      
  //     addedGroups.add(groupKey);
      
  //     // Add group permissions
  //     group.permissions.forEach(permission => {
  //       allPermissions.add(permission);
  //     });
      
  //     // Add dependencies
  //     if (group.dependencies) {
  //       group.dependencies.forEach(depPermission => {
  //         allPermissions.add(depPermission);
  //       });
  //     }
  //   };
    
  //   // Process all selected groups
  //   groups.forEach(groupKey => {
  //     addGroupWithDependencies(groupKey);
  //   });
    
  //   return Array.from(allPermissions);
  // };

  // 🎯 Update permissions based on individual permission selection with enhanced dependency logic
  const updatePermissionsFromIndividual = (permissions: Set<string>) => {
    const allPermissions = new Set<string>();
    
    // Add selected permissions
    permissions.forEach(permission => {
      allPermissions.add(permission);
    });
    
    // Add dependencies for selected permissions from groups
    permissions.forEach(permission => {
      const group = Object.values(PERMISSION_GROUPS).find(g => g.permissions.includes(permission));
      if (group && group.dependencies) {
        group.dependencies.forEach(depPermission => {
          allPermissions.add(depPermission);
        });
      }
    });
    
    // ✨ Enhanced dependency logic for specific permission combinations
    permissions.forEach(permission => {
      
      // Room allocation/deallocation dependencies
      if (permission === 'room_allocation_create' || permission === 'room_allocation_update' || permission === 'room_allocation_delete') {
        allPermissions.add('student_read'); // Need to access Students page
        allPermissions.add('room_read'); // Need to access Room Management
      }
      
      // Visitor management dependencies
      if (permission.startsWith('visitor_')) {
        allPermissions.add('student_read'); // Need to see which students have visitors
      }
      
      // Complaint management dependencies
      if (permission.startsWith('complaint_')) {
        allPermissions.add('student_read'); // Need to see which students filed complaints
      }
      
      // Any permission that modifies students requires student read access
      if (permission.includes('student_') && (permission.includes('update') || permission.includes('create') || permission.includes('delete'))) {
        allPermissions.add('student_read');
      }
      
      // Any permission that modifies rooms requires room read access
      if (permission.includes('room_') && (permission.includes('update') || permission.includes('create') || permission.includes('delete'))) {
        allPermissions.add('room_read');
      }
      
      // Role management requires staff read access
      if (permission.includes('staff_') && (permission.includes('create') || permission.includes('update') || permission.includes('delete') || permission.includes('assign'))) {
        allPermissions.add('staff_read');
      }
      
    });
    
    return Array.from(allPermissions);
  };

  // 🎯 Handle group selection
  // const handleGroupToggle = (groupKey: string) => {
  //   if (groupKey === 'hostel_read') return; // Can't remove basic access
    
  //   const newGroups = new Set(selectedGroups);
  //   if (newGroups.has(groupKey)) {
  //     newGroups.delete(groupKey);
  //   } else {
  //     newGroups.add(groupKey);
  //   }
  //   setSelectedGroups(newGroups);
  // };

  // 🎯 Handle individual permission selection
  const handlePermissionToggle = (permission: string) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setSelectedPermissions(newPermissions);
  };

  // 🎯 Handle category expansion
  const handleCategoryToggle = (categoryKey: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  // 🎯 Handle select all permissions in a category
  const handleSelectAllInCategory = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS];
    if (!group) return;

    const newPermissions = new Set(selectedPermissions);
    group.permissions.forEach(permission => {
      newPermissions.add(permission);
    });
    setSelectedPermissions(newPermissions);
  };

  // 🎯 Handle deselect all permissions in a category
  const handleDeselectAllInCategory = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS];
    if (!group) return;

    const newPermissions = new Set(selectedPermissions);
    group.permissions.forEach(permission => {
      newPermissions.delete(permission);
    });
    setSelectedPermissions(newPermissions);
  };

  const fetchStaff = async () => {
    try {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        notification.error('No hostel selected');
        return;
      }

      const response = await apiClient.get(`/hostels/${hostelId}/staff`);
      setStaff((response as any).data || []);
    } catch (error: any) {
      console.error('Failed to fetch staff:', error);
      notification.error(error.response?.data?.message || 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRoles = async () => {
    try {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return;
      }

      const response = await apiClient.get(`/rbac/hostels/${hostelId}/roles`);
      const roles = (response as any).data || [];
      console.log("the response of fetchCustomRoles:", response);
      // Normalize display name and permission displayNames
      const normalized = roles.map((r: any) => ({
        ...r,
        displayName: r.displayName || r.display_name || r.name || '',
        permissions: (r.permissions || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName || p.display_name || p.name,
          category: p.category,
        })),
      }));

      setCustomRoles(normalized);
    } catch (error: any) {
      console.error('Failed to fetch custom roles:', error);
    }
  };

  const fetchAvailableRoles = async (retryCount = 0, maxRetries = 5, delayMs = 400) => {
    try {
      const hostelId = getHostelIdSafe();
      if (!hostelId) {
        return;
      }

      // Fetch both system roles and custom roles for staff creation
      const [systemRolesResponse, customRolesResponse] = await Promise.all([
        apiClient.get('/rbac/system-roles'),
        apiClient.get(`/rbac/hostels/${hostelId}/roles`)
      ]);

      const systemRoles = (systemRolesResponse as any).data || [];
      const customRoles = (customRolesResponse as any).data || [];

      // Filter system roles to only include staff-appropriate roles (exclude student, owner)
      const staffSystemRoles = systemRoles.filter((role: any) =>
        role.name === 'warden' || role.name === 'staff'
      );

      // Combine system roles and custom roles with normalization
      const allAvailableRoles = [
        ...staffSystemRoles.map((role: any) => ({
          id: role.id,
          name: role.name,
          displayName: role.displayName || role.display_name || role.name,
          description: role.description,
          isSystemRole: true,
          permissions: role.permissions || []
        })),
        ...customRoles.map((role: any) => ({
          id: role.id,
          name: role.name,
          displayName: role.displayName || role.display_name || role.name,
          description: role.description,
          isSystemRole: false,
          permissions: (role.permissions || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            displayName: p.displayName || p.display_name || p.name,
            category: p.category
          }))
        }))
      ];
      console.log("the available roles are:", allAvailableRoles);

      // If this is a retry after role creation, check if the new role is present (optional: pass expectedRoleName/id)
      // For now, just retry if no custom roles found and retryCount < maxRetries
      if (retryCount < maxRetries && customRoles.length === 0) {
        await new Promise(res => setTimeout(res, delayMs));
        return fetchAvailableRoles(retryCount + 1, maxRetries, delayMs);
      }

      setAvailableRoles(allAvailableRoles);
    } catch (error: any) {
      if (retryCount < maxRetries) {
        await new Promise(res => setTimeout(res, delayMs));
        return fetchAvailableRoles(retryCount + 1, maxRetries, delayMs);
      }
      console.error('Failed to fetch available roles:', error);
      setAvailableRoles([]);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await apiClient.get('/rbac/permissions');
      const permissionsData = (response as any).data;
      
      // Handle grouped permissions format from backend
      if (permissionsData && typeof permissionsData === 'object') {
        // Convert grouped permissions to flat array and extract display names
        const flatPermissions: Permission[] = [];
        const displayNames: Record<string, string> = {};
        
        Object.keys(permissionsData).forEach(category => {
          const items = permissionsData[category];
          if (!Array.isArray(items)) return;
          items.forEach((permission: any) => {
            const display = permission.displayName || permission.display_name || permission.name || String(permission.id || '');
            flatPermissions.push({
              id: permission.id,
              name: permission.name,
              displayName: display,
              category: category,
              description: permission.description || ''
            });
            
            // Store display name mapping (by permission name)
            if (permission.name) {
              displayNames[permission.name] = display;
            } else if (permission.id) {
              displayNames[permission.id] = display;
            }
          });
        });
        
        setAvailablePermissions(flatPermissions);
        setPermissionDisplayNames(prev => ({ ...prev, ...displayNames }));
      } else {
        console.warn('Permissions API returned unexpected data format:', permissionsData);
        setAvailablePermissions([]);
        setPermissionDisplayNames({});
      }
    } catch (error: any) {
      console.error('Failed to fetch permissions:', error);
      setAvailablePermissions([]); // Set empty array as fallback
      setPermissionDisplayNames({});
    }
  };

  const handleCreateRole = async (roleData: any) => {
    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error('No hostel selected');
      return;
    }

    const operationId = `create-role-${Date.now()}`;
    setLoadingOperations(prev => new Set(prev).add(operationId));

    try {
      // Use individual permissions instead of groups
      const finalPermissions = updatePermissionsFromIndividual(selectedPermissions);
      
      const roleDataWithPermissions = {
        ...roleData,
        permissions: finalPermissions
      };

  const response = await apiClient.post(`/rbac/hostels/${hostelId}/roles`, roleDataWithPermissions);
  notification.success('Custom role created successfully');
  setShowCreateRoleForm(false);

  // Always re-fetch roles before showing staff creation form
  await fetchAvailableRoles();

  // Open staff creation form only after roles are re-fetched
  setShowCreateForm(true);

  // Reset form
  setSelectedPermissions(new Set());
  setSelectedGroups(new Set());
  setExpandedCategories(new Set());
    } catch (error: any) {
      console.error('Failed to create role:', error);
      notification.error(error.response?.data?.message || 'Failed to create custom role');
    } finally {
      setLoadingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  const handleCreateStaff = async (staffData: any) => {
    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error('No hostel selected');
      return;
    }

    const operationId = `create-${Date.now()}`;
    setLoadingOperations(prev => new Set(prev).add(operationId));

    // Create optimistic staff member
    const optimisticStaff = {
      id: `temp-${Date.now()}`, // Temporary ID
      name: staffData.name,
      email: staffData.email,
      phone: staffData.phone,
      role: {
        ...(availableRoles.find(role => role.id === staffData.roleId) || { id: '', name: '', displayName: '' }),
        isSystemRole: false
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      permissions: []
    };

    // Optimistically add to UI
    setStaff(prevStaff => [optimisticStaff, ...prevStaff]);
    setShowCreateForm(false);

    try {
      // Set default password
      const staffDataWithDefaults = {
        ...staffData,
        password: '123456' // Default password
      };
      
      const response = await apiClient.post(`/hostels/${hostelId}/staff`, staffDataWithDefaults);
      const createdStaff = (response as any).data;
      
      // Replace optimistic staff with real data
      setStaff(prevStaff => 
        prevStaff.map(member => 
          member.id === optimisticStaff.id ? createdStaff : member
        )
      );
      
      notification.success('Staff member created successfully');
    } catch (error: any) {
      console.error('Failed to create staff:', error);
      
      // Revert optimistic update
      setStaff(prevStaff => 
        prevStaff.filter(member => member.id !== optimisticStaff.id)
      );
      
      notification.error(error.response?.data?.message || 'Failed to create staff member');
      setShowCreateForm(true); // Reopen form on error
    } finally {
      setLoadingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  const handleUpdateStaff = async (staffId: string, staffData: any) => {
    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error('No hostel selected');
      return;
    }

    const operationId = `update-${staffId}`;
    setLoadingOperations(prev => new Set(prev).add(operationId));

    // Store original data for rollback
    const originalStaff = staff.find(member => member.id === staffId);
    if (!originalStaff) return;

    // Create optimistic update
    const optimisticStaff = {
      ...originalStaff,
      name: staffData.name,
      email: staffData.email,
      phone: staffData.phone,
      role: {
        ...(customRoles.find(role => role.id === staffData.role) || originalStaff.role),
        isSystemRole: false
      }
    };

    // Optimistically update UI
    setStaff(prevStaff => 
      prevStaff.map(member => 
        member.id === staffId ? optimisticStaff : member
      )
    );
    setEditingStaff(null);

    try {
      const response = await apiClient.put(`/hostels/${hostelId}/staff/${staffId}`, staffData);
      const updatedStaff = (response as any).data;
      
      // Replace optimistic update with real data
      setStaff(prevStaff => 
        prevStaff.map(member => 
          member.id === staffId ? updatedStaff : member
        )
      );
      
      notification.success('Staff member updated successfully');
    } catch (error: any) {
      console.error('Failed to update staff:', error);
      
      // Revert optimistic update
      setStaff(prevStaff => 
        prevStaff.map(member => 
          member.id === staffId ? originalStaff : member
        )
      );
      
      notification.error(error.response?.data?.message || 'Failed to update staff member');
      setEditingStaff(originalStaff); // Reopen edit form on error
    } finally {
      setLoadingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  const handleDeleteStaff = (staffId: string) => {
    const staffMember = staff.find(member => member.id === staffId);
    if (!staffMember) return;

    setStaffToDelete(staffMember);
    setDeleteConfirmText('');
    setShowDeleteConfirm(true);
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete || deleteConfirmText !== 'DELETE') {
      notification.error('Please type "DELETE" to confirm');
      return;
    }

    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error('No hostel selected');
      return;
    }

    const operationId = `delete-${staffToDelete.id}`;
    setLoadingOperations(prev => new Set(prev).add(operationId));

    // Store original data for rollback
    const originalStaff = staff.find(member => member.id === staffToDelete.id);
    if (!originalStaff) return;

    // Optimistically remove from UI
    setStaff(prevStaff => prevStaff.filter(member => member.id !== staffToDelete.id));

    try {
      const response = await apiClient.delete(`/hostels/${hostelId}/staff/${staffToDelete.id}`) as any;
      
      // Show detailed success message with what was deleted
      const deletedRecords = response.deletedRecords;
      let successMessage = 'Staff member deleted successfully';
      
      if (deletedRecords) {
        const details = [];
        if (deletedRecords.rolesPreserved > 0) details.push(`${deletedRecords.rolesPreserved} custom role(s) preserved for reassignment`);
        if (deletedRecords.usersReassigned > 0) details.push(`${deletedRecords.usersReassigned} user(s) reassigned to default role`);
        if (deletedRecords.complaints > 0) details.push(`${deletedRecords.complaints} complaint(s) deleted`);
        if (deletedRecords.roomAllocations > 0) details.push(`${deletedRecords.roomAllocations} room allocation(s) deleted`);
        if (deletedRecords.visitorLogs > 0) details.push(`${deletedRecords.visitorLogs} visitor log(s) deleted`);
        
        if (details.length > 0) {
          successMessage += `\n\n${details.join('\n')}`;
        }
      }
      
      notification.success(successMessage);
      
      // Close modal
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
      setDeleteConfirmText('');
    } catch (error: any) {
      console.error('Failed to delete staff:', error);
      
      // Revert optimistic update
      setStaff(prevStaff => {
        const newStaff = [...prevStaff];
        const index = newStaff.findIndex(member => member.id > staffToDelete.id);
        newStaff.splice(index === -1 ? newStaff.length : index, 0, originalStaff);
        return newStaff;
      });
      
      notification.error(error.response?.data?.message || 'Failed to delete staff member');
    } finally {
      setLoadingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  const handleToggleStaffStatus = async (staffId: string, isActive: boolean) => {
    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error('No hostel selected');
      return;
    }

    const operationId = `toggle-${staffId}`;
    setLoadingOperations(prev => new Set(prev).add(operationId));

    // Store original data for rollback
    const originalStaff = staff.find(member => member.id === staffId);
    if (!originalStaff) return;

    // Optimistically update status
    setStaff(prevStaff => 
      prevStaff.map(member => 
        member.id === staffId ? { ...member, isActive } : member
      )
    );

    try {
      await apiClient.patch(`/hostels/${hostelId}/staff/${staffId}/status`, { isActive });
      notification.success(`Staff member ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Failed to toggle staff status:', error);
      
      // Revert optimistic update
      setStaff(prevStaff => 
        prevStaff.map(member => 
          member.id === staffId ? originalStaff : member
        )
      );
      
      notification.error(error.response?.data?.message || 'Failed to update staff status');
    } finally {
      setLoadingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  // Handle permission group toggle for editing
  const handleEditGroupToggle = (groupKey: string) => {
    if (groupKey === 'hostel_read') return; // Can't remove basic access
    
    const newGroups = new Set(editingRolePermissions);
    if (newGroups.has(groupKey)) {
      newGroups.delete(groupKey);
    } else {
      newGroups.add(groupKey);
    }
    setEditingRolePermissions(newGroups);
  };

  // Handle individual permission toggle for editing
  const handleEditPermissionToggle = (permission: string) => {
    const newPermissions = new Set(editingRolePermissions);
    if (newPermissions.has(permission)) {
      newPermissions.delete(permission);
    } else {
      newPermissions.add(permission);
    }
    setEditingRolePermissions(newPermissions);
  };

  // Handle select all in category for editing
  const handleEditSelectAllInCategory = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey];
    if (!group) return;
    
    const newPermissions = new Set(editingRolePermissions);
    group.permissions.forEach(permission => {
      newPermissions.add(permission);
    });
    
    // Add dependencies
    if (group.dependencies) {
      group.dependencies.forEach(dep => {
        newPermissions.add(dep);
      });
    }
    
    setEditingRolePermissions(newPermissions);
  };

  // Handle deselect all in category for editing
  const handleEditDeselectAllInCategory = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey];
    if (!group || group.required) return;
    
    const newPermissions = new Set(editingRolePermissions);
    group.permissions.forEach(permission => {
      newPermissions.delete(permission);
    });
    
    setEditingRolePermissions(newPermissions);
  };

  // Update permissions from selected groups for editing
  const updateEditPermissionsFromGroups = (groups: Set<string>) => {
    const allPermissions = new Set<string>();
    groups.forEach(groupKey => {
      PERMISSION_GROUPS[groupKey]?.permissions.forEach(permission => {
        allPermissions.add(permission);
      });
    });
    return Array.from(allPermissions);
  };

  // Initialize editing permissions when opening modal
  const initializeEditPermissions = (staffMember: StaffMember) => {
    if (staffMember.role && !staffMember.role.isSystemRole) {
      // For custom roles, initialize with current permissions
      const currentPermissions = staffMember.role.permissions?.map((p: any) => p.name) || [];
      const permissions = new Set(currentPermissions);
      
      // Always include core permissions
      // permissions.add('hostel_read');
      
      setEditingRolePermissions(permissions);
      setIsEditingPermissions(true);
    } else {
      setEditingRolePermissions(new Set());
      setIsEditingPermissions(false);
    }
  };

  const handleEditRoleSubmit = async () => {
    if (!editingStaffRole) return;
    
    const roleSelect = document.getElementById('edit-role-select') as HTMLSelectElement;
    const roleId = roleSelect?.value;
    
    if (!roleId) {
      notification.error('Please select a role');
      return;
    }

    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error('No hostel selected');
      return;
    }

    const operationId = `edit-role-${editingStaffRole.id}`;
    setLoadingOperations(prev => new Set(prev).add(operationId));

    try {
      // Optimistic update - update UI immediately
      const updatedStaff = staff.find(s => s.id === editingStaffRole.id);
      if (updatedStaff) {
        const newRole = availableRoles.find(r => r.id === roleId);
        if (newRole) {
          // Update the staff member's role in the local state
          setStaff(prev => prev.map(s => 
            s.id === editingStaffRole.id 
              ? { 
                  ...s, 
                  role: {
                    ...newRole,
                    isSystemRole: newRole.isSystemRole || false
                  }
                }
              : s
          ));
        }
      }

      // Use the assignRoleToUser API
      await apiClient.post(`/hostels/${hostelId}/users/${editingStaffRole.id}/assign-role`, {
        roleId: roleId
      });

      notification.success('Role updated successfully');
      
      // Close modal and refresh data
      setShowEditRoleModal(false);
      setEditingStaffRole(null);
      setEditingRolePermissions(new Set());
      setIsEditingPermissions(false);
      await fetchStaff(); // Refresh the staff list
      
    } catch (error: any) {
      console.error('Failed to update role:', error);
      notification.error(error.message || 'Failed to update role');
      
      // Revert optimistic update on error
      await fetchStaff();
    } finally {
      setLoadingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  // Handle updating role permissions
  const handleUpdateRolePermissions = async () => {
    if (!editingStaffRole || !editingStaffRole.role) return;

    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error('No hostel selected');
      return;
    }

    const operationId = `update-permissions-${editingStaffRole.role.id}`;
    setLoadingOperations(prev => new Set(prev).add(operationId));

    try {
      // Convert permission names to the format expected by the API
      const Permissions = Array.from(editingRolePermissions);
      
      // Optimistic update - update UI immediately
      const updatedRole = {
        ...editingStaffRole.role,
        permissions: Permissions.map(name => ({ 
          id: name, 
          name: name, 
          displayName: permissionDisplayNames[name] || name, 
          category: 'custom' 
        }))
      };
      
      setStaff(prev => prev.map(s => 
        s.id === editingStaffRole.id 
          ? { ...s, role: updatedRole }
          : s
      ));

      // Update role permissions via API
      await apiClient.put(`/rbac/hostels/${hostelId}/roles/${editingStaffRole.role.id}`, {
        permission: Permissions
      });

      notification.success('Role permissions updated successfully');
      
      // Close modal and refresh data
      setShowEditRoleModal(false);
      setEditingStaffRole(null);
      setEditingRolePermissions(new Set());
      setIsEditingPermissions(false);
      await fetchStaff(); // Refresh the staff list
      
    } catch (error: any) {
      console.error('Failed to update role permissions:', error);
      notification.error(error.message || 'Failed to update role permissions');
      
      // Revert optimistic update on error
      await fetchStaff();
    } finally {
      setLoadingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  if (!canViewStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to view staff.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage your hostel staff and their permissions
              </p>
            </div>
            <div className="flex space-x-3 items-center">
              {canExportStaff && (
                <div className="flex items-center space-x-2 mr-4">
                  <button
                    onClick={async () => {
                      const hostelId = getHostelIdSafe();
                      if (!hostelId) return notification.error('No hostel selected');
                      try {
                        const resp = await fetch(`/api/hostels/${hostelId}/staff/export?format=csv`, {
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                        });
                        if (!resp.ok) throw new Error('Failed');
                        const blob = await resp.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `staff-${hostelId}-${new Date().toISOString().split('T')[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        notification.success('Staff exported (CSV)');
                      } catch (e) {
                        console.error(e);
                        notification.error('Export failed');
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" /> CSV
                  </button>
                  <button
                    onClick={async () => {
                      const hostelId = getHostelIdSafe();
                      if (!hostelId) return notification.error('No hostel selected');
                      try {
                        const resp = await fetch(`/api/hostels/${hostelId}/staff/export?format=json`, {
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                        });
                        if (!resp.ok) throw new Error('Failed');
                        const data = await resp.json();
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `staff-${hostelId}-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        notification.success('Staff exported (JSON)');
                      } catch (e) {
                        console.error(e);
                        notification.error('Export failed');
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" /> JSON
                  </button>
                </div>
              )}
              {canCreateStaff && (
                <button
                  onClick={() => setShowCreateRoleForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loadingOperations.size > 0}
                >
                  {loadingOperations.has('createRole') ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                  ) : (
                    <ShieldIcon className="h-4 w-4 mr-2" />
                  )}
                  Create Role
                </button>
              )}
              {(user?.permissions || []).includes('staff_create') && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loadingOperations.size > 0}
                >
                  {loadingOperations.has('create') ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <PlusIcon className="h-4 w-4 mr-2" />
                  )}
                  Add Staff Member
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <PermissionGate permission="staff_read">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Staff</dt>
                      <dd className="text-lg font-medium text-gray-900">{staff.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Staff</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {staff.filter(member => member.isActive).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Custom Roles</dt>
                      <dd className="text-lg font-medium text-gray-900">{customRoles.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <SettingsIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">System Roles</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {availableRoles.filter(role => role.isSystemRole).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PermissionGate>

        {/* Staff List */}
        <div className="bg-white shadow rounded-lg overflow-visible">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Staff Members</h2>
            <p className="mt-1 text-sm text-gray-500">
              {staff.length} staff member{staff.length !== 1 ? 's' : ''}
            </p>
          </div>

          {staff.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
              <p className="mt-1 text-sm text-gray-500">
                {canManageStaff 
                  ? "Get started by adding your first staff member."
                  : "No staff members have been added yet."
                }
              </p>
              <PermissionGate permission="staff_create">
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    disabled={loadingOperations.size > 0}
                  >
                    {loadingOperations.has('create') ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <PlusIcon className="h-4 w-4 mr-2" />
                    )}
                    Add Staff Member
                  </button>
                </div>
              </PermissionGate>
            </div>
          ) : (
            <div className="overflow-visible">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <PermissionGate permission="staff_read">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                    </PermissionGate>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <PermissionGate permissions={['staff_update', 'role_assign']} requireAll={false}>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </PermissionGate>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <MailIcon className="h-3 w-3 mr-1" />
                              {member.email}
                            </div>
                            {member.phone && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <PhoneIcon className="h-3 w-3 mr-1" />
                                {member.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ShieldIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {member.role?.displayName || member.role?.name || 'No Role'}
                          </span>
                          {member.role && !member.role.isSystemRole && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Custom
                            </span>
                          )}
                        </div>
                      </td>
                      <PermissionGate permission="staff_read">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {member.permissions?.length || 0} permission{(member.permissions?.length || 0) !== 1 ? 's' : ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(
                              member.permissions?.slice(0,2)
                                .map(p => permissionDisplayNames[p.name] || p.display_name || p.display_name || p.name)
                                .filter(Boolean)
                                .join(', ')
                            ) || 'No permissions'}
                            {(member.permissions?.length || 0) > 2 && ` +${(member.permissions?.length || 0) - 2} more`}
                          </div>
                        </td>
                      </PermissionGate>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <PermissionGate 
                        permissions={['staff_update', 'role_assign']} 
                        requireAll={false}
                        fallback={
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="text-gray-400 text-xs">
                              No permissions
                            </div>
                          </td>
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative dropdown-container" style={{ zIndex: openDropdown === member.id ? 9999 : 'auto' }}>
                            <button
                              onClick={() => setOpenDropdown(openDropdown === member.id ? null : member.id)}
                              className="inline-flex items-center p-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200 disabled:opacity-50"
                              disabled={loadingOperations.has(`update-${member.id}`) || loadingOperations.has(`delete-${member.id}`) || loadingOperations.has(`toggle-${member.id}`)}
                            >
                              <MoreVerticalIcon className="w-4 h-4" />
                            </button>
                            
                            {openDropdown === member.id && (
                              <>
                                {/* Backdrop to ensure dropdown is visible */}
                                <div className="fixed inset-0 z-[9998]" onClick={() => setOpenDropdown(null)}></div>
                                <div className="absolute right-0 z-[9999] mt-2 w-48 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 border border-gray-200">
                                  <div className="py-1" role="menu">
                                  <PermissionGate permission="staff_update">
                                    <button
                                      onClick={() => {
                                        setEditingStaff(member);
                                        setOpenDropdown(null);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      role="menuitem"
                                    >
                                      <PencilIcon className="w-4 h-4 mr-3" />
                                      Edit Staff
                                    </button>
                                  </PermissionGate>
                                  <PermissionGate permission="role_assign">
                                    <button
                                      onClick={() => {
                                        setEditingStaffRole(member);
                                        initializeEditPermissions(member);
                                        setShowEditRoleModal(true);
                                        setOpenDropdown(null);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      role="menuitem"
                                    >
                                      <ShieldIcon className="w-4 h-4 mr-3" />
                                      Edit Role/Permissions
                                    </button>
                                  </PermissionGate>
                                  <PermissionGate permission="staff_update">
                                    <button
                                      onClick={() => {
                                        handleToggleStaffStatus(member.id, !member.isActive);
                                        setOpenDropdown(null);
                                      }}
                                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                                        member.isActive 
                                          ? 'text-red-600' 
                                          : 'text-green-600'
                                      }`}
                                      role="menuitem"
                                      disabled={loadingOperations.has(`toggle-${member.id}`)}
                                    >
                                      {loadingOperations.has(`toggle-${member.id}`) ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div>
                                      ) : (
                                        <SettingsIcon className="w-4 h-4 mr-3" />
                                      )}
                                      {member.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                  </PermissionGate>
                                  <PermissionGate permission="staff_delete">
                                    <button
                                      onClick={() => {
                                        handleDeleteStaff(member.id);
                                        setOpenDropdown(null);
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                      role="menuitem"
                                      disabled={loadingOperations.has(`delete-${member.id}`)}
                                    >
                                      {loadingOperations.has(`delete-${member.id}`) ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div>
                                      ) : (
                                        <TrashIcon className="w-4 h-4 mr-3" />
                                      )}
                                      Delete
                                    </button>
                                  </PermissionGate>
                                </div>
                              </div>
                              </>
                            )}
                          </div>
                        </td>
                      </PermissionGate>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create/Edit Staff Form Modal */}
        {showCreateForm && (
        <PermissionGate permissions={['staff_update', 'role_assign']} requireAll={false}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-md shadow-xl rounded-lg bg-white">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingStaff(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {editingStaff ? 'Update staff member information' : 'Fill in the details to create a new staff account'}
                </p>
              </div>
                
                {/* Hostel selector note for multi-hostel owners */}
                {!editingStaff && user?.role === 'owner' && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">
                          Hostel Assignment
                        </h4>
                        <p className="text-sm text-blue-800">
                          This staff member will be created for the currently selected hostel.
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Switch hostels using the selector in the top navigation if needed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const data = {
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    phone: formData.get('phone') as string,
                    roleId: formData.get('roleId') as string
                  };
                  
                  if (editingStaff) {
                    handleUpdateStaff(editingStaff.id, data);
                  } else {
                    handleCreateStaff(data);
                  }
                }}>
                  <div className="space-y-5">
                  </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingStaff?.name || ''}
                        placeholder="Enter staff member's full name"
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                      />
                      <p className="mt-1 text-xs text-gray-500">The complete name as it should appear in the system</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={editingStaff?.email || ''}
                        placeholder="staff@hostel.com"
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                      />
                      <p className="mt-1 text-xs text-gray-500">Used for login and notifications</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        defaultValue={editingStaff?.phone || ''}
                        placeholder="+1 (555) 123-4567"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                      />
                      <p className="mt-1 text-xs text-gray-500">Optional contact number</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Staff Role <span className="text-red-500">*</span>
                      </label>
                      {canAssignRoles ? (
                        <select
                          name="roleId"
                          defaultValue={editingStaff?.role?.id || ''}
                          required
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors bg-white"
                        >
                          <option value="">Choose a role for this staff member</option>
                          {availableRoles
                            .filter(role => role && role.id) // Ensure role has valid id
                            .map((role, index) => (
                            <option key={`${role.id}-${index}`} value={role.id}>
                              {role.displayName} {role.isSystemRole ? '(System)' : '(Custom)'}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-600 sm:text-sm">
                          {editingStaff?.role?.displayName || 'No role assigned'} 
                          {editingStaff?.role?.isSystemRole ? ' (System)' : editingStaff?.role ? ' (Custom)' : ''}
                          <input type="hidden" name="roleId" value={editingStaff?.role?.id || ''} />
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {canAssignRoles 
                          ? "Determines what permissions this staff member will have"
                          : "You don't have permission to change roles"
                        }
                      </p>
                    </div>
                    
                    {!editingStaff && (
                      <><div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                            Default Login Credentials
                          </h4>
                          <p className="text-sm text-yellow-800">
                            Password will be set to <strong>123456</strong> and the staff member will be required to change it on first login.
                          </p>
                        </div>
                      </div>
                    </div><div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setEditingStaff(null);
                          } }
                          className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          disabled={editingStaff ? loadingOperations.has(`update-${(editingStaff as StaffMember).id}`) : loadingOperations.has('create')}
                        >
                          {loadingOperations.has(editingStaff ? `update-${(editingStaff as StaffMember).id}` : 'create') ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {editingStaff ? 'Updating...' : 'Creating...'}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              {editingStaff ? (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Update Staff
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Create Staff
                                </>
                              )}
                            </div>
                          )}
                        </button>
          </div>
      </>
          )}
        </form>
            </div>
          </div>
        </PermissionGate>
        )}

        {/* Create Role Modal */}
        <PermissionGate permission="staff_create">
          {showCreateRoleForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-xl rounded-lg bg-white">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    Create Custom Role
                  </h3>
                  <button
                    onClick={() => setShowCreateRoleForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Create a custom role with specific permissions for your staff members
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const roleName = formData.get('roleName') as string;
                
                console.log('Form data:', { roleName, selectedGroups });
                
                if (!roleName || roleName.trim() === '') {
                  notification.error('Role name is required');
                  return;
                }
                
                if (selectedPermissions.size === 0) {
                  notification.error('Please select at least one permission');

                  return;
                }
                
                // Generate internal name from role name (lowercase, replace spaces with underscores)
                const internalName = roleName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                
                // Get permission IDs from selected permissions
                const finalPermissions = updatePermissionsFromIndividual(selectedPermissions);
                
                const roleData = {
                  name: internalName,
                  displayName: roleName.trim(),
                  description: (formData.get('description') as string) || '',
                  permissions: finalPermissions
                };
                
                console.log('Role data being sent:', roleData);
                handleCreateRole(roleData);
              }}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Role Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="roleName"
                      placeholder="e.g., Receptionist, Maintenance Manager, Security Guard"
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">Name of the role that will be shown in the interface</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      placeholder="Describe what this role can do..."
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">Optional description of the role's responsibilities</p>
                  </div>

                 
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Role Capabilities <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Global warning about high-privilege permissions */}
                    <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                            🔐 Permission Security Notice
                          </h4>
                          <div className="text-sm text-yellow-800 mt-1">
                            <p className="mb-2">
                              <strong>High-Risk Permissions</strong> marked with <span className="px-1.5 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">HIGH RISK</span> can permanently delete data or export sensitive information.
                            </p>
                            <p className="text-xs">
                              Only grant these permissions to trusted staff who understand the consequences. 
                              These operations typically cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                        const isExpanded = expandedCategories.has(groupKey);
                        const selectedInGroup = group.permissions.filter(p => selectedPermissions.has(p)).length;
                        const isFullySelected = selectedInGroup === group.permissions.length;
                        const isPartiallySelected = selectedInGroup > 0 && selectedInGroup < group.permissions.length;
                        
                        return (
                          <div 
                            key={groupKey} 
                            className={`border rounded-lg transition-all ${
                              isFullySelected || isPartiallySelected
                                ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            } ${group.required ? 'opacity-75' : ''}`}
                          >
                            <div 
                              className="p-4 cursor-pointer"
                              onClick={() => handleCategoryToggle(groupKey)}
                            >
                              <div className="flex items-start space-x-3">
                                <span className="text-2xl">{group.icon}</span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-medium text-gray-900">{group.title}</h4>
                                      {group.isHighPrivilege && (
                                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                          HIGH PRIVILEGE
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {selectedInGroup}/{group.permissions.length} selected
                                      </span>
                                      <input
                                        type="checkbox"
                                        checked={isFullySelected}
                                        ref={(input) => {
                                          if (input) input.indeterminate = isPartiallySelected;
                                        }}
                                        disabled={group.required}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          if (isFullySelected) {
                                            handleDeselectAllInCategory(groupKey);
                                          } else {
                                            handleSelectAllInCategory(groupKey);
                                          }
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                                  
                                  {group.isHighPrivilege && (
                                    <p className="text-xs text-red-600 mt-1 font-medium">
                                      ⚠️ This includes permissions to create/delete hostels and manage critical system data. Use with extreme caution!
                                    </p>
                                  )}
                                  
                                  {group.required && (
                                    <div className="text-xs text-blue-600 mt-1 font-medium">
                                      ✓ Required for all roles
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Expanded permissions list */}
                            {isExpanded && (
                              <div className="border-t border-gray-200 bg-gray-50 p-4">
                                <div className="grid grid-cols-1 gap-2">
                                  {group.permissions.map((permission) => {
                                    const isSelected = selectedPermissions.has(permission);
                                    const isHighPrivilege = permission.includes('delete') || 
                                                          permission === 'data_export' ||
                                                          permission === 'hostel_create' ||
                                                          permission === 'permission_manage';
                                    const hasWarning = group.highPrivilegeWarning && group.highPrivilegeWarning[permission];
                                    
                                    return (
                                      <div key={permission} className="space-y-1">
                                        <label className={`flex items-start space-x-2 p-3 rounded transition-colors cursor-pointer ${
                                          isHighPrivilege 
                                            ? 'bg-red-50 border border-red-200 hover:bg-red-100' 
                                            : 'hover:bg-white'
                                        }`}>
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handlePermissionToggle(permission)}
                                            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                              <span className="text-sm font-medium text-gray-900">
                                                {permissionDisplayNames[permission] || permission}
                                              </span>
                                              {isHighPrivilege && (
                                                <span className="px-1.5 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                                                  HIGH RISK
                                                </span>
                                              )}
                                            </div>
                                            {hasWarning && (
                                              <p className="text-xs text-red-600 mt-1 leading-relaxed">
                                                ⚠️ {group.highPrivilegeWarning?.[permission]}
                                              </p>
                                            )}
                                          </div>
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {/* High privilege warning for the group */}
                                {group.permissions.some(p => p.includes('delete') || p === 'data_export' || p === 'hostel_create') && (
                                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                      <div className="text-red-600 text-sm font-bold">⚠️</div>
                                      <div className="text-sm text-red-800">
                                        <p className="font-semibold">High Privilege Operations</p>
                                        <p className="text-xs mt-1">
                                          This category contains permissions that can permanently delete data or export sensitive information. 
                                          Only grant these to trusted staff members who understand the consequences.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Select/Deselect All buttons */}
                                <div className="mt-3 flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAllInCategory(groupKey)}
                                    className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                  >
                                    Select All
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeselectAllInCategory(groupKey)}
                                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                  >
                                    Deselect All
                                  </button>
                                  {group.permissions.some(p => p.includes('delete')) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        group.permissions.forEach(p => {
                                          if (p.includes('delete')) {
                                            setSelectedPermissions(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(p);
                                              return newSet;
                                            });
                                          }
                                        });
                                      }}
                                      className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    >
                                      Deselect Delete Operations
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="text-blue-600 text-sm">ℹ️</div>
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Permission Selection</p>
                          <p className="text-xs mt-1">
                            Click on any category to expand and select the specific permissions you want to grant. 
                            All necessary background permissions are automatically included to ensure everything works properly.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateRoleForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={loadingOperations.has('create-role') || selectedPermissions.size === 0}
                  >
                    {loadingOperations.has('create-role') ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Role
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          )}
        </PermissionGate>

        {/* Edit Role/Permissions Modal */}
        <PermissionGate permission="role_assign">
          {showEditRoleModal && editingStaffRole && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-xl rounded-lg bg-white">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    Edit Role & Permissions
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditRoleModal(false);
                      setEditingStaffRole(null);
                      setEditingRolePermissions(new Set());
                      setIsEditingPermissions(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Change role and permissions for {editingStaffRole.name}
                </p>
              </div>

              <div className="space-y-6">
                {/* Role Selection */}
                <div>
                  <label htmlFor="edit-role-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role
                  </label>
                  <select
                    id="edit-role-select"
                    name="roleId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={editingStaffRole.role?.id || ''}
                    onChange={(e) => {
                      const selectedRole = availableRoles.find(r => r.id === e.target.value);
                      if (selectedRole) {
                        // Initialize with only hostel_read and role's existing permissions
                        const basePerms = new Set(['hostel_read']);
                        selectedRole.permissions?.forEach(p => basePerms.add(p.name));
                        setEditingRolePermissions(basePerms);
                        
                        initializeEditPermissions({ 
                          ...editingStaffRole, 
                          role: {
                            ...selectedRole,
                            isSystemRole: selectedRole.isSystemRole || false
                          }
                        });
                      }
                    }}
                  >
                    <option value="">Select a role</option>
                    {availableRoles
                      .filter(role => role && role.id) // Ensure role has valid id
                      .map((role, index) => (
                      <option key={`${role.id}-${index}`} value={role.id}>
                        {role.displayName} {!role.isSystemRole && '(Custom)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Permission Groups for Custom Roles */}
                {isEditingPermissions && (
                  <div className="space-y-4">
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Edit Role Permissions
                      </h4>
                      
                      {/* Same warning as create role form */}
                      <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                              🔐 Permission Security Notice
                            </h4>
                            <div className="text-sm text-yellow-800 mt-1">
                              <p className="mb-2">
                                <strong>High-Risk Permissions</strong> marked with <span className="px-1.5 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">HIGH RISK</span> can permanently delete data or export sensitive information.
                              </p>
                              <p className="text-xs">
                                Only grant these permissions to trusted staff who understand the consequences. 
                                These operations typically cannot be undone.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                          const isExpanded = expandedCategories.has(groupKey);
                          const selectedInGroup = group.permissions.filter(p => editingRolePermissions.has(p)).length;
                          const isFullySelected = selectedInGroup === group.permissions.length;
                          const isPartiallySelected = selectedInGroup > 0 && selectedInGroup < group.permissions.length;
                          
                          return (
                            <div 
                              key={groupKey} 
                              className={`border rounded-lg transition-all ${
                                isFullySelected || isPartiallySelected
                                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              } ${group.required ? 'opacity-75' : ''}`}
                            >
                              <div 
                                className="p-4 cursor-pointer"
                                onClick={() => handleCategoryToggle(groupKey)}
                              >
                                <div className="flex items-start space-x-3">
                                  <span className="text-2xl">{group.icon}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-medium text-gray-900">{group.title}</h4>
                                        {group.isHighPrivilege && (
                                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                            HIGH PRIVILEGE
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                          {selectedInGroup}/{group.permissions.length} selected
                                        </span>
                                        <input
                                          type="checkbox"
                                          checked={isFullySelected}
                                          ref={(input) => {
                                            if (input) input.indeterminate = isPartiallySelected;
                                          }}
                                          disabled={group.required}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            if (isFullySelected) {
                                              handleEditDeselectAllInCategory(groupKey);
                                            } else {
                                              handleEditSelectAllInCategory(groupKey);
                                            }
                                          }}
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                                    
                                    {group.isHighPrivilege && (
                                      <p className="text-xs text-red-600 mt-1 font-medium">
                                        ⚠️ This includes permissions to create/delete hostels and manage critical system data. Use with extreme caution!
                                      </p>
                                    )}
                                    
                                    {group.required && (
                                      <div className="text-xs text-blue-600 mt-1 font-medium">
                                        ✓ Required for all roles
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Expanded permissions list */}
                              {isExpanded && (
                                <div className="border-t border-gray-200 bg-gray-50 p-4">
                                  <div className="grid grid-cols-1 gap-2">
                                    {group.permissions.map((permission) => {
                                      const isSelected = editingRolePermissions.has(permission);
                                      const isHighPrivilege = permission.includes('delete') || 
                                                            permission === 'data_export' ||
                                                            permission === 'hostel_create' ||
                                                            permission === 'permission_manage';
                                      const hasWarning = group.highPrivilegeWarning && group.highPrivilegeWarning[permission];
                                      
                                      return (
                                        <div key={permission} className="space-y-1">
                                          <label className={`flex items-start space-x-2 p-3 rounded transition-colors cursor-pointer ${
                                            isHighPrivilege 
                                              ? 'bg-red-50 border border-red-200 hover:bg-red-100' 
                                              : 'hover:bg-white'
                                          }`}>
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => handleEditPermissionToggle(permission)}
                                              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-2">
                                                <span className="text-sm font-medium text-gray-900">
                                                  {permissionDisplayNames[permission] || permission}
                                                </span>
                                                {isHighPrivilege && (
                                                  <span className="px-1.5 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                                                    HIGH RISK
                                                  </span>
                                                )}
                                              </div>
                                              {hasWarning && (
                                                <p className="text-xs text-red-600 mt-1 leading-relaxed">
                                                  ⚠️ {group.highPrivilegeWarning?.[permission]}
                                                </p>
                                              )}
                                            </div>
                                          </label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  
                                  {/* High privilege warning for the group */}
                                  {group.permissions.some(p => p.includes('delete') || p === 'data_export' || p === 'hostel_create') && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                      <div className="flex items-start space-x-2">
                                        <div className="text-red-600 text-sm font-bold">⚠️</div>
                                        <div className="text-sm text-red-800">
                                          <p className="font-semibold">High Privilege Operations</p>
                                          <p className="text-xs mt-1">
                                            This category contains permissions that can permanently delete data or export sensitive information. 
                                            Only grant these to trusted staff members who understand the consequences.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Select/Deselect All buttons */}
                                  <div className="mt-3 flex space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => handleEditSelectAllInCategory(groupKey)}
                                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                      Select All
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleEditDeselectAllInCategory(groupKey)}
                                      className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                      Deselect All
                                    </button>
                                    {group.permissions.some(p => p.includes('delete')) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          group.permissions.forEach(p => {
                                            if (p.includes('delete')) {
                                              setEditingRolePermissions(prev => {
                                                const newSet = new Set(prev);
                                                newSet.delete(p);
                                                return newSet;
                                              });
                                            }
                                          });
                                        }}
                                        className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                      >
                                        Deselect Delete Operations
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="text-blue-600 text-sm">ℹ️</div>
                          <div className="text-sm text-blue-800">
                            <p className="font-medium">Permission Selection</p>
                            <p className="text-xs mt-1">
                              Click on any category to expand and select the specific permissions you want to grant. 
                              All necessary background permissions are automatically included to ensure everything works properly.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditRoleModal(false);
                      setEditingStaffRole(null);
                      setEditingRolePermissions(new Set());
                      setIsEditingPermissions(false);
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {isEditingPermissions ? (
                    <button
                      type="button"
                      onClick={handleUpdateRolePermissions}
                      disabled={loadingOperations.has(`update-permissions-${editingStaffRole.role?.id}`)}
                      className="px-6 py-2 bg-green-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                    >
                      {loadingOperations.has(`update-permissions-${editingStaffRole.role?.id}`) ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </div>
                      ) : (
                        'Update Permissions'
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingPermissions(true)}
                      className="px-6 py-2 bg-blue-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Edit Permissions
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setStaffToDelete(null);
                    setDeleteConfirmText('');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteStaff}
                  disabled={deleteConfirmText !== 'DELETE' || loadingOperations.has(`delete-${staffToDelete?.id ?? ''}`)}
                  className="px-6 py-2 bg-red-600 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                >
                  {loadingOperations.has(`delete-${staffToDelete?.id ?? ''}`) ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete Permanently'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        </PermissionGate>
      </div>
    </div>
  )
};
