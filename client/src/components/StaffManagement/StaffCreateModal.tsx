import React from "react";
import { PermissionGate } from "@/components/ui/PermissionGate";

interface StaffCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreateRole: (roleData: any) => void;
  loading: boolean;
  selectedPermissions: Set<string>;
  setSelectedPermissions: React.Dispatch<React.SetStateAction<Set<string>>>;
  expandedCategories: Set<string>;
  setExpandedCategories: React.Dispatch<React.SetStateAction<Set<string>>>;
  permissionDisplayNames: Record<string, string>;
  PERMISSION_GROUPS: Record<string, any>;
  updatePermissionsFromIndividual: (selectedPermissions: Set<string>) => any[];
  handleCategoryToggle: (groupKey: string) => void;
  handleSelectAllInCategory: (groupKey: string) => void;
  handleDeselectAllInCategory: (groupKey: string) => void;
  handlePermissionToggle: (permission: string) => void;
}

const StaffCreateModal: React.FC<StaffCreateModalProps> = ({
  open,
  onClose,
  onCreateRole,
  loading,
  selectedPermissions,
  setSelectedPermissions,
  expandedCategories,
  setExpandedCategories,
  permissionDisplayNames,
  PERMISSION_GROUPS,
  updatePermissionsFromIndividual,
  handleCategoryToggle,
  handleSelectAllInCategory,
  handleDeselectAllInCategory,
  handlePermissionToggle,
}) => {
  if (!open) return null;
  // mark setter as used to satisfy linter in current render-only modal
  void setExpandedCategories;
  return (
    <PermissionGate permission="staff_create">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-xl rounded-lg bg-white">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Create Custom Role
              </h3>
              <button
                onClick={onClose}
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
              Create a custom role with specific permissions for your staff
              members
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const roleName = formData.get("roleName") as string;
              if (!roleName || roleName.trim() === "") {
                // @ts-expect-error - window.notification may be injected globally at runtime
                window.notification.error("Role name is required");
                return;
              }
              if (selectedPermissions.size === 0) {
                // @ts-expect-error - window.notification may be injected globally at runtime
                window.notification.error(
                  "Please select at least one permission"
                );
                return;
              }
              const internalName = roleName
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^a-z0-9_]/g, "");
              const finalPermissions =
                updatePermissionsFromIndividual(selectedPermissions);
              const roleData = {
                name: internalName,
                displayName: roleName.trim(),
                description: (formData.get("description") as string) || "",
                permissions: finalPermissions,
              };
              onCreateRole(roleData);
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
                  Optional description of the role&apos;s responsibilities
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Role Capabilities <span className="text-red-500">*</span>
                </label>
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
                          <strong>High-Risk Permissions</strong> marked with{" "}
                          <span className="px-1.5 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                            HIGH RISK
                          </span>{" "}
                          can permanently delete data or export sensitive
                          information.
                        </p>
                        <p className="text-xs">
                          Only grant these permissions to trusted staff who
                          understand the consequences. These operations
                          typically cannot be undone.
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
                        (p: string) => selectedPermissions.has(p)
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
                              <span className="text-2xl">{group.icon}</span>
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
                                          handleDeselectAllInCategory(groupKey);
                                        } else {
                                          handleSelectAllInCategory(groupKey);
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
                                    create/delete hostels and manage critical
                                    system data. Use with extreme caution!
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
                                {group.permissions.map((permission: string) => {
                                  const isSelected =
                                    selectedPermissions.has(permission);
                                  const isHighPrivilege =
                                    permission.includes("delete") ||
                                    permission === "data_export" ||
                                    permission === "hostel_create" ||
                                    permission === "permission_manage";
                                  const hasWarning =
                                    group.highPrivilegeWarning &&
                                    group.highPrivilegeWarning[permission];
                                  return (
                                    <div key={permission} className="space-y-1">
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
                                            handlePermissionToggle(permission)
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
                                                group.highPrivilegeWarning?.[
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
                                (p: string) =>
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
                                        This category contains permissions that
                                        can permanently delete data or export
                                        sensitive information. Only grant these
                                        to trusted staff members who understand
                                        the consequences.
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
                                {group.permissions.some((p: string) =>
                                  p.includes("delete")
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      group.permissions.forEach((p: string) => {
                                        if (p.includes("delete")) {
                                          setSelectedPermissions(
                                            (prev: Set<string>) => {
                                              const newSet = new Set(prev);
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
                        Click on any category to expand and select the specific
                        permissions you want to grant. All necessary background
                        permissions are automatically included to ensure
                        everything works properly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading || selectedPermissions.size === 0}
              >
                {loading ? (
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
    </PermissionGate>
  );
};

export default StaffCreateModal;
