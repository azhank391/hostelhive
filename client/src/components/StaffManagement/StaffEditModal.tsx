"use client";

import React, { useState } from "react";
import { X, PencilIcon } from "lucide-react";

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
  permissions?: Array<{
    id: string;
    name: string;
    displayName?: string;
    category?: string;
  }>;
}

interface StaffEditModalProps {
  open: boolean;
  onClose: () => void;
  editingStaff: StaffMember | null;
  availableRoles: CustomRole[];
  loadingOperations: Set<string>;
  onUpdateStaff: (staffId: string, data: any) => Promise<void>;
  onAssignRole: (staffId: string, roleId: string) => Promise<void>;
  permissionDisplayNames: Record<string, string>;
  hasPermission: (permission: string) => boolean;
}

const StaffEditModal: React.FC<StaffEditModalProps> = ({
  open,
  onClose,
  editingStaff,
  availableRoles,
  loadingOperations,
  onUpdateStaff,
  onAssignRole,
  permissionDisplayNames,
  hasPermission,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    roleId: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (editingStaff) {
      setFormData({
        name: editingStaff.name || "",
        email: editingStaff.email || "",
        phone: editingStaff.phone || "",
        roleId: editingStaff.role?.id || "",
      });
    }
  }, [editingStaff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setIsLoading(true);
    try {
      if (hasPermission("staff_update")) {
        await onUpdateStaff(editingStaff.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        });
      }

      if (
        hasPermission("role_assign") &&
        formData.roleId !== editingStaff.role?.id
      ) {
        await onAssignRole(editingStaff.id, formData.roleId);
      }

      onClose();
    } catch (error) {
      console.error("Failed to update staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!open || !editingStaff) return null;

  const canEditStaff = hasPermission("staff_update");
  const canAssignRoles = hasPermission("role_assign");
  const canUpdate = canEditStaff || canAssignRoles;

  // Compute permissions to show: if role selection changed, preview that role's permissions
  const selectedRole = availableRoles.find((r) => r.id === formData.roleId);
  const permissionNamesToShow: string[] = selectedRole
    ? (selectedRole.permissions || []).map((p: any) => p.name)
    : (editingStaff.permissions || []).map((p: any) => p.name);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-xl rounded-lg bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <PencilIcon className="h-6 w-6 mr-2 text-blue-600" />
            Edit Staff Member
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {editingStaff.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">{editingStaff.name}</p>
                <p className="text-sm text-gray-500">{editingStaff.email}</p>
                <p className="text-sm text-gray-600">
                  Current Role: {editingStaff.role?.displayName || "No role assigned"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!canEditStaff}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter staff member's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!canEditStaff}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!canEditStaff}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter phone number (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Assignment
              </label>
              {canAssignRoles ? (
                <select
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors bg-white"
                >
                  <option value="">Choose a role for this staff member</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.displayName} {role.isSystemRole ? "(System)" : "(Custom)"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-600 sm:text-sm">
                  {editingStaff.role?.displayName || "No role assigned"}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Current Permissions</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
              {permissionNamesToShow && permissionNamesToShow.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {permissionNamesToShow.map((permName) => (
                    <div key={permName} className="text-sm text-gray-600">
                      {permissionDisplayNames[permName] || permName}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No permissions assigned</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            {canUpdate && (
              <button
                type="submit"
                disabled={isLoading || loadingOperations.has(`update-${editingStaff.id}`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Update Staff
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffEditModal;
