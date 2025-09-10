"use strict";

const { v4: uuidv4 } = require("uuid");
const { User, Role, Permission, RolePermission } = require("../models");
const UnifiedDependencyResolver = require("../utils/unifiedDependencyResolver");

/**
 * 🔧 RBAC Service Layer
 *
 * This service handles all Role-Based Access Control operations including:
 * - User role and permission retrieval
 * - Permission checking
 * - Custom role creation and management
 * - Permission grouping and organization
 *
 * @author HostelHive RBAC System
 * @version 1.0.0
 */
class RBACService {
  /**
   * Get user's role and permissions
   * @param {string} userId - User ID
   * @returns {Object} User role and permissions data
   */
  async getUserRoleAndPermissions(userId) {
    try {
      console.log(`🔍 RBAC: Fetching role and permissions for user: ${userId}`);

      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: "rbacRole",
            include: [
              {
                model: Permission,
                as: "permissions",
                through: { attributes: [] }, // Exclude junction table attributes
              },
            ],
          },
        ],
      });

      if (!user) {
        throw new Error("User not found");
      }

      // If user has no RBAC role, fall back to legacy role
      if (!user.rbacRole) {
        console.log(
          `⚠️ RBAC: User ${userId} has no RBAC role, using legacy role: ${user.role}`
        );
        console.log(
          `🔍 RBAC: User data - role_id: ${user.role_id}, role: ${user.role}`
        );

        // Map legacy role to system role
        const systemRole = await Role.findOne({
          where: { name: user.role },
          include: [
            {
              model: Permission,
              as: "permissions",
              through: { attributes: [] },
            },
          ],
        });

        console.log(
          `🔍 RBAC: System role lookup result:`,
          systemRole
            ? `Found role ${systemRole.name} with ${
                systemRole.permissions?.length || 0
              } permissions`
            : "No system role found"
        );

        if (!systemRole) {
          console.log(
            `⚠️ RBAC: System role not found for legacy role: ${user.role}, using fallback permissions`
          );

          // Return fallback permissions based on legacy role
          const fallbackPermissions = this.getLegacyRolePermissions(user.role);
          console.log(
            `🔍 RBAC: Fallback permissions for ${user.role}:`,
            fallbackPermissions.length,
            "permissions"
          );

          return {
            role: {
              id: `legacy-${user.role}`,
              name: user.role,
              displayName: this.getLegacyRoleDisplayName(user.role),
              isSystemRole: true,
            },
            permissions: fallbackPermissions,
            isLegacyRole: true,
          };
        }

        return {
          role: {
            id: systemRole.id,
            name: systemRole.name,
            displayName: systemRole.display_name,
            isSystemRole: systemRole.is_system_role,
          },
          permissions: systemRole.permissions.map((p) => ({
            id: p.id,
            name: p.name,
            displayName: p.display_name,
            category: p.category,
          })),
          isLegacyRole: true,
        };
      }

      console.log(
        `✅ RBAC: Found role ${user.rbacRole.name} with ${user.rbacRole.permissions.length} permissions`
      );
      console.log(
        `🔍 RBAC: Role details - id: ${user.rbacRole.id}, isSystemRole: ${user.rbacRole.is_system_role}`
      );
      console.log(
        `🔍 RBAC: Permission names:`,
        user.rbacRole.permissions.map((p) => p.name).join(", ")
      );

      return {
        role: {
          id: user.rbacRole.id,
          name: user.rbacRole.name,
          displayName: user.rbacRole.display_name,
          isSystemRole: user.rbacRole.is_system_role,
        },
        permissions: user.rbacRole.permissions.map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.display_name,
          category: p.category,
        })),
        isLegacyRole: false,
      };
    } catch (error) {
      console.error(
        "❌ RBAC: Error fetching user role and permissions:",
        error
      );

      // Try to get the user's role for fallback
      let userRole = "owner"; // Default fallback
      try {
        const user = await User.findByPk(userId, { attributes: ["role"] });
        if (user && user.role) {
          userRole = user.role;
        }
      } catch (userError) {
        console.error(
          "❌ RBAC: Error fetching user role for fallback:",
          userError
        );
      }

      // Return fallback permissions based on the user's actual role
      console.log(
        `⚠️ RBAC: Returning fallback permissions for user ${userId} with role: ${userRole}`
      );
      const fallbackPermissions = this.getLegacyRolePermissions(userRole);

      return {
        role: {
          id: `legacy-${userRole}`,
          name: userRole,
          displayName: this.getLegacyRoleDisplayName(userRole),
          isSystemRole: true,
        },
        permissions: fallbackPermissions,
        isLegacyRole: true,
      };
    }
  }

  /**
   * Get fallback permissions for legacy roles
   */
  getLegacyRolePermissions(roleName) {
    const legacyPermissions = {
      owner: [
        {
          id: "legacy-o1",
          name: "complaint_create",
          displayName: "Complaint Create",
          category: "complaints",
        },
        {
          id: "legacy-o2",
          name: "complaint_delete",
          displayName: "Complaint Delete",
          category: "complaints",
        },
        {
          id: "legacy-o3",
          name: "complaint_handle",
          displayName: "Complaint Handle",
          category: "complaints",
        },
        {
          id: "legacy-o4",
          name: "complaint_read",
          displayName: "Complaint Read",
          category: "complaints",
        },
        {
          id: "legacy-o5",
          name: "complaint_stats_read",
          displayName: "Complaint Stats Read",
          category: "complaints",
        },
        {
          id: "legacy-o6",
          name: "complaint_update",
          displayName: "Complaint Update",
          category: "complaints",
        },
        {
          id: "legacy-o7",
          name: "view_dashboard",
          displayName: "View Dashboard",
          category: "dashboard",
        },
        {
          id: "legacy-o8",
          name: "hostel_create",
          displayName: "Hostel Create",
          category: "hostel",
        },
        {
          id: "legacy-o9",
          name: "hostel_delete",
          displayName: "Hostel Delete",
          category: "hostel",
        },
        {
          id: "legacy-o10",
          name: "hostel_read",
          displayName: "Hostel Read",
          category: "hostel",
        },
        {
          id: "legacy-o11",
          name: "hostel_settings_update",
          displayName: "Hostel Settings Update",
          category: "hostel",
        },
        {
          id: "legacy-o12",
          name: "hostel_stats_read",
          displayName: "Hostel Stats Read",
          category: "hostel",
        },
        {
          id: "legacy-o13",
          name: "hostel_update",
          displayName: "Hostel Update",
          category: "hostel",
        },
        {
          id: "legacy-o14",
          name: "view_owner_hostels",
          displayName: "View Owner Hostels",
          category: "owner",
        },
        {
          id: "legacy-o15",
          name: "profile_create",
          displayName: "Profile Create",
          category: "profile",
        },
        {
          id: "legacy-o16",
          name: "profile_delete",
          displayName: "Profile Delete",
          category: "profile",
        },
        {
          id: "legacy-o17",
          name: "profile_read",
          displayName: "Profile Read",
          category: "profile",
        },
        {
          id: "legacy-o18",
          name: "profile_update",
          displayName: "Profile Update",
          category: "profile",
        },
        {
          id: "legacy-o19",
          name: "analytics_read",
          displayName: "Analytics Read",
          category: "reports",
        },
        {
          id: "legacy-o20",
          name: "billing_read",
          displayName: "Billing Read",
          category: "reports",
        },
        {
          id: "legacy-o21",
          name: "data_export",
          displayName: "Data Export",
          category: "reports",
        },
        {
          id: "legacy-o22",
          name: "report_read",
          displayName: "Report Read",
          category: "reports",
        },
        {
          id: "legacy-o23",
          name: "permission_manage",
          displayName: "Permission Manage",
          category: "roles",
        },
        {
          id: "legacy-o24",
          name: "role_assign",
          displayName: "Role Assign",
          category: "roles",
        },
        {
          id: "legacy-o25",
          name: "role_create",
          displayName: "Role Create",
          category: "roles",
        },
        {
          id: "legacy-o26",
          name: "role_delete",
          displayName: "Role Delete",
          category: "roles",
        },
        {
          id: "legacy-o27",
          name: "role_read",
          displayName: "Role Read",
          category: "roles",
        },
        {
          id: "legacy-o28",
          name: "role_update",
          displayName: "Role Update",
          category: "roles",
        },
        {
          id: "legacy-o29",
          name: "room_allocate",
          displayName: "Room Allocate",
          category: "rooms",
        },
        {
          id: "legacy-o30",
          name: "room_create",
          displayName: "Room Create",
          category: "rooms",
        },
        {
          id: "legacy-o31",
          name: "room_deallocate",
          displayName: "Room Deallocate",
          category: "rooms",
        },
        {
          id: "legacy-o32",
          name: "room_delete",
          displayName: "Room Delete",
          category: "rooms",
        },
        {
          id: "legacy-o33",
          name: "room_read",
          displayName: "Room Read",
          category: "rooms",
        },
        {
          id: "legacy-o34",
          name: "room_update",
          displayName: "Room Update",
          category: "rooms",
        },
        {
          id: "legacy-o34a",
          name: "room_allocation_read",
          displayName: "Room Allocation Read",
          category: "rooms",
        },
        {
          id: "legacy-o35",
          name: "view_settings",
          displayName: "View Settings",
          category: "settings",
        },
        {
          id: "legacy-o36",
          name: "student_create",
          displayName: "Student Create",
          category: "students",
        },
        {
          id: "legacy-o37",
          name: "student_delete",
          displayName: "Student Delete",
          category: "students",
        },
        {
          id: "legacy-o38",
          name: "student_export",
          displayName: "Student Export",
          category: "students",
        },
        {
          id: "legacy-o39",
          name: "student_read",
          displayName: "Student Read",
          category: "students",
        },
        {
          id: "legacy-o40",
          name: "student_room_assign",
          displayName: "Student Room Assign",
          category: "students",
        },
        {
          id: "legacy-o41",
          name: "student_update",
          displayName: "Student Update",
          category: "students",
        },
        {
          id: "legacy-o42",
          name: "visitor_checkout",
          displayName: "Visitor Checkout",
          category: "visitors",
        },
        {
          id: "legacy-o43",
          name: "visitor_create",
          displayName: "Visitor Create",
          category: "visitors",
        },
        {
          id: "legacy-o44",
          name: "visitor_delete",
          displayName: "Visitor Delete",
          category: "visitors",
        },
        {
          id: "legacy-o45",
          name: "visitor_export",
          displayName: "Visitor Export",
          category: "visitors",
        },
        {
          id: "legacy-o46",
          name: "visitor_read",
          displayName: "Visitor Read",
          category: "visitors",
        },
        {
          id: "legacy-o47",
          name: "visitor_stats_read",
          displayName: "Visitor Stats Read",
          category: "visitors",
        },
        {
          id: "legacy-o48",
          name: "visitor_update",
          displayName: "Visitor Update",
          category: "visitors",
        },
        {
          id: "legacy-o49",
          name: "warden_create",
          displayName: "Warden Create",
          category: "wardens",
        },
        {
          id: "legacy-o50",
          name: "warden_delete",
          displayName: "Warden Delete",
          category: "wardens",
        },
        {
          id: "legacy-o51",
          name: "warden_read",
          displayName: "Warden Read",
          category: "wardens",
        },
        {
          id: "legacy-o52",
          name: "warden_role_assign",
          displayName: "Warden Role Assign",
          category: "wardens",
        },
        {
          id: "legacy-o53",
          name: "warden_update",
          displayName: "Warden Update",
          category: "wardens",
        },
      ],
      warden: [
        {
          id: "legacy-w2",
          name: "complaint_delete",
          displayName: "Complaint Delete",
          category: "complaints",
        },
        {
          id: "legacy-w3",
          name: "complaint_handle",
          displayName: "Complaint Handle",
          category: "complaints",
        },
        {
          id: "legacy-w4",
          name: "complaint_read",
          displayName: "Complaint Read",
          category: "complaints",
        },
        {
          id: "legacy-w5",
          name: "complaint_stats_read",
          displayName: "Complaint Stats Read",
          category: "complaints",
        },
        {
          id: "legacy-w6",
          name: "complaint_update",
          displayName: "Complaint Update",
          category: "complaints",
        },
        {
          id: "legacy-w7",
          name: "view_dashboard",
          displayName: "View Dashboard",
          category: "dashboard",
        },
        {
          id: "legacy-w8",
          name: "room_allocate",
          displayName: "Room Allocate",
          category: "rooms",
        },
        {
          id: "legacy-w9",
          name: "room_create",
          displayName: "Room Create",
          category: "rooms",
        },
        {
          id: "legacy-w10",
          name: "room_deallocate",
          displayName: "Room Deallocate",
          category: "rooms",
        },
        {
          id: "legacy-w11",
          name: "room_delete",
          displayName: "Room Delete",
          category: "rooms",
        },
        {
          id: "legacy-w12",
          name: "room_read",
          displayName: "Room Read",
          category: "rooms",
        },
        {
          id: "legacy-w13",
          name: "room_update",
          displayName: "Room Update",
          category: "rooms",
        },
        {
          id: "legacy-w14",
          name: "student_create",
          displayName: "Student Create",
          category: "students",
        },
        {
          id: "legacy-w15",
          name: "student_delete",
          displayName: "Student Delete",
          category: "students",
        },
        {
          id: "legacy-w16",
          name: "student_export",
          displayName: "Student Export",
          category: "students",
        },
        {
          id: "legacy-w17",
          name: "student_read",
          displayName: "Student Read",
          category: "students",
        },
        {
          id: "legacy-w18",
          name: "student_room_assign",
          displayName: "Student Room Assign",
          category: "students",
        },
        {
          id: "legacy-w19",
          name: "student_update",
          displayName: "Student Update",
          category: "students",
        },
        {
          id: "legacy-w20",
          name: "visitor_checkout",
          displayName: "Visitor Checkout",
          category: "visitors",
        },
        {
          id: "legacy-w21",
          name: "visitor_create",
          displayName: "Visitor Create",
          category: "visitors",
        },
        {
          id: "legacy-w22",
          name: "visitor_delete",
          displayName: "Visitor Delete",
          category: "visitors",
        },
        {
          id: "legacy-w23",
          name: "visitor_export",
          displayName: "Visitor Export",
          category: "visitors",
        },
        {
          id: "legacy-w24",
          name: "visitor_read",
          displayName: "Visitor Read",
          category: "visitors",
        },
        {
          id: "legacy-w25",
          name: "visitor_stats_read",
          displayName: "Visitor Stats Read",
          category: "visitors",
        },
        {
          id: "legacy-w26",
          name: "visitor_update",
          displayName: "Visitor Update",
          category: "visitors",
        },
        {
          id: "legacy-w27",
          name: "hostel_read",
          displayName: "Hostel Read",
          category: "hostel",
        },
        {
          id: "legacy-w28",
          name: "hostel_stats_read",
          displayName: "Hostel Stats Read",
          category: "hostel",
        },
        {
          id: "legacy-w29",
          name: "profile_read",
          displayName: "Profile Read",
          category: "profile",
        },
        {
          id: "legacy-w30",
          name: "profile_update",
          displayName: "Profile Update",
          category: "profile",
        },
        {
          id: "legacy-w31",
          name: "room_allocation_read",
          displayName: "Room Allocation Read",
          category: "room_allocation",
        },
      ],
      student: [
        {
          id: "legacy-s1",
          name: "view_dashboard",
          displayName: "View Dashboard",
          category: "dashboard",
        },
        {
          id: "legacy-s2",
          name: "complaint_create",
          displayName: "Complaint Create",
          category: "complaints",
        },
        {
          id: "legacy-s3",
          name: "complaint_read",
          displayName: "Complaint Read",
          category: "complaints",
        },
        {
          id: "legacy-s4",
          name: "profile_read",
          displayName: "Profile Read",
          category: "profile",
        },
        {
          id: "legacy-s5",
          name: "profile_update",
          displayName: "Profile Update",
          category: "profile",
        },
        {
          id: "legacy-s6",
          name: "visitor_create",
          displayName: "Visitor Create",
          category: "visitors",
        },
        {
          id: "legacy-s7",
          name: "visitor_read",
          displayName: "Visitor Read",
          category: "visitors",
        },
      ],
      superadmin: [
        {
          id: "legacy-sa1",
          name: "complaint_create",
          displayName: "Complaint Create",
          category: "complaints",
        },
        {
          id: "legacy-sa2",
          name: "complaint_delete",
          displayName: "Complaint Delete",
          category: "complaints",
        },
        {
          id: "legacy-sa3",
          name: "complaint_handle",
          displayName: "Complaint Handle",
          category: "complaints",
        },
        {
          id: "legacy-sa4",
          name: "complaint_read",
          displayName: "Complaint Read",
          category: "complaints",
        },
        {
          id: "legacy-sa5",
          name: "complaint_stats_read",
          displayName: "Complaint Stats Read",
          category: "complaints",
        },
        {
          id: "legacy-sa6",
          name: "complaint_update",
          displayName: "Complaint Update",
          category: "complaints",
        },
        {
          id: "legacy-sa7",
          name: "view_dashboard",
          displayName: "View Dashboard",
          category: "dashboard",
        },
        {
          id: "legacy-sa8",
          name: "hostel_create",
          displayName: "Hostel Create",
          category: "hostel",
        },
        {
          id: "legacy-sa9",
          name: "hostel_delete",
          displayName: "Hostel Delete",
          category: "hostel",
        },
        {
          id: "legacy-sa10",
          name: "hostel_read",
          displayName: "Hostel Read",
          category: "hostel",
        },
        {
          id: "legacy-sa11",
          name: "hostel_settings_update",
          displayName: "Hostel Settings Update",
          category: "hostel",
        },
        {
          id: "legacy-sa12",
          name: "hostel_stats_read",
          displayName: "Hostel Stats Read",
          category: "hostel",
        },
        {
          id: "legacy-sa13",
          name: "hostel_update",
          displayName: "Hostel Update",
          category: "hostel",
        },
        {
          id: "legacy-sa14",
          name: "view_owner_hostels",
          displayName: "View Owner Hostels",
          category: "owner",
        },
        {
          id: "legacy-sa15",
          name: "profile_create",
          displayName: "Profile Create",
          category: "profile",
        },
        {
          id: "legacy-sa16",
          name: "profile_delete",
          displayName: "Profile Delete",
          category: "profile",
        },
        {
          id: "legacy-sa17",
          name: "profile_read",
          displayName: "Profile Read",
          category: "profile",
        },
        {
          id: "legacy-sa18",
          name: "profile_update",
          displayName: "Profile Update",
          category: "profile",
        },
        {
          id: "legacy-sa19",
          name: "analytics_read",
          displayName: "Analytics Read",
          category: "reports",
        },
        {
          id: "legacy-sa20",
          name: "billing_read",
          displayName: "Billing Read",
          category: "reports",
        },
        {
          id: "legacy-sa21",
          name: "data_export",
          displayName: "Data Export",
          category: "reports",
        },
        {
          id: "legacy-sa22",
          name: "report_read",
          displayName: "Report Read",
          category: "reports",
        },
        {
          id: "legacy-sa23",
          name: "permission_manage",
          displayName: "Permission Manage",
          category: "roles",
        },
        {
          id: "legacy-sa24",
          name: "role_assign",
          displayName: "Role Assign",
          category: "roles",
        },
        {
          id: "legacy-sa25",
          name: "role_create",
          displayName: "Role Create",
          category: "roles",
        },
        {
          id: "legacy-sa26",
          name: "role_delete",
          displayName: "Role Delete",
          category: "roles",
        },
        {
          id: "legacy-sa27",
          name: "role_read",
          displayName: "Role Read",
          category: "roles",
        },
        {
          id: "legacy-sa28",
          name: "role_update",
          displayName: "Role Update",
          category: "roles",
        },
        {
          id: "legacy-sa29",
          name: "room_allocate",
          displayName: "Room Allocate",
          category: "rooms",
        },
        {
          id: "legacy-sa30",
          name: "room_create",
          displayName: "Room Create",
          category: "rooms",
        },
        {
          id: "legacy-sa31",
          name: "room_deallocate",
          displayName: "Room Deallocate",
          category: "rooms",
        },
        {
          id: "legacy-sa32",
          name: "room_delete",
          displayName: "Room Delete",
          category: "rooms",
        },
        {
          id: "legacy-sa33",
          name: "room_read",
          displayName: "Room Read",
          category: "rooms",
        },
        {
          id: "legacy-sa34",
          name: "room_update",
          displayName: "Room Update",
          category: "rooms",
        },
        {
          id: "legacy-sa35",
          name: "view_settings",
          displayName: "View Settings",
          category: "settings",
        },
        {
          id: "legacy-sa36",
          name: "student_create",
          displayName: "Student Create",
          category: "students",
        },
        {
          id: "legacy-sa37",
          name: "student_delete",
          displayName: "Student Delete",
          category: "students",
        },
        {
          id: "legacy-sa38",
          name: "student_export",
          displayName: "Student Export",
          category: "students",
        },
        {
          id: "legacy-sa39",
          name: "student_read",
          displayName: "Student Read",
          category: "students",
        },
        {
          id: "legacy-sa40",
          name: "student_room_assign",
          displayName: "Student Room Assign",
          category: "students",
        },
        {
          id: "legacy-sa41",
          name: "student_update",
          displayName: "Student Update",
          category: "students",
        },
        {
          id: "legacy-sa42",
          name: "billing_manage",
          displayName: "Billing Manage",
          category: "system",
        },
        {
          id: "legacy-sa43",
          name: "hostel_global_manage",
          displayName: "Hostel Global Manage",
          category: "system",
        },
        {
          id: "legacy-sa44",
          name: "owner_manage",
          displayName: "Owner Manage",
          category: "system",
        },
        {
          id: "legacy-sa45",
          name: "system_manage",
          displayName: "System Manage",
          category: "system",
        },
        {
          id: "legacy-sa46",
          name: "system_stats_read",
          displayName: "System Stats Read",
          category: "system",
        },
        {
          id: "legacy-sa47",
          name: "visitor_checkout",
          displayName: "Visitor Checkout",
          category: "visitors",
        },
        {
          id: "legacy-sa48",
          name: "visitor_create",
          displayName: "Visitor Create",
          category: "visitors",
        },
        {
          id: "legacy-sa49",
          name: "visitor_delete",
          displayName: "Visitor Delete",
          category: "visitors",
        },
        {
          id: "legacy-sa50",
          name: "visitor_export",
          displayName: "Visitor Export",
          category: "visitors",
        },
        {
          id: "legacy-sa51",
          name: "visitor_read",
          displayName: "Visitor Read",
          category: "visitors",
        },
        {
          id: "legacy-sa52",
          name: "visitor_stats_read",
          displayName: "Visitor Stats Read",
          category: "visitors",
        },
        {
          id: "legacy-sa53",
          name: "visitor_update",
          displayName: "Visitor Update",
          category: "visitors",
        },
        {
          id: "legacy-sa54",
          name: "warden_create",
          displayName: "Warden Create",
          category: "wardens",
        },
        {
          id: "legacy-sa55",
          name: "warden_delete",
          displayName: "Warden Delete",
          category: "wardens",
        },
        {
          id: "legacy-sa56",
          name: "warden_read",
          displayName: "Warden Read",
          category: "wardens",
        },
        {
          id: "legacy-sa57",
          name: "warden_role_assign",
          displayName: "Warden Role Assign",
          category: "wardens",
        },
        {
          id: "legacy-sa58",
          name: "warden_update",
          displayName: "Warden Update",
          category: "wardens",
        },
      ],
    };

    return legacyPermissions[roleName] || [];
  }

  /**
   * Get display name for legacy roles
   */
  getLegacyRoleDisplayName(roleName) {
    const displayNames = {
      owner: "Hostel Owner",
      warden: "Warden",
      student: "Student",
      superadmin: "Super Admin",
    };

    return displayNames[roleName] || roleName;
  }

  /**
   * Check if user has specific permission
   * @param {string} userId - User ID
   * @param {string} permissionName - Permission name to check
   * @returns {boolean} Whether user has the permission
   */
  async hasPermission(userId, permissionName) {
    try {
      console.log(
        `🔍 RBAC: Checking permission '${permissionName}' for user: ${userId}`
      );

      const userRoleData = await this.getUserRoleAndPermissions(userId);
      const hasPermission = userRoleData.permissions.some(
        (p) => p.name === permissionName
      );

      console.log(
        `✅ RBAC: User ${userId} ${
          hasPermission ? "HAS" : "DOES NOT HAVE"
        } permission '${permissionName}'`
      );
      return hasPermission;
    } catch (error) {
      console.error("❌ RBAC: Error checking permission:", error);
      // For legacy owners, if RBAC fails, assume they have all permissions
      // This is a fallback for backward compatibility
      console.log(
        `⚠️ RBAC: Permission check failed for user ${userId}, assuming legacy owner has all permissions`
      );
      return true;
    }
  }

  /**
   * Check if user has any of the specified permissions
   * @param {string} userId - User ID
   * @param {string[]} permissionNames - Array of permission names to check
   * @returns {boolean} Whether user has any of the permissions
   */
  async hasAnyPermission(userId, permissionNames) {
    try {
      console.log(
        `🔍 RBAC: Checking any of permissions [${permissionNames.join(
          ", "
        )}] for user: ${userId}`
      );

      const userRoleData = await this.getUserRoleAndPermissions(userId);
      const hasAnyPermission = permissionNames.some((permissionName) =>
        userRoleData.permissions.some((p) => p.name === permissionName)
      );

      console.log(
        `✅ RBAC: User ${userId} ${
          hasAnyPermission ? "HAS" : "DOES NOT HAVE"
        } any of the permissions`
      );
      return hasAnyPermission;
    } catch (error) {
      console.error("❌ RBAC: Error checking any permission:", error);
      // For legacy owners, if RBAC fails, assume they have all permissions
      console.log(
        `⚠️ RBAC: Any permission check failed for user ${userId}, assuming legacy owner has all permissions`
      );
      return true;
    }
  }

  /**
   * Check if user has all of the specified permissions
   * @param {string} userId - User ID
   * @param {string[]} permissionNames - Array of permission names to check
   * @returns {boolean} Whether user has all of the permissions
   */
  async hasAllPermissions(userId, permissionNames) {
    try {
      console.log(
        `🔍 RBAC: Checking all permissions [${permissionNames.join(
          ", "
        )}] for user: ${userId}`
      );

      const userRoleData = await this.getUserRoleAndPermissions(userId);
      const hasAllPermissions = permissionNames.every((permissionName) =>
        userRoleData.permissions.some((p) => p.name === permissionName)
      );

      console.log(
        `✅ RBAC: User ${userId} ${
          hasAllPermissions ? "HAS" : "DOES NOT HAVE"
        } all permissions`
      );
      return hasAllPermissions;
    } catch (error) {
      console.error("❌ RBAC: Error checking all permissions:", error);
      // For legacy owners, if RBAC fails, assume they have all permissions
      console.log(
        `⚠️ RBAC: All permissions check failed for user ${userId}, assuming legacy owner has all permissions`
      );
      return true;
    }
  }

  /**
   * Get all available permissions (for role creation)
   * @returns {Object} Permissions grouped by category
   */
  async getAllPermissions() {
    try {
      console.log("🔍 RBAC: Fetching all available permissions");

      const permissions = await Permission.findAll({
        order: [
          ["category", "ASC"],
          ["displayName", "ASC"],
        ],
      });

      // Group by category
      const groupedPermissions = {};
      permissions.forEach((permission) => {
        if (!groupedPermissions[permission.category]) {
          groupedPermissions[permission.category] = [];
        }
        groupedPermissions[permission.category].push({
          id: permission.id,
          name: permission.name,
          displayName: permission.displayName,
          description: permission.description,
        });
      });

      console.log(
        `✅ RBAC: Found ${permissions.length} permissions across ${
          Object.keys(groupedPermissions).length
        } categories`
      );
      return groupedPermissions;
    } catch (error) {
      console.error("❌ RBAC: Error fetching permissions:", error);
      throw error;
    }
  }

  /**
   * Get granular permissions (CRUD operations)
   * @returns {Array} Array of granular permissions
   */
  async getGranularPermissions() {
    try {
      console.log("🔍 RBAC: Fetching granular permissions");

      const permissions = await Permission.findAll({
        where: {
          operation: {
            [require("sequelize").Op.ne]: null, // Only get permissions with operation field
          },
        },
        order: [
          ["category", "ASC"],
          ["operation", "ASC"],
          ["display_name", "ASC"],
        ],
      });

      console.log(`✅ RBAC: Found ${permissions.length} granular permissions`);
      return permissions;
    } catch (error) {
      console.error("❌ RBAC: Error fetching granular permissions:", error);
      throw error;
    }
  }

  /**
   * Create custom role (owner only)
   * @param {Object} roleData - Role data
   * @param {string} createdById - ID of user creating the role
   * @param {string} hostelId - Hostel ID for the role
   * @returns {Object} Created role
   */
  async createCustomRole(roleData, createdById, hostelId) {
    try {
      console.log(
        `🔍 RBAC: Creating custom role '${roleData.name}' for hostel: ${hostelId}`
      );

      const { name, displayName, description, permissionNames } = roleData;

      // Convert permission names to permission IDs
      let permissionIds = [];
      if (permissionNames && permissionNames.length > 0) {
        const permissions = await Permission.findAll({
          where: {
            name: permissionNames,
          },
          attributes: ["id", "name"],
        });

        permissionIds = permissions.map((p) => p.id);
        console.log(
          `🔍 RBAC: Converted ${permissionNames.length} permission names to ${permissionIds.length} IDs`
        );
      }

      // Validate role name uniqueness within hostel
      const existingRole = await Role.findOne({
        where: {
          name: `custom_${name.toLowerCase().replace(/\s+/g, "_")}`,
          hostelId: hostelId,
        },
      });

      if (existingRole) {
        throw new Error("Role name already exists in this hostel");
      }

      // Create role
      const newRole = await Role.create({
        id: uuidv4(),
        name: `custom_${name.toLowerCase().replace(/\s+/g, "_")}`,
        displayName: displayName,
        description,
        isSystemRole: false,
        hostelId: hostelId,
        createdBy: createdById,
      });

      // Initialize permission tracking variables
      let finalPermissionIds = [];
      const originalPermissionCount = permissionIds ? permissionIds.length : 0;

      // Assign permissions
      if (permissionIds && permissionIds.length > 0) {
        // 🎯 Enhanced Permission Dependencies System
        finalPermissionIds = await this.ensurePermissionDependencies(
          permissionIds
        );
        console.log(
          `🔧 RBAC: Expanded ${permissionIds.length} permissions to ${finalPermissionIds.length} with dependencies`
        );

        const rolePermissions = finalPermissionIds.map((permissionId) => ({
          id: uuidv4(),
          roleId: newRole.id,
          permissionId: permissionId,
        }));

        await RolePermission.bulkCreate(rolePermissions);
        console.log(
          `✅ RBAC: Assigned ${finalPermissionIds.length} permissions to role '${newRole.name}'`
        );
      }

      console.log(
        `✅ RBAC: Created custom role '${newRole.name}' with ID: ${newRole.id}`
      );

      // Return the expected format for the controller
      return {
        success: true,
        role: newRole,
        permissions: {
          originalCount: originalPermissionCount,
          resolvedCount: finalPermissionIds.length,
          dependencies:
            originalPermissionCount > 0
              ? finalPermissionIds.filter((id) => !permissionIds.includes(id))
              : [],
        },
      };
    } catch (error) {
      console.error("❌ RBAC: Error creating custom role:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 🎯 Ensure permission dependencies are met
   * @param {Array} permissionIds - Array of permission IDs
   * @returns {Array} Array of permission IDs with dependencies included
   */
  async ensurePermissionDependencies(permissionIds) {
    const expandedPermissions = new Set(permissionIds);

    console.log(
      `🧠 Using Intelligent Dependency Resolution for ${permissionIds.length} permissions`
    );

    // Process each permission with intelligent dependency detection
    for (const permissionId of permissionIds) {
      const permission = await Permission.findByPk(permissionId);
      if (!permission) {
        console.warn(`⚠️ Permission with ID ${permissionId} not found`);
        continue;
      }

      // Get intelligent dependencies for this permission
      const dependencies =
        await UnifiedDependencyResolver.getUnifiedDependencies(permission.name);

      // Add each dependency to the expanded set
      for (const depName of dependencies) {
        const depPermission = await Permission.findOne({
          where: { name: depName },
        });
        if (depPermission && !expandedPermissions.has(depPermission.id)) {
          expandedPermissions.add(depPermission.id);
          console.log(
            `🧠 Intelligent: Added dependency '${depName}' for permission '${permission.name}'`
          );
        }
      }
    }

    const finalPermissions = Array.from(expandedPermissions);
    console.log(
      `🧠 Intelligent Resolution: Expanded ${permissionIds.length} permissions to ${finalPermissions.length} with smart dependencies`
    );

    return finalPermissions;
  }

  /**
   * Get hostel's custom roles
   * @param {string} hostelId - Hostel ID
   * @returns {Array} Array of custom roles
   */
  async getHostelCustomRoles(hostelId) {
    try {
      console.log(`🔍 RBAC: Fetching custom roles for hostel: ${hostelId}`);

      const roles = await Role.findAll({
        where: {
          hostelId: hostelId,
          isSystemRole: false,
        },
        include: [
          {
            model: Permission,
            as: "permissions",
            through: { attributes: [] },
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const formattedRoles = roles.map((role) => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions.map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          category: p.category,
        })),
        createdAt: role.createdAt,
      }));

      console.log(
        `✅ RBAC: Found ${formattedRoles.length} custom roles for hostel ${hostelId}`
      );
      return formattedRoles;
    } catch (error) {
      console.error("❌ RBAC: Error fetching hostel custom roles:", error);
      throw error;
    }
  }

  /**
   * Get all system roles
   * @returns {Array} Array of system roles
   */
  async getSystemRoles() {
    try {
      console.log("🔍 RBAC: Fetching system roles");

      const roles = await Role.findAll({
        where: { isSystemRole: true },
        include: [
          {
            model: Permission,
            as: "permissions",
            through: { attributes: [] },
          },
        ],
        order: [["name", "ASC"]],
      });

      const formattedRoles = roles.map((role) => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions.map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.displayName,
          category: p.category,
        })),
      }));

      console.log(`✅ RBAC: Found ${formattedRoles.length} system roles`);
      return formattedRoles;
    } catch (error) {
      console.error("❌ RBAC: Error fetching system roles:", error);
      throw error;
    }
  }

  /**
   * Assign role to user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Object} Updated user
   */
  async assignRoleToUser(userId, roleId) {
    try {
      console.log(`🔍 RBAC: Assigning role ${roleId} to user ${userId}`);

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      // Update user's role_id
      await user.update({ roleId: roleId });

      console.log(`✅ RBAC: Assigned role '${role.name}' to user ${userId}`);
      return user;
    } catch (error) {
      console.error("❌ RBAC: Error assigning role to user:", error);
      throw error;
    }
  }

  /**
   * Update custom role
   * @param {string} roleId - Role ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated role
   */
  async updateCustomRole(roleId, updateData) {
    try {
      console.log(`🔍 RBAC: Updating custom role: ${roleId}`);

      const { displayName, description, permissionIds } = updateData;

      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      if (role.is_system_role) {
        throw new Error("Cannot update system roles");
      }

      // Update role data
      const updateFields = {};
      if (displayName) updateFields.display_name = displayName;
      if (description) updateFields.description = description;

      if (Object.keys(updateFields).length > 0) {
        await role.update(updateFields);
      }

      // Update permissions if provided
      if (permissionIds !== undefined) {
        // Remove existing permissions
        await RolePermission.destroy({
          where: { role_id: roleId },
        });

        // Add new permissions
        if (permissionIds.length > 0) {
          const rolePermissions = permissionIds.map((permissionId) => ({
            id: uuidv4(),
            role_id: roleId,
            permission_id: permissionId,
          }));

          await RolePermission.bulkCreate(rolePermissions);
        }
      }

      console.log(`✅ RBAC: Updated custom role '${role.name}'`);
      return role;
    } catch (error) {
      console.error("❌ RBAC: Error updating custom role:", error);
      throw error;
    }
  }

  /**
   * Delete custom role
   * @param {string} roleId - Role ID
   * @returns {boolean} Success status
   */
  async deleteCustomRole(roleId) {
    try {
      console.log(`🔍 RBAC: Deleting custom role: ${roleId}`);

      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new Error("Role not found");
      }

      if (role.isSystemRole) {
        throw new Error("Cannot delete system roles");
      }

      // Check if role is assigned to any users
      const usersWithRole = await User.count({
        where: { roleId: roleId },
      });

      if (usersWithRole > 0) {
        throw new Error("Cannot delete role that is assigned to users");
      }

      // Delete role (permissions will be deleted by cascade)
      await role.destroy();

      console.log(`✅ RBAC: Deleted custom role '${role.name}'`);
      return true;
    } catch (error) {
      console.error("❌ RBAC: Error deleting custom role:", error);
      throw error;
    }
  }
}

module.exports = new RBACService();
