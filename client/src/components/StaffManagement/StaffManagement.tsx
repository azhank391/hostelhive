"use client";

import React, { useState, useEffect } from "react";
import StaffCreateModal from "./StaffCreateModal";
import StaffEditModal from "./StaffEditModal";
import RoleEditModal from "./RoleEditModal";
import { useRouter } from "next/navigation";
import { notification } from "@/lib/toast";
import { useCurrentHostelId } from "@/lib/context-aware-api";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/ui/PermissionGate";
import { apiClient } from "@/lib/api-client";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldIcon,
  UsersIcon,
  SettingsIcon,
  MailIcon,
  PhoneIcon,
  ChevronDownIcon,
  MoreVerticalIcon,
  DownloadIcon,
} from "lucide-react";

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
      "view_hostel_stats", // View hostel information (basic access)
      "hostel_read", // View hostel details
      "manage_profile", // update their own information
      "hostel_settings_update", // update hostel settings in the settings page
    ],
    icon: "🏠",
    required: false,
  },

  // Room Management
  room_management: {
    title: "Room Management",
    description: "Manage room allocations and room information",
    permissions: [
      "room_read", // View rooms
      "room_create", // Add new rooms
      "room_update", // Edit room information
      "room_delete", // Delete rooms
      "room_allocation_read", // View room allocations
      "room_allocation_create", // Assign students to rooms
      "room_allocation_delete", // Remove students from rooms
      "export_room_data", // Export room data (HIGH PRIVILEGE)
    ],
    icon: "🛏️",
    dependencies: ["hostel_read"],
    highPrivilegeWarning: {
      room_delete:
        "Allows permanent removal of rooms. This will also remove all student allocations for these rooms.",
      export_room_data:
        "Allows exporting sensitive room and student allocation data.",
    },
  },

  // Student Management
  student_management: {
    title: "Student Management",
    description: "Manage student records and room assignments",
    permissions: [
      "student_read", // View student details
      "student_create", // Add new students
      "student_update", // Edit student information
      "student_delete", // Delete students
      "export_student_data", // Export student data (HIGH PRIVILEGE)
    ],
    icon: "👥",
    dependencies: ["hostel_read"],
    highPrivilegeWarning: {
      student_delete:
        "Allows permanent removal of student records. This action cannot be undone and will also remove all associated room allocations and complaint history.",
      export_student_data:
        "Allows exporting sensitive student personal information and data.",
    },
  },

  // Staff Management
  staff_management: {
    title: "Staff Management",
    description: "Manage staff members and their roles",
    permissions: [
      "staff_read", // View staff details
      "staff_create", // Add new staff
      "staff_update", // Edit staff information
      "staff_delete", // Delete staff
      "role_assign", // Assign roles to users
      "export_staff_data", // Export staff data (HIGH PRIVILEGE)
    ],
    icon: "👨‍💼",
    dependencies: ["hostel_read"],
    isHighPrivilege: true,
    highPrivilegeWarning: {
      staff_delete:
        "Allows permanent removal of staff members. This action cannot be undone.",
      role_assign:
        "Allows changing user roles, which can grant or revoke access to sensitive functions.",
      export_staff_data:
        "Allows exporting sensitive staff personal information and role data.",
    },
  },

  // Visitor Management
  visitor_management: {
    title: "Visitor Management",
    description: "Manage visitor logs and visitor information",
    permissions: [
      "visitor_read", // View visitor logs
      "visitor_create", // Add new visitor entries
      "visitor_update", // Edit visitor information
      "visitor_delete", // Delete visitor entries
      "export_visitor_data", // Export visitor data (HIGH PRIVILEGE)
    ],
    icon: "👥",
    dependencies: ["hostel_read"],
    highPrivilegeWarning: {
      visitor_delete: "Allows permanent removal of visitor records.",
      export_visitor_data:
        "Allows exporting visitor logs and personal information.",
    },
  },

  // Complaint Management
  complaint_management: {
    title: "Complaint Management",
    description: "Handle student complaints and feedback",
    permissions: [
      "complaint_read", // View complaints
      "complaint_create", // Create new complaints
      "complaint_update", // Update complaint status
      "complaint_delete", // Delete complaints
      "view_complaint_stats", // View complaint statistics
      "export_complaint_data", // Export complaint data (HIGH PRIVILEGE)
    ],
    icon: "📢",
    dependencies: ["hostel_read"],
    highPrivilegeWarning: {
      complaint_delete:
        "Allows permanent removal of complaint records. This may affect audit trails.",
      export_complaint_data:
        "Allows exporting sensitive complaint information and student data.",
    },
  },

  // Reports & Analytics
  reporting: {
    title: "Billing",
    description: "Access to various reports and analytics",
    permissions: [
      "view_billing", // View billing information
    ],
    icon: "📊",
    dependencies: ["hostel_read"],
  },
  // Profile Management (Self-service)
};

// Generate permission display names from PERMISSION_GROUPS
const generatePermissionDisplayNames = (): Record<string, string> => {
  const displayNames: Record<string, string> = {};

  // Standard permission display name mapping
  const permissionDisplayMap: Record<string, string> = {
    // Core Access
    hostel_read: "View Hostel Information",
    view_hostel_stats: "View Hostel Statistics",
    manage_profile: "Update their own information",
    hostel_settings_update: "Update hostel settings",

    // Room Management
    room_read: "View Rooms",
    room_create: "Add New Rooms",
    room_update: "Edit Room Information",
    room_delete: "Delete Rooms",
    room_allocation_read: "View Room Allocations",
    room_allocation_create: "Assign Students to Rooms",
    room_allocation_delete: "Remove Students from Rooms",
    export_room_data: "Export Room Data",

    // Student Management
    student_read: "View Student Details",
    student_create: "Add New Students",
    student_update: "Edit Student Information",
    student_delete: "Delete Student Records",
    export_student_data: "Export Student Data",

    // Staff Management
    staff_read: "View Staff Details",
    staff_create: "Add New Staff",
    staff_update: "Edit Staff Information",
    staff_delete: "Delete Staff Records",
    role_assign: "Assign Staff Roles",
    export_staff_data: "Export Staff Data",

    // Visitor Management
    visitor_read: "View Visitor Logs",
    visitor_create: "Add Visitor Entries",
    visitor_update: "Edit Visitor Information",
    visitor_delete: "Delete Visitor Records",
    export_visitor_data: "Export Visitor Data",

    // Complaint Management
    complaint_read: "View Complaints",
    complaint_create: "Create New Complaints",
    complaint_update: "Update Complaint Status",
    complaint_delete: "Delete Complaint Records",
    view_complaint_stats: "View Complaint Statistics",
    export_complaint_data: "Export Complaint Data",

    // Reports & Analytics
    view_billing: "View Billing Information",

    // Profile Management
    view_own_data: "View Own Data",
  };

  // Apply display names from the mapping
  Object.entries(permissionDisplayMap).forEach(([permission, displayName]) => {
    displayNames[permission] = displayName;
  });

  return displayNames;
};

function StaffManagement() {
  const router = useRouter();
  const { getHostelIdSafe, hasHostel } = useCurrentHostelId();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // State variables
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<CustomRole[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [permissionDisplayNames, setPermissionDisplayNames] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [loadingOperations, setLoadingOperations] = useState<Set<string>>(
    new Set()
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateRoleForm, setShowCreateRoleForm] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showStaffEditModal, setShowStaffEditModal] = useState(false);
  const [showUpdatePermissionsModal, setShowUpdatePermissionsModal] =
    useState(false);
  const [modalMode, setModalMode] = useState<
    "changeRole" | "updatePermissions"
  >("changeRole");
  const [editingStaffRole, setEditingStaffRole] = useState<StaffMember | null>(
    null
  );
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingRolePermissions, setEditingRolePermissions] = useState<
    Set<string>
  >(new Set());
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Permission checks
  const canViewStaff = hasPermission("staff_read");
  const canCreateStaff = hasPermission("staff_create");
  const canEditStaff = hasPermission("staff_update");
  const canDeleteStaff = hasPermission("staff_delete");
  const canExportStaff = hasPermission("export_staff_data");
  const canManageStaff = canEditStaff || canDeleteStaff;
  const canAssignRoles = hasPermission("role_assign");

  // Initialize permission display names
  useEffect(() => {
    setPermissionDisplayNames(generatePermissionDisplayNames());
  }, []);

  const handleEditRoleSubmit = async () => {
    if (!editingStaffRole) return;

    const roleSelect = document.getElementById(
      "edit-role-select"
    ) as HTMLSelectElement;
    const roleId = roleSelect?.value;

    if (!roleId) {
      notification.error("Please select a role");
      return;
    }

    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error("No hostel selected");
      return;
    }

    const operationId = `edit-role-${editingStaffRole.id}`;
    setLoadingOperations((prev) => new Set(prev).add(operationId));

    try {
      // Optimistic update - update UI immediately
      const updatedStaff = staff.find((s) => s.id === editingStaffRole.id);
      if (updatedStaff) {
        const newRole = availableRoles.find((r) => r.id === roleId);
        if (newRole) {
          // Update the staff member's role in the local state
          setStaff((prev) =>
            prev.map((s) =>
              s.id === editingStaffRole.id
                ? {
                    ...s,
                    role: {
                      ...newRole,
                      isSystemRole: newRole.isSystemRole || false,
                    },
                    permissions: (newRole.permissions || []).map((p: any) => ({
                      id: p.id,
                      name: p.name,
                      display_name: p.displayName,
                      category: p.category,
                    })),
                  }
                : s
            )
          );
        }
      }

      // Use the assignRoleToUser API
      await apiClient.post(
        `/rbac/hostels/${hostelId}/users/${editingStaffRole.id}/assign-role`,
        {
          roleId: roleId,
        }
      );

      notification.success("Role updated successfully");

      // Close modal and refresh data
      setShowEditRoleModal(false);
      setEditingStaffRole(null);
      setEditingRolePermissions(new Set());
      setIsEditingPermissions(false);
      await fetchStaff(); // Refresh the staff list
    } catch (error: any) {
      console.error("Failed to update role:", error);
      notification.error(error.message || "Failed to update role");

      // Revert optimistic update on error
      await fetchStaff();
    } finally {
      setLoadingOperations((prev) => {
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
      notification.error("No hostel selected");
      return;
    }

    const operationId = `update-permissions-${editingStaffRole.role.id}`;
    setLoadingOperations((prev) => new Set(prev).add(operationId));

    try {
      const selectedPermissions = Array.from(editingRolePermissions);

      // Build optimistic permission objects for display
      const optimisticPerms = selectedPermissions.map((pid) => ({
        id: pid,
        name: pid,
        display_name: permissionDisplayNames[pid] || pid,
        category:
          Object.entries(PERMISSION_GROUPS).find(([_k, g]) =>
            g.permissions.includes(pid)
          )?.[0] || "general",
      }));

      // Optimistically update availableRoles and staff entries referencing this role
      setAvailableRoles((prev) =>
        prev.map((r) =>
          r.id === editingStaffRole.role!.id
            ? {
                ...r,
                permissions: optimisticPerms.map((p) => ({
                  id: p.id,
                  name: p.name,
                  displayName: p.display_name,
                  category: p.category,
                })),
              }
            : r
        )
      );

      setStaff((prev) =>
        prev.map((s) =>
          s.role?.id === editingStaffRole.role!.id
            ? {
                ...s,
                permissions: optimisticPerms,
              }
            : s
        )
      );

      // Fire request
      await apiClient.put(
        `/rbac/hostels/${hostelId}/roles/${editingStaffRole.role.id}`,
        { permissionIds: selectedPermissions }
      );
      notification.success("Role permissions updated successfully");

      // Reconcile with authoritative data
      const results = await Promise.all([
        fetchStaff(true),
        fetchAvailableRoles(true),
      ]);

      // Update the local state immediately with new permissions for better UX
      if (editingStaffRole) {
        const rolesAfterUpdate = results[1] || [];
        const updatedRole = rolesAfterUpdate.find(
          (r: any) => r.id === editingStaffRole.role?.id
        );

        if (updatedRole) {
          // Update the staff list with new permissions
          setStaff((prevStaff) =>
            prevStaff.map((staffMember) => {
              if (staffMember.role?.id === editingStaffRole.role?.id) {
                return {
                  ...staffMember,
                  permissions:
                    updatedRole.permissions?.map((p: any) => ({
                      id: p.id,
                      name: p.name,
                      display_name: p.displayName,
                      category: p.category,
                    })) || [],
                };
              }
              return staffMember;
            })
          );

          // Update the editing staff role with new permissions
          setEditingStaffRole((prev) =>
            prev
              ? {
                  ...prev,
                  role: {
                    ...updatedRole,
                    isSystemRole: updatedRole.isSystemRole || false,
                  },
                  permissions:
                    updatedRole.permissions?.map((p: any) => ({
                      id: p.id,
                      name: p.name,
                      display_name: p.displayName,
                      category: p.category,
                    })) || [],
                }
              : prev
          );
        }
      }

      notification.success(
        "Permissions updated and changes reflected in the system"
      );
      // Close and reset modal state after successful update
      setShowEditRoleModal(false);
      setEditingStaffRole(null);
      setEditingRolePermissions(new Set());
      setIsEditingPermissions(false);
    } catch (error: any) {
      console.error("Failed to update role permissions:", error);
      notification.error(error.message || "Failed to update role permissions");

      // Revert optimistic update on error
      await fetchStaff();
    } finally {
      setLoadingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  // Handle role selection change in the edit modal
  const handleRoleChangeForEdit = async (roleId: string) => {
    if (!roleId) return;
    const hostelId = getHostelIdSafe();
    if (!hostelId) return;

    // Try to find the role in the availableRoles cache
    let selectedRole = availableRoles.find((r) => r.id === roleId);
    if (!selectedRole) {
      // Refresh roles from server and try again
      await fetchAvailableRoles();
      selectedRole = availableRoles.find((r) => r.id === roleId);
    }

    if (selectedRole && editingStaffRole) {
      setEditingStaffRole((prev) =>
        prev
          ? {
              ...prev,
              role: {
                ...selectedRole,
                isSystemRole: selectedRole.isSystemRole || false,
              },
            }
          : prev
      );
      // Set editing permissions from the selected role
      const perms = new Set(
        (selectedRole.permissions || []).map((p: any) => p.name)
      );
      setEditingRolePermissions(perms);
      setIsEditingPermissions(!selectedRole.isSystemRole);
    }
  };

  // Delete a custom role
  const handleDeleteRole = async (roleId: string) => {
    if (!roleId) return;

    // Find the role to get its details
    const roleToDelete = availableRoles.find((r) => r.id === roleId);
    if (!roleToDelete) {
      notification.error("Role not found");
      return;
    }

    if (roleToDelete.isSystemRole) {
      notification.error("Cannot delete system roles");
      return;
    }

    // Get the number of users with this role
    const usersWithRole = staff.filter((s) => s.role.id === roleId).length;

    const confirmMessage =
      usersWithRole > 0
        ? `Are you sure you want to delete the "${roleToDelete.displayName}" role?\n\nThis will affect ${usersWithRole} staff member(s) who will need to be assigned new roles. They will temporarily lose access until reassigned.`
        : `Are you sure you want to delete the "${roleToDelete.displayName}" role?`;

    if (!confirm(confirmMessage)) return;

    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error("No hostel selected");
      return;
    }

    const operationId = `delete-role-${roleId}`;
    setLoadingOperations((prev) => new Set(prev).add(operationId));

    try {
      // Optimistic updates BEFORE network call
      // 1. Remove role from availableRoles immediately
      setAvailableRoles((prev) => prev.filter((r) => r.id !== roleId));
      // 2. Mark staff with that role as needing assignment
      const affectedStaffIds = staff
        .filter((s) => s.role?.id === roleId)
        .map((s) => s.id);
      setStaff((prev) =>
        prev.map((s) =>
          s.role?.id === roleId
            ? {
                ...s,
                role: {
                  id: "",
                  name: "",
                  displayName: "Assign a role",
                  isSystemRole: false,
                },
                permissions: [],
              }
            : s
        )
      );
      // 3. Update editing contexts
      if (editingStaffRole && editingStaffRole.role?.id === roleId) {
        setShowEditRoleModal(false);
        setEditingStaffRole(null);
        setEditingRolePermissions(new Set());
      }
      if (editingStaff && editingStaff.role?.id === roleId) {
        setEditingStaff((prev) =>
          prev
            ? {
                ...prev,
                role: {
                  id: "",
                  name: "",
                  displayName: "Assign a role",
                  isSystemRole: false,
                },
                permissions: [],
              }
            : prev
        );
      }

      // Perform API delete
      await apiClient.delete(`/rbac/hostels/${hostelId}/roles/${roleId}`);
      notification.success(
        `Role "${roleToDelete.displayName}" deleted successfully`
      );

      // Reconcile authoritative data
      const [,] = await Promise.all([
        fetchAvailableRoles(true),
        fetchStaff(true),
      ]);
      // (No extra diffing needed; optimistic state already matches expected)
    } catch (error: any) {
      console.error("Failed to delete role:", error);
      notification.error(error.message || "Failed to delete role");
      // Rollback optimistic changes on failure
      await fetchAvailableRoles(true);
      await fetchStaff(true);
    } finally {
      setLoadingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  // Fetch functions
  const fetchStaff = async (skipCache: boolean = false) => {
    try {
      const hostelId = getHostelIdSafe();
      if (!hostelId) return;

      if (skipCache && apiClient.invalidateCache) {
        apiClient.invalidateCache(`/hostels/${hostelId}/staff`);
      }

      const response = await apiClient.get(`/hostels/${hostelId}/staff`, {
        skipCache,
      });
      setStaff((response as any).data || []);
    } catch (error: any) {
      console.error("Failed to fetch staff:", error);
      setStaff([]);
    }
  };

  const fetchAvailableRoles = async (skipCache: boolean = false) => {
    try {
      const hostelId = getHostelIdSafe();
      if (!hostelId) return [];

      if (skipCache && apiClient.invalidateCache) {
        apiClient.invalidateCache("/rbac/system-roles");
        apiClient.invalidateCache(`/rbac/hostels/${hostelId}/roles`);
      }

      const [systemRolesResponse, customRolesResponse] = await Promise.all([
        apiClient.get("/rbac/system-roles", { skipCache }),
        apiClient.get(`/rbac/hostels/${hostelId}/roles`, { skipCache }),
      ]);

      const systemRoles = (systemRolesResponse as any).data || [];
      const customRoles = (customRolesResponse as any).data || [];

      const staffSystemRoles = systemRoles.filter(
        (role: any) => role.name === "warden" || role.name === "staff"
      );

      const allAvailableRoles = [
        ...staffSystemRoles.map((role: any) => ({
          id: role.id,
          name: role.name,
          displayName: role.displayName || role.display_name || role.name,
          description: role.description,
          isSystemRole: true,
          permissions: role.permissions || [],
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
            category: p.category,
          })),
        })),
      ];

      setAvailableRoles(allAvailableRoles);
      return allAvailableRoles;
    } catch (error: any) {
      console.error("Failed to fetch available roles:", error);
      setAvailableRoles([]);
    }
  };

  // Handler functions
  const handleCreateStaff = async (data: any) => {
    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error("No hostel selected");
      return;
    }

    const operationId = "create";
    setLoadingOperations((prev) => new Set(prev).add(operationId));

    try {
      // Backend requires a password; set default and enforce change on first login server-side
      const payload = { ...data, password: "123456" };
      // Optimistic placeholder (id will be replaced after refetch if needed)
      const tempId = `temp-${Date.now()}`;
      const roleMeta = availableRoles.find((r) => r.id === data.roleId);
      const optimisticStaff = {
        id: tempId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        isActive: true,
        role: roleMeta
          ? {
              id: roleMeta.id,
              name: roleMeta.name,
              displayName: roleMeta.displayName,
              isSystemRole: roleMeta.isSystemRole,
            }
          : {
              id: data.roleId,
              name: "",
              displayName: "Assigning...",
              isSystemRole: false,
            },
        permissions:
          roleMeta?.permissions?.map((p) => ({
            id: p.id,
            name: p.name,
            display_name: p.displayName,
            category: p.category,
          })) || [],
      } as any;
      setStaff((prev) => [optimisticStaff, ...prev]);

      await apiClient.post(`/hostels/${hostelId}/staff`, payload);
      notification.success("Staff member created successfully");
      setShowCreateForm(false);
      // Fresh reload to replace temp entry
      await fetchStaff(true);
    } catch (error: any) {
      console.error("Failed to create staff:", error);
      notification.error(error.message || "Failed to create staff member");
      // Rollback optimistic insert
      setStaff((prev) => prev.filter((s) => !String(s.id).startsWith("temp-")));
    } finally {
      setLoadingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  const handleUpdateStaff = async (staffId: string, data: any) => {
    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error("No hostel selected");
      return;
    }

    const operationId = `update-${staffId}`;
    setLoadingOperations((prev) => new Set(prev).add(operationId));

    try {
      await apiClient.put(`/hostels/${hostelId}/staff/${staffId}`, data);
      notification.success("Staff member updated successfully");

      // Update local state immediately
      setStaff((prevStaff) =>
        prevStaff.map((s) => {
          if (s.id !== staffId) return s;
          const roleMeta = data.roleId
            ? availableRoles.find((r) => r.id === data.roleId)
            : undefined;
          return {
            ...s,
            ...data,
            role: roleMeta
              ? {
                  id: roleMeta.id,
                  name: roleMeta.name,
                  displayName: roleMeta.displayName,
                  isSystemRole: roleMeta.isSystemRole,
                }
              : s.role,
            permissions: roleMeta
              ? roleMeta.permissions?.map((p) => ({
                  id: p.id,
                  name: p.name,
                  display_name: p.displayName,
                  category: p.category,
                }))
              : s.permissions,
          };
        })
      );

      // Close modals and reset state
      setShowCreateForm(false);
      setShowStaffEditModal(false);
      setEditingStaff(null);

      await fetchStaff(true); // Refresh to get latest data with skipCache
    } catch (error: any) {
      console.error("Failed to update staff:", error);
      notification.error(error.message || "Failed to update staff member");
    } finally {
      setLoadingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  // Handle role assignment
  const handleAssignRole = async (staffId: string, roleId: string) => {
    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error("No hostel selected");
      return;
    }

    const operationId = `assign-role-${staffId}`;
    setLoadingOperations((prev) => new Set(prev).add(operationId));

    try {
      await apiClient.post(
        `/rbac/hostels/${hostelId}/users/${staffId}/assign-role`,
        {
          roleId: roleId,
        }
      );

      notification.success("Role assigned successfully");

      // Find the assigned role details
      const assignedRole = availableRoles.find((role) => role.id === roleId);

      // Update local state immediately
      setStaff((prevStaff) =>
        prevStaff.map((staff) =>
          staff.id === staffId
            ? {
                ...staff,
                role: assignedRole
                  ? {
                      id: assignedRole.id,
                      name: assignedRole.name,
                      displayName: assignedRole.displayName,
                      isSystemRole: assignedRole.isSystemRole || false,
                    }
                  : staff.role,
                permissions:
                  assignedRole?.permissions?.map((p) => ({
                    id: p.id,
                    name: p.name,
                    display_name: p.displayName,
                    category: p.category,
                  })) || [],
              }
            : staff
        )
      );

      // Update editing staff if it's the same one
      if (editingStaff && editingStaff.id === staffId && assignedRole) {
        setEditingStaff((prev) =>
          prev
            ? {
                ...prev,
                role: {
                  id: assignedRole.id,
                  name: assignedRole.name,
                  displayName: assignedRole.displayName,
                  isSystemRole: assignedRole.isSystemRole || false,
                },
                permissions:
                  assignedRole.permissions?.map((p) => ({
                    id: p.id,
                    name: p.name,
                    display_name: p.displayName,
                    category: p.category,
                  })) || [],
              }
            : null
        );
      }

      // Optionally refresh in background without blocking UI for data authority
      fetchStaff(true);
    } catch (error: any) {
      console.error("Failed to assign role:", error);
      notification.error(error.message || "Failed to assign role");
    } finally {
      setLoadingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error("No hostel selected");
      return;
    }

    const operationId = `delete-${staffId}`;
    setLoadingOperations((prev) => new Set(prev).add(operationId));

    try {
      // Optimistic UI: remove immediately
      setStaff((prev) => prev.filter((s) => s.id !== staffId));
      await apiClient.delete(`/hostels/${hostelId}/staff/${staffId}`);
      notification.success("Staff member deleted successfully");
      await fetchStaff();
    } catch (error: any) {
      console.error("Failed to delete staff:", error);
      notification.error(error.message || "Failed to delete staff member");
    } finally {
      setLoadingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  const handleToggleStaffStatus = async (
    staffId: string,
    isActive: boolean
  ) => {
    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error("No hostel selected");
      return;
    }
    // Optimistic UI update
    const previousStaff = staff;
    setStaff((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, isActive } : s))
    );

    try {
      await apiClient.patch(`/hostels/${hostelId}/staff/${staffId}/status`, {
        isActive,
      });
      notification.success(
        `Staff member ${isActive ? "activated" : "deactivated"} successfully`
      );
      // Force fresh fetch to avoid stale cache resurrecting old value
      if (apiClient.invalidateCache) {
        apiClient.invalidateCache(`/hostels/${hostelId}/staff`);
      }
      await fetchStaff(/* skipCache */ true);
    } catch (error: any) {
      console.error("Failed to toggle staff status:", error);
      // Revert optimistic change
      setStaff(previousStaff);
      notification.error(error.message || "Failed to update staff status");
    }
  };

  const handleCreateRole = async (roleData: any) => {
    const hostelId = getHostelIdSafe();
    if (!hostelId) {
      notification.error("No hostel selected");
      return;
    }

    const operationId = `create-role-${Date.now()}`;
    setLoadingOperations((prev) => new Set(prev).add(operationId));

    try {
      const finalPermissions =
        updatePermissionsFromIndividual(selectedPermissions);

      const roleDataWithPermissions = {
        ...roleData,
        permissions: finalPermissions,
      };

      await apiClient.post(
        `/rbac/hostels/${hostelId}/roles`,
        roleDataWithPermissions
      );
      notification.success("Custom role created successfully");
      const wasCreatingStaff = showCreateForm;
      await fetchAvailableRoles(true);
      setShowCreateRoleForm(false);
      if (wasCreatingStaff) {
        // ensure select reflects new roles immediately
        setShowCreateForm(false);
        setTimeout(() => setShowCreateForm(true), 0);
      } else {
        setShowCreateForm(true);
      }
      setSelectedPermissions(new Set());
      setSelectedGroups(new Set());
      setExpandedCategories(new Set());
    } catch (error: any) {
      notification.error(error.message || "Failed to create custom role");
    } finally {
      setLoadingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(operationId);
        return newSet;
      });
    }
  };

  // Permission helper functions
  const updatePermissionsFromIndividual = (permissions: Set<string>) => {
    return Array.from(permissions);
  };

  const handleCategoryToggle = (groupKey: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const handleSelectAllInCategory = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey];
    if (!group) return;

    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      group.permissions.forEach((permission) => newSet.add(permission));
      return newSet;
    });
  };

  const handleDeselectAllInCategory = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey];
    if (!group) return;

    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      group.permissions.forEach((permission) => newSet.delete(permission));
      return newSet;
    });
  };

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permission)) {
        newSet.delete(permission);
      } else {
        newSet.add(permission);
      }
      return newSet;
    });
  };

  // Delete confirmation handlers
  const confirmDeleteStaff = async () => {
    if (staffToDelete) {
      await handleDeleteStaff(staffToDelete.id);
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
      setDeleteConfirmText("");
    }
  };

  // Edit modal specific handlers
  const handleEditPermissionToggle = (permission: string) => {
    setEditingRolePermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permission)) {
        newSet.delete(permission);
      } else {
        newSet.add(permission);
      }
      return newSet;
    });
  };

  const handleEditSelectAllInCategory = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey];
    if (!group) return;

    setEditingRolePermissions((prev) => {
      const newSet = new Set(prev);
      group.permissions.forEach((permission) => newSet.add(permission));
      return newSet;
    });
  };

  const handleEditDeselectAllInCategory = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey];
    if (!group) return;

    setEditingRolePermissions((prev) => {
      const newSet = new Set(prev);
      group.permissions.forEach((permission) => newSet.delete(permission));
      return newSet;
    });
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStaff(), fetchAvailableRoles()]);
      setLoading(false);
    };
    // Depend on hasHostel (stable boolean) so effect runs when hostel selection becomes available
    // Avoid including getHostelIdSafe or other functions that may change identity each render
    loadData();
  }, [hasHostel]);

  // Set permissions for the current role when edit modal opens
  useEffect(() => {
    if (showEditRoleModal && editingStaffRole && editingStaffRole.role) {
      // Get the full role information from available roles to ensure we have complete permission data
      const fullRole = availableRoles.find(
        (r) => r.id === editingStaffRole.role.id
      );
      if (fullRole) {
        const perms = new Set(
          (fullRole.permissions || []).map((p: any) => p.name || p.id)
        );
        setEditingRolePermissions(perms);
      } else {
        // Fallback to permissions from the staff member's role
        const perms = new Set(
          (editingStaffRole.role.permissions || []).map(
            (p: any) => p.name || p.id
          )
        );
        setEditingRolePermissions(perms);
      }
      setIsEditingPermissions(!editingStaffRole.role.isSystemRole);
    }
  }, [showEditRoleModal, editingStaffRole, availableRoles]);

  if (!canViewStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Access Denied
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view staff.
          </p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                Staff Management
              </h1>
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
                      if (!hostelId)
                        return notification.error("No hostel selected");
                      try {
                        const resp = await fetch(
                          `/api/hostels/${hostelId}/staff/export?format=csv`,
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem(
                                "authToken"
                              )}`,
                            },
                          }
                        );
                        if (!resp.ok) throw new Error("Failed");
                        const blob = await resp.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `staff-${hostelId}-${
                          new Date().toISOString().split("T")[0]
                        }.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        notification.success("Staff exported (CSV)");
                      } catch (e) {
                        console.error(e);
                        notification.error("Export failed");
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" /> CSV
                  </button>
                  <button
                    onClick={async () => {
                      const hostelId = getHostelIdSafe();
                      if (!hostelId)
                        return notification.error("No hostel selected");
                      try {
                        const resp = await fetch(
                          `/api/hostels/${hostelId}/staff/export?format=json`,
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem(
                                "authToken"
                              )}`,
                            },
                          }
                        );
                        if (!resp.ok) throw new Error("Failed");
                        const data = await resp.json();
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: "application/json",
                        });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `staff-${hostelId}-${
                          new Date().toISOString().split("T")[0]
                        }.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        notification.success("Staff exported (JSON)");
                      } catch (e) {
                        console.error(e);
                        notification.error("Export failed");
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" /> JSON
                  </button>
                </div>
              )}
              {canAssignRoles && (
                <button
                  onClick={() => setShowCreateRoleForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loadingOperations.size > 0}
                >
                  {loadingOperations.has("createRole") ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                  ) : (
                    <ShieldIcon className="h-4 w-4 mr-2" />
                  )}
                  Create Role
                </button>
              )}
              {(user?.permissions || []).includes("staff_create") && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={loadingOperations.size > 0}
                >
                  {loadingOperations.has("create") ? (
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
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Staff
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {staff.length}
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
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Staff
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {staff.filter((member) => member.isActive).length}
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
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Custom Roles
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {customRoles.length}
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
                    <SettingsIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        System Roles
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {
                          availableRoles.filter((role) => role.isSystemRole)
                            .length
                        }
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
              {staff.length} staff member{staff.length !== 1 ? "s" : ""}
            </p>
          </div>

          {staff.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No staff members
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {canManageStaff
                  ? "Get started by adding your first staff member."
                  : "No staff members have been added yet."}
              </p>
              <PermissionGate permission="staff_create">
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    disabled={loadingOperations.size > 0}
                  >
                    {loadingOperations.has("create") ? (
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
                    <PermissionGate
                      permissions={["staff_update", "role_assign"]}
                      requireAll={false}
                    >
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </PermissionGate>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...staff]
                    .sort((a, b) => {
                      const aUn = !a.role || !a.role.id ? 0 : 1;
                      const bUn = !b.role || !b.role.id ? 0 : 1;
                      if (aUn !== bUn) return aUn - bUn;
                      return a.name.localeCompare(b.name);
                    })
                    .map((member) => (
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
                              <div className="text-sm font-medium text-gray-900">
                                {member.name}
                              </div>
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
                            <span className="text-sm text-gray-900 flex items-center gap-2">
                              {!member.role || !member.role.id
                                ? "Assign a role"
                                : member.role.displayName || member.role.name}
                              {(!member.role || !member.role.id) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStaff(member as any);
                                    setShowStaffEditModal(true);
                                  }}
                                  className="text-xs px-2 py-0.5 rounded border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                                >
                                  Reassign
                                </button>
                              )}
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
                            {!member.role || !member.role.id ? (
                              <div className="text-sm text-amber-600">
                                No permissions (assign a role)
                              </div>
                            ) : (
                              <>
                                <div className="text-sm text-gray-900">
                                  {member.permissions?.length || 0} permission
                                  {(member.permissions?.length || 0) !== 1
                                    ? "s"
                                    : ""}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {member.permissions
                                    ?.slice(0, 2)
                                    .map(
                                      (p) =>
                                        permissionDisplayNames[p.name] ||
                                        p.display_name ||
                                        p.display_name ||
                                        p.name
                                    )
                                    .filter(Boolean)
                                    .join(", ") || "No permissions"}
                                  {(member.permissions?.length || 0) > 2 &&
                                    ` +${
                                      (member.permissions?.length || 0) - 2
                                    } more`}
                                </div>
                              </>
                            )}
                          </td>
                        </PermissionGate>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <PermissionGate
                          permissions={["staff_update", "role_assign"]}
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
                            <div
                              className="relative dropdown-container"
                              style={{
                                zIndex:
                                  openDropdown === member.id ? 9999 : "auto",
                              }}
                            >
                              <button
                                onClick={() =>
                                  setOpenDropdown(
                                    openDropdown === member.id
                                      ? null
                                      : member.id
                                  )
                                }
                                className="inline-flex items-center p-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-200 disabled:opacity-50"
                                disabled={
                                  loadingOperations.has(
                                    `update-${member.id}`
                                  ) ||
                                  loadingOperations.has(
                                    `delete-${member.id}`
                                  ) ||
                                  loadingOperations.has(`toggle-${member.id}`)
                                }
                              >
                                <MoreVerticalIcon className="w-4 h-4" />
                              </button>

                              {openDropdown === member.id && (
                                <>
                                  {/* Backdrop to ensure dropdown is visible */}
                                  <div
                                    className="fixed inset-0 z-[9998]"
                                    onClick={() => setOpenDropdown(null)}
                                  ></div>
                                  <div className="absolute right-0 z-[9999] mt-2 w-48 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 border border-gray-200">
                                    <div className="py-1" role="menu">
                                      <PermissionGate permission="staff_update">
                                        <button
                                          onClick={() => {
                                            setEditingStaff(member);
                                            setShowStaffEditModal(true);
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
                                          onClick={async () => {
                                            await fetchStaff();
                                            setTimeout(() => {
                                              const latestMember =
                                                staff.find(
                                                  (s) => s.id === member.id
                                                ) || member;
                                              setEditingStaffRole(latestMember);
                                              // Set permissions for the current role
                                              const perms = new Set(
                                                (
                                                  latestMember.role
                                                    ?.permissions || []
                                                ).map((p) => p.name)
                                              );
                                              setEditingRolePermissions(perms);
                                              setIsEditingPermissions(false);
                                              setModalMode("changeRole");
                                              setShowEditRoleModal(true);
                                              setOpenDropdown(null);
                                            }, 0);
                                          }}
                                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          role="menuitem"
                                        >
                                          <ShieldIcon className="w-4 h-4 mr-3" />
                                          Change Role
                                        </button>
                                      </PermissionGate>
                                      <PermissionGate permission="role_assign">
                                        <button
                                          onClick={async () => {
                                            await fetchStaff();
                                            setTimeout(() => {
                                              const latestMember =
                                                staff.find(
                                                  (s) => s.id === member.id
                                                ) || member;
                                              setEditingStaffRole(latestMember);

                                              // Get the full role information from available roles to ensure we have complete permission data
                                              const fullRole =
                                                availableRoles.find(
                                                  (r) =>
                                                    r.id ===
                                                    latestMember.role?.id
                                                );
                                              if (fullRole) {
                                                const perms = new Set(
                                                  (
                                                    fullRole.permissions || []
                                                  ).map((p) => p.name || p.id)
                                                );
                                                setEditingRolePermissions(
                                                  perms
                                                );
                                              } else {
                                                // Fallback to permissions from the staff member's role
                                                const perms = new Set(
                                                  (
                                                    latestMember.role
                                                      ?.permissions || []
                                                  ).map((p) => p.name || p.id)
                                                );
                                                setEditingRolePermissions(
                                                  perms
                                                );
                                              }

                                              setIsEditingPermissions(true);
                                              setModalMode("updatePermissions");
                                              setShowEditRoleModal(true);
                                              setOpenDropdown(null);
                                            }, 0);
                                          }}
                                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                          role="menuitem"
                                        >
                                          <SettingsIcon className="w-4 h-4 mr-3" />
                                          Update Permissions
                                        </button>
                                      </PermissionGate>
                                      <PermissionGate permission="role_assign">
                                        <button
                                          onClick={() => {
                                            if (!member.role.isSystemRole) {
                                              handleDeleteRole(member.role.id);
                                            }
                                            setOpenDropdown(null);
                                          }}
                                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                          role="menuitem"
                                          disabled={
                                            loadingOperations.has(
                                              `delete-role-${member.role.id}`
                                            ) || member.role.isSystemRole
                                          }
                                        >
                                          {loadingOperations.has(
                                            `delete-role-${member.role.id}`
                                          ) ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div>
                                          ) : (
                                            <TrashIcon className="w-4 h-4 mr-3" />
                                          )}
                                          {member.role.isSystemRole
                                            ? "Cannot Delete System Role"
                                            : "Delete Role"}
                                        </button>
                                      </PermissionGate>
                                      <PermissionGate permission="staff_update">
                                        <button
                                          onClick={() => {
                                            handleToggleStaffStatus(
                                              member.id,
                                              !member.isActive
                                            );
                                            setOpenDropdown(null);
                                          }}
                                          className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${
                                            member.isActive
                                              ? "text-red-600"
                                              : "text-green-600"
                                          }`}
                                          role="menuitem"
                                          disabled={loadingOperations.has(
                                            `toggle-${member.id}`
                                          )}
                                        >
                                          {loadingOperations.has(
                                            `toggle-${member.id}`
                                          ) ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3"></div>
                                          ) : (
                                            <SettingsIcon className="w-4 h-4 mr-3" />
                                          )}
                                          {member.isActive
                                            ? "Deactivate"
                                            : "Activate"}
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
                                          disabled={loadingOperations.has(
                                            `delete-${member.id}`
                                          )}
                                        >
                                          {loadingOperations.has(
                                            `delete-${member.id}`
                                          ) ? (
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
          <PermissionGate
            permissions={["staff_update", "role_assign"]}
            requireAll={false}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-10 mx-auto p-6 border w-full max-w-md shadow-xl rounded-lg bg-white">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">
                      {editingStaff
                        ? "Edit Staff Member"
                        : "Add New Staff Member"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingStaff(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {editingStaff
                      ? "Update staff member information"
                      : "Fill in the details to create a new staff account"}
                  </p>
                </div>

                {/* Hostel selector note for multi-hostel owners */}
                {!editingStaff && user?.role === "owner" && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-500 mt-0.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">
                          Hostel Assignment
                        </h4>
                        <p className="text-sm text-blue-800">
                          This staff member will be created for the currently
                          selected hostel.
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Switch hostels using the selector in the top
                          navigation if needed.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = {
                      name: formData.get("name") as string,
                      email: formData.get("email") as string,
                      phone: formData.get("phone") as string,
                      roleId: formData.get("roleId") as string,
                    };

                    if (editingStaff) {
                      handleUpdateStaff(editingStaff.id, data);
                    } else {
                      handleCreateStaff(data);
                    }
                  }}
                >
                  <div className="space-y-5"></div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingStaff?.name || ""}
                      placeholder="Enter staff member's full name"
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      The complete name as it should appear in the system
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingStaff?.email || ""}
                      placeholder="staff@hostel.com"
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Used for login and notifications
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingStaff?.phone || ""}
                      placeholder="+1 (555) 123-4567"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Optional contact number
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Staff Role <span className="text-red-500">*</span>
                    </label>
                    {canAssignRoles ? (
                      <select
                        name="roleId"
                        defaultValue={editingStaff?.role?.id || ""}
                        required
                        onChange={(e) => {
                          const selectedRoleId = e.target.value;
                          const selectedRole = availableRoles.find(
                            (r) => r.id === selectedRoleId
                          );
                          if (selectedRole && editingStaff) {
                            // Update editing staff with new role and permissions
                            setEditingStaff({
                              ...editingStaff,
                              role: {
                                id: selectedRole.id,
                                name: selectedRole.name,
                                displayName: selectedRole.displayName,
                                isSystemRole:
                                  selectedRole.isSystemRole || false,
                              },
                              // Convert permissions if available, or use empty array
                              permissions: selectedRole.permissions
                                ? selectedRole.permissions.map((p) => ({
                                    id: p.id,
                                    name: p.name,
                                    display_name: p.displayName || p.name,
                                    category: p.category,
                                  }))
                                : [],
                            });
                          }
                        }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors bg-white"
                      >
                        <option value="">
                          Choose a role for this staff member
                        </option>
                        {availableRoles
                          .filter((role) => role && role.id)
                          .map((role, index) => {
                            const human = (role.displayName || role.name || "")
                              .replace(/[-_]+/g, " ")
                              .replace(/\s+/g, " ")
                              .trim()
                              .replace(/\b\w/g, (c) => c.toUpperCase());
                            return (
                              <option
                                key={`${role.id}-${index}`}
                                value={role.id}
                              >
                                {human}{" "}
                                {role.isSystemRole ? "(System)" : "(Custom)"}
                              </option>
                            );
                          })}
                      </select>
                    ) : (
                      <div className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-600 sm:text-sm">
                        {editingStaff?.role?.displayName || "No role assigned"}
                        {editingStaff?.role?.isSystemRole
                          ? " (System)"
                          : editingStaff?.role
                          ? " (Custom)"
                          : ""}
                        <input
                          type="hidden"
                          name="roleId"
                          value={editingStaff?.role?.id || ""}
                        />
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {canAssignRoles
                        ? "Determines what permissions this staff member will have"
                        : "You don't have permission to change roles"}
                    </p>
                  </div>

                  {!editingStaff && (
                    <>
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-yellow-500 mt-0.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                              Default Login Credentials
                            </h4>
                            <p className="text-sm text-yellow-800">
                              Password will be set to <strong>123456</strong>{" "}
                              and the staff member will be required to change it
                              on first login.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                          type="submit"
                          className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          disabled={
                            editingStaff
                              ? loadingOperations.has(
                                  `update-${(editingStaff as StaffMember).id}`
                                )
                              : loadingOperations.has("create")
                          }
                        >
                          {loadingOperations.has(
                            editingStaff
                              ? `update-${(editingStaff as StaffMember).id}`
                              : "create"
                          ) ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {editingStaff ? "Updating..." : "Creating..."}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              {editingStaff ? (
                                <>
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  Update Staff
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
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
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Create a custom role with specific permissions for your
                    staff members
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    const roleName = formData.get("roleName") as string;

                    console.log("Form data:", { roleName, selectedGroups });

                    if (!roleName || roleName.trim() === "") {
                      notification.error("Role name is required");
                      return;
                    }

                    if (selectedPermissions.size === 0) {
                      notification.error(
                        "Please select at least one permission"
                      );

                      return;
                    }

                    // Generate internal name from role name (lowercase, replace spaces with underscores)
                    const internalName = roleName
                      .toLowerCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^a-z0-9_]/g, "");

                    // Get permission IDs from selected permissions
                    const finalPermissions =
                      updatePermissionsFromIndividual(selectedPermissions);

                    const roleData = {
                      name: internalName,
                      displayName: roleName.trim(),
                      description:
                        (formData.get("description") as string) || "",
                      permissions: finalPermissions,
                    };

                    console.log("Role data being sent:", roleData);
                    handleCreateRole(roleData);
                  }}
                >
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
                      <p className="mt-1 text-xs text-gray-500">
                        Name of the role that will be shown in the interface
                      </p>
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
                      <p className="mt-1 text-xs text-gray-500">
                        Optional description of the role's responsibilities
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Role Capabilities{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      {/* Global warning about high-privilege permissions */}
                      <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-yellow-500 mt-0.5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                              🔐 Permission Security Notice
                            </h4>
                            <div className="text-sm text-yellow-800 mt-1">
                              <p className="mb-2">
                                <strong>High-Risk Permissions</strong> marked
                                with{" "}
                                <span className="px-1.5 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                                  HIGH RISK
                                </span>{" "}
                                can permanently delete data or export sensitive
                                information.
                              </p>
                              <p className="text-xs">
                                Only grant these permissions to trusted staff
                                who understand the consequences. These
                                operations typically cannot be undone.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(PERMISSION_GROUPS).map(
                          ([groupKey, group]) => {
                            const isExpanded = expandedCategories.has(groupKey);
                            const selectedInGroup = group.permissions.filter(
                              (p) => selectedPermissions.has(p)
                            ).length;
                            const isFullySelected =
                              selectedInGroup === group.permissions.length;
                            const isPartiallySelected =
                              selectedInGroup > 0 &&
                              selectedInGroup < group.permissions.length;

                            return (
                              <div
                                key={groupKey}
                                className={`border rounded-lg transition-all ${
                                  isFullySelected || isPartiallySelected
                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                } ${group.required ? "opacity-75" : ""}`}
                              >
                                <div
                                  className="p-4 cursor-pointer"
                                  onClick={() => handleCategoryToggle(groupKey)}
                                >
                                  <div className="flex items-start space-x-3">
                                    <span className="text-2xl">
                                      {group.icon}
                                    </span>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <h4 className="font-medium text-gray-900">
                                            {group.title}
                                          </h4>
                                          {group.isHighPrivilege && (
                                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                              HIGH PRIVILEGE
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {selectedInGroup}/
                                            {group.permissions.length} selected
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={isFullySelected}
                                            ref={(input) => {
                                              if (input)
                                                input.indeterminate =
                                                  isPartiallySelected;
                                            }}
                                            disabled={group.required}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              if (isFullySelected) {
                                                handleDeselectAllInCategory(
                                                  groupKey
                                                );
                                              } else {
                                                handleSelectAllInCategory(
                                                  groupKey
                                                );
                                              }
                                            }}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          />
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {group.description}
                                      </p>

                                      {group.isHighPrivilege && (
                                        <p className="text-xs text-red-600 mt-1 font-medium">
                                          ⚠️ This includes permissions to
                                          create/delete hostels and manage
                                          critical system data. Use with extreme
                                          caution!
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
                                        const isSelected =
                                          selectedPermissions.has(permission);
                                        const isHighPrivilege =
                                          permission.includes("delete") ||
                                          permission === "data_export" ||
                                          permission === "hostel_create" ||
                                          permission === "permission_manage";
                                        const hasWarning =
                                          group.highPrivilegeWarning &&
                                          group.highPrivilegeWarning[
                                            permission
                                          ];

                                        return (
                                          <div
                                            key={permission}
                                            className="space-y-1"
                                          >
                                            <label
                                              className={`flex items-start space-x-2 p-3 rounded transition-colors cursor-pointer ${
                                                isHighPrivilege
                                                  ? "bg-red-50 border border-red-200 hover:bg-red-100"
                                                  : "hover:bg-white"
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() =>
                                                  handlePermissionToggle(
                                                    permission
                                                  )
                                                }
                                                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                              />
                                              <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-sm font-medium text-gray-900">
                                                    {permissionDisplayNames[
                                                      permission
                                                    ] || permission}
                                                  </span>
                                                  {isHighPrivilege && (
                                                    <span className="px-1.5 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                                                      HIGH RISK
                                                    </span>
                                                  )}
                                                </div>
                                                {hasWarning && (
                                                  <p className="text-xs text-red-600 mt-1 leading-relaxed">
                                                    ⚠️{" "}
                                                    {
                                                      group
                                                        .highPrivilegeWarning?.[
                                                        permission
                                                      ]
                                                    }
                                                  </p>
                                                )}
                                              </div>
                                            </label>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* High privilege warning for the group */}
                                    {group.permissions.some(
                                      (p) =>
                                        p.includes("delete") ||
                                        p === "data_export" ||
                                        p === "hostel_create"
                                    ) && (
                                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                          <div className="text-red-600 text-sm font-bold">
                                            ⚠️
                                          </div>
                                          <div className="text-sm text-red-800">
                                            <p className="font-semibold">
                                              High Privilege Operations
                                            </p>
                                            <p className="text-xs mt-1">
                                              This category contains permissions
                                              that can permanently delete data
                                              or export sensitive information.
                                              Only grant these to trusted staff
                                              members who understand the
                                              consequences.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Select/Deselect All buttons */}
                                    <div className="mt-3 flex space-x-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleSelectAllInCategory(groupKey)
                                        }
                                        className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                      >
                                        Select All
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeselectAllInCategory(groupKey)
                                        }
                                        className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                      >
                                        Deselect All
                                      </button>
                                      {group.permissions.some((p) =>
                                        p.includes("delete")
                                      ) && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            group.permissions.forEach((p) => {
                                              if (p.includes("delete")) {
                                                setSelectedPermissions(
                                                  (prev) => {
                                                    const newSet = new Set(
                                                      prev
                                                    );
                                                    newSet.delete(p);
                                                    return newSet;
                                                  }
                                                );
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
                          }
                        )}
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <div className="text-blue-600 text-sm">ℹ️</div>
                          <div className="text-sm text-blue-800">
                            <p className="font-medium">Permission Selection</p>
                            <p className="text-xs mt-1">
                              Click on any category to expand and select the
                              specific permissions you want to grant. All
                              necessary background permissions are automatically
                              included to ensure everything works properly.
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
                      disabled={
                        loadingOperations.has("create-role") ||
                        selectedPermissions.size === 0
                      }
                    >
                      {loadingOperations.has("create-role") ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
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

        {/* Role Edit Modal */}
        <RoleEditModal
          open={showEditRoleModal}
          onClose={() => {
            setShowEditRoleModal(false);
            setEditingStaffRole(null);
            setEditingRolePermissions(new Set());
            setIsEditingPermissions(false);
          }}
          editingStaffRole={editingStaffRole}
          availableRoles={availableRoles}
          loadingOperations={loadingOperations}
          editingRolePermissions={editingRolePermissions}
          isEditingPermissions={isEditingPermissions}
          modalMode={modalMode}
          onEditRoleSubmit={handleEditRoleSubmit}
          onUpdateRolePermissions={handleUpdateRolePermissions}
          onSetEditingRolePermissions={setEditingRolePermissions}
          permissionDisplayNames={permissionDisplayNames}
          onRoleChange={handleRoleChangeForEdit}
          onDeleteRole={handleDeleteRole}
          onToggleEditPermissions={() =>
            setIsEditingPermissions((prev) => !prev)
          }
          PERMISSION_GROUPS={PERMISSION_GROUPS}
          handleCategoryToggle={handleCategoryToggle}
          expandedCategories={expandedCategories}
          handleEditSelectAllInCategory={handleEditSelectAllInCategory}
          handleEditDeselectAllInCategory={handleEditDeselectAllInCategory}
          handleEditPermissionToggle={handleEditPermissionToggle}
        />

        {/* New Staff Information Edit Modal */}
        {editingStaff && (
          <StaffEditModal
            open={showStaffEditModal}
            onClose={() => {
              setShowStaffEditModal(false);
              setEditingStaff(null);
            }}
            editingStaff={editingStaff}
            availableRoles={availableRoles}
            loadingOperations={loadingOperations}
            onUpdateStaff={handleUpdateStaff}
            onAssignRole={handleAssignRole}
            permissionDisplayNames={permissionDisplayNames}
            hasPermission={(permission: string) =>
              hasPermission(permission as any)
            }
          />
        )}

        {/* Staff Create Modal */}
        <StaffCreateModal
          open={showCreateRoleForm}
          onClose={() => setShowCreateRoleForm(false)}
          onCreateRole={handleCreateRole}
          loading={loadingOperations.has("create-role")}
          selectedPermissions={selectedPermissions}
          setSelectedPermissions={setSelectedPermissions}
          expandedCategories={expandedCategories}
          setExpandedCategories={setExpandedCategories}
          permissionDisplayNames={permissionDisplayNames}
          PERMISSION_GROUPS={PERMISSION_GROUPS}
          updatePermissionsFromIndividual={updatePermissionsFromIndividual}
          handleCategoryToggle={handleCategoryToggle}
          handleSelectAllInCategory={handleSelectAllInCategory}
          handleDeselectAllInCategory={handleDeselectAllInCategory}
          handlePermissionToggle={handlePermissionToggle}
        />
      </div>
    </div>
  );
}

export default StaffManagement;
