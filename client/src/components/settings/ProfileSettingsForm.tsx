"use client";
import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2, Save } from "lucide-react";
import { notification } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/http";

interface ProfileSettingsFormProps {
  roleContext: "owner" | "student" | "warden" | "staff" | "custom";
  onSuccess?: () => void;
  showPassword?: boolean;
}

export const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({
  roleContext,
  onSuccess,
  showPassword = true,
}) => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: (user as any)?.phone || "",
  });
  const [pass, setPass] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const updateProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setErrors({});
      setLoading(true);
      try {
        // Assume unified endpoint /auth/profile accepts partial updates
        const res = await api.put("/auth/profile", {
          name: form.name,
          email: form.email,
          phone: form.phone,
        });
        if ((res as any)?.data?.success !== false) {
          updateUser({ name: form.name, email: form.email, phone: form.phone });
          notification.success("Profile updated");
          onSuccess?.();
        } else {
          // Try to surface backend errors
          const backend = (res as any)?.data;
          if (backend?.message) setErrors({ _form: backend.message });
          notification.error(backend?.message || "Failed to update profile");
        }
      } catch (err) {
        console.error(err);
        // Parse validation errors from backend (common shapes)
        const parsed = parseBackendErrors(err);
        if (Object.keys(parsed).length) {
          setErrors(parsed);
          // show top-level message if present
          if (parsed._form) notification.error(parsed._form as string);
          else
            notification.error(
              "Please correct the highlighted fields and try again."
            );
        } else {
          notification.error("Profile update failed");
        }
      } finally {
        setLoading(false);
      }
    },
    [user, form, updateUser, onSuccess]
  );

  const changePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (pass.newPassword !== pass.confirmPassword) {
        notification.error("Passwords do not match");
        return;
      }
      // Client-side validation to mirror backend rules
      const clientErrors: Record<string, string> = {};
      if (!pass.currentPassword || pass.currentPassword.trim() === "") {
        clientErrors.currentPassword = "Current password is required";
      }
      if (!pass.newPassword || pass.newPassword.length < 6) {
        clientErrors.newPassword =
          "New password must be at least 6 characters long";
      }
      if (pass.newPassword === "123456") {
        clientErrors.newPassword = "Cannot use the default password (123456)";
      }
      if (pass.currentPassword && pass.currentPassword === pass.newPassword) {
        clientErrors.newPassword =
          "New password must be different from the current password";
      }

      if (Object.keys(clientErrors).length) {
        setErrors(clientErrors);
        // show the first client-side error as a notification
        notification.error(Object.values(clientErrors)[0]);
        return;
      }

      setErrors({});
      setPassLoading(true);
      try {
        const res = await api.put("/auth/change-password", {
          currentPassword: pass.currentPassword,
          newPassword: pass.newPassword,
        });
        if ((res as any)?.data?.success !== false) {
          notification.success("Password changed");
          // Clear first-login modal requirement if present
          updateUser({ requiresPasswordChange: false });
          setPass({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        } else {
          const backend = (res as any)?.data;
          if (backend?.message) setErrors({ _form: backend.message });
          notification.error(backend?.message || "Password change failed");
        }
      } catch (err: any) {
        console.error(err);
        // Parse validation errors and show field-level messages if any
        const parsed = parseBackendErrors(err);
        if (Object.keys(parsed).length) {
          setErrors(parsed);
          if (parsed._form) notification.error(parsed._form as string);
          else {
            // Map common backend strings to friendly messages
            const backendMsg =
              parsed._form ||
              (err?.response?.data?.message as string) ||
              err?.message;
            if (/cannot\s*use\s*default\s*password/i.test(backendMsg || "")) {
              notification.error(
                "Please choose a new password. You cannot use the default password."
              );
            } else if (
              /incorrect\s*current\s*password|invalid\s*credentials/i.test(
                backendMsg || ""
              )
            ) {
              notification.error("Your current password is incorrect.");
            } else if (/minimum|length|6/i.test(backendMsg || "")) {
              // Likely a min length validation from backend
              notification.error(
                "New password must be at least 6 characters long."
              );
            } else {
              notification.error("Password change failed");
            }
          }
        } else {
          notification.error("Password change failed");
        }
      } finally {
        setPassLoading(false);
      }
    },
    [pass]
  );

  // Helper to normalize backend validation errors into a flat map
  function parseBackendErrors(err: any): Record<string, string> {
    try {
      // Common shapes:
      // { message: '...', errors: { field: ['msg'] } }
      // { errors: [{ field: 'password', message: '...' } ] }
      // { validation: { body: { password: [ 'too short' ] } } }
      const data = err?.response?.data;
      if (!data) return {};

      const result: Record<string, string> = {};

      if (typeof data.message === "string") {
        result._form = data.message;
      }

      if (data.errors && typeof data.errors === "object") {
        // errors: { field: ['msg'] }
        for (const k of Object.keys(data.errors)) {
          const v = data.errors[k];
          if (Array.isArray(v) && v.length) result[k] = String(v[0]);
          else if (typeof v === "string") result[k] = v;
        }
      }

      if (Array.isArray(data.errors)) {
        // errors: [{ field: 'password', message: '...' }]
        for (const item of data.errors) {
          if (item && item.field)
            result[item.field] = item.message || item.msg || String(item);
        }
      }

      // Some APIs return validation as data.validation.body
      if (data.validation && data.validation.body) {
        for (const k of Object.keys(data.validation.body)) {
          const v = data.validation.body[k];
          if (Array.isArray(v) && v.length) result[k] = String(v[0]);
          else if (typeof v === "string") result[k] = v;
        }
      }

      return result;
    } catch (e) {
      return {};
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={updateProfile} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              required
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <Input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Optional"
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
          )}
        </div>
        <Button type="submit" disabled={loading} className="min-w-40">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </form>

      {showPassword && (
        <form onSubmit={changePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Password
              </label>
              <Input
                type="password"
                value={pass.currentPassword}
                onChange={(e) =>
                  setPass((p) => ({ ...p, currentPassword: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>
              <Input
                type="password"
                value={pass.newPassword}
                onChange={(e) =>
                  setPass((p) => ({ ...p, newPassword: e.target.value }))
                }
                required
              />
              {errors.newPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.newPassword}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Password rules: at least 6 characters, cannot be "123456", and
                must differ from your current password.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                value={pass.confirmPassword}
                onChange={(e) =>
                  setPass((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                required
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
          {errors._form && (
            <p className="text-sm text-red-500">{errors._form}</p>
          )}
          <Button type="submit" disabled={passLoading} className="min-w-40">
            {passLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Changing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
};
