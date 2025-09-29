"use client";

import React from "react";
import { X, ShieldIcon } from "lucide-react";

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
}

interface RoleEditModalProps {
  open: boolean;
  onClose: () => void;
  editingStaffRole: StaffMember | null;
  availableRoles: CustomRole[];
  loadingOperations: Set<string>;
  editingRolePermissions: Set<string>;
  isEditingPermissions: boolean;
  modalMode: "changeRole" | "updatePermissions";
  onEditRoleSubmit: () => Promise<void>;
  onUpdateRolePermissions: () => Promise<void>;
  onSetEditingRolePermissions: (permissions: Set<string>) => void;
  permissionDisplayNames: Record<string, string>;
  onRoleChange?: (roleId: string) => void;
  onDeleteRole?: (roleId: string) => void;
  onToggleEditPermissions?: () => void;
  PERMISSION_GROUPS: Record<
    string,
    {
      title: string;
      description: string;
      permissions: string[];
      icon: string;
      required?: boolean;
      dependencies?: string[];
      isHighPrivilege?: boolean;
      highPrivilegeWarning?: { [key: string]: string };
      hideFromOwner?: boolean;
    }
  >;
  handleCategoryToggle: (groupKey: string) => void;
  expandedCategories: Set<string>;
  handleEditSelectAllInCategory: (groupKey: string) => void;
  handleEditDeselectAllInCategory: (groupKey: string) => void;
  handleEditPermissionToggle: (permission: string) => void;
}

const RoleEditModal: React.FC<RoleEditModalProps> = ({
  open,
  onClose,
  editingStaffRole,
  availableRoles,
  loadingOperations,
  editingRolePermissions,
  isEditingPermissions,
  modalMode,
  onEditRoleSubmit,
  onUpdateRolePermissions,
  onSetEditingRolePermissions,
  permissionDisplayNames,
  onRoleChange,
  onDeleteRole,
  onToggleEditPermissions,
  PERMISSION_GROUPS,
  handleCategoryToggle,
  expandedCategories,
  handleEditSelectAllInCategory,
  handleEditDeselectAllInCategory,
  handleEditPermissionToggle,
}) => {
  if (!open) return null;
  // mark optional callbacks as used if not provided to avoid no-unused-vars when destructured but unused
  void onDeleteRole;
  void onToggleEditPermissions;
  void isEditingPermissions;
  void onSetEditingRolePermissions;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <ShieldIcon className="h-5 w-5 mr-2 text-blue-600" />
            {modalMode === "changeRole"
              ? "Change Staff Role"
              : "Update Role Permissions"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {editingStaffRole && (
            <>
              {/* Staff Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Staff Member</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {editingStaffRole.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {editingStaffRole.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {editingStaffRole.email}
                      </p>
                      <p className="text-sm text-gray-600">
                        Current Role:{" "}
                        <span className="font-medium">
                          {editingStaffRole.role.displayName}
                        </span>
                        {editingStaffRole.role.isSystemRole && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            System
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Role Form */}
              {modalMode === "changeRole" && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Change Role
                  </h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      onEditRoleSubmit();
                    }}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Role
                        </label>
                        <select
                          id="edit-role-select"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={editingStaffRole.role?.id || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (onRoleChange) onRoleChange(val);
                          }}
                        >
                          <option value="">Select a role...</option>
                          {availableRoles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.displayName}{" "}
                              {role.isSystemRole ? "(System)" : "(Custom)"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="submit"
                          disabled={loadingOperations.has(
                            `edit-role-${editingStaffRole.id}`
                          )}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {loadingOperations.has(
                            `edit-role-${editingStaffRole.id}`
                          ) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <ShieldIcon className="h-4 w-4 mr-2" />
                              Change Role
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Custom Role Permissions - Only show in updatePermissions mode */}
              {modalMode === "updatePermissions" && editingStaffRole.role && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Update {editingStaffRole.role.displayName} Permissions
                  </h4>

                  {editingStaffRole.role.isSystemRole ? (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <strong>System Role:</strong> This is a system role
                            with fixed permissions that cannot be modified. To
                            change permissions, assign a custom role instead.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                        <div className="flex">
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <strong>Note:</strong> You are editing permissions
                              for the &quot;{editingStaffRole.role.displayName}&quot;
                              role. Changes will affect all users with this
                              role.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                        <div className="space-y-4">
                          {Object.entries(PERMISSION_GROUPS).map(
                            ([groupKey, group]) => {
                              const isExpanded =
                                expandedCategories.has(groupKey);
                              const selectedInGroup = group.permissions.filter(
                                (p: string) => editingRolePermissions.has(p)
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
                                  }`}
                                >
                                  <div
                                    className="p-4 cursor-pointer"
                                    onClick={() =>
                                      handleCategoryToggle(groupKey)
                                    }
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
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                              {selectedInGroup}/
                                              {group.permissions.length}{" "}
                                              selected
                                            </span>
                                            <input
                                              type="checkbox"
                                              checked={isFullySelected}
                                              ref={(input) => {
                                                if (input)
                                                  input.indeterminate =
                                                    isPartiallySelected;
                                              }}
                                              onChange={(e) => {
                                                e.stopPropagation();
                                                if (isFullySelected) {
                                                  handleEditDeselectAllInCategory(
                                                    groupKey
                                                  );
                                                } else {
                                                  handleEditSelectAllInCategory(
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
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expanded permissions list */}
                                  {isExpanded && (
                                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                                      <div className="grid grid-cols-1 gap-2">
                                        {group.permissions.map(
                                          (permission: string) => {
                                            const isSelected =
                                              editingRolePermissions.has(
                                                permission
                                              );

                                            return (
                                              <div
                                                key={permission}
                                                className="space-y-1"
                                              >
                                                <label className="flex items-start space-x-2 p-3 rounded transition-colors cursor-pointer hover:bg-white">
                                                  <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() =>
                                                      handleEditPermissionToggle(
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
                                                    </div>
                                                  </div>
                                                </label>
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>

                                      {/* Select/Deselect All buttons */}
                                      <div className="mt-3 flex space-x-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleEditSelectAllInCategory(
                                              groupKey
                                            )
                                          }
                                          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                          Select All
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleEditDeselectAllInCategory(
                                              groupKey
                                            )
                                          }
                                          className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        >
                                          Deselect All
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button
                          onClick={onUpdateRolePermissions}
                          disabled={loadingOperations.has(
                            `update-permissions-${editingStaffRole.role.id}`
                          )}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {loadingOperations.has(
                            `update-permissions-${editingStaffRole.role.id}`
                          ) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <ShieldIcon className="h-4 w-4 mr-2" />
                              Update Permissions
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Current Permissions Display */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Current Permissions
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {editingStaffRole.permissions &&
                  editingStaffRole.permissions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {editingStaffRole.permissions.map((permission) => (
                        <div
                          key={permission.id}
                          className="text-sm text-gray-600"
                        >
                          •{" "}
                          {permissionDisplayNames[permission.name] ||
                            permission.display_name ||
                            permission.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No permissions assigned
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleEditModal;
