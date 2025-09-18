"use client";
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Save } from 'lucide-react';
import { notification } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/http';

interface ProfileSettingsFormProps {
  roleContext: 'owner' | 'student' | 'warden' | 'staff' | 'custom';
  onSuccess?: () => void;
  showPassword?: boolean;
}

export const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({ roleContext, onSuccess, showPassword = true }) => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as any)?.phone || ''
  });
  const [pass, setPass] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  const updateProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // Assume unified endpoint /auth/profile accepts partial updates
      const res = await api.put('/auth/profile', {
        name: form.name,
        email: form.email,
        phone: form.phone
      });
      if ((res as any)?.data?.success !== false) {
        updateUser({ name: form.name, email: form.email, phone: form.phone });
        notification.success('Profile updated');
        onSuccess?.();
      } else {
        notification.error('Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      notification.error('Profile update failed');
    } finally {
      setLoading(false);
    }
  }, [user, form, updateUser, onSuccess]);

  const changePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (pass.newPassword !== pass.confirmPassword) {
      notification.error('Passwords do not match');
      return;
    }
    setPassLoading(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: pass.currentPassword,
        newPassword: pass.newPassword
      });
      if ((res as any)?.data?.success !== false) {
        notification.success('Password changed');
        setPass({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        notification.error('Password change failed');
      }
    } catch (err) {
      console.error(err);
      notification.error('Password change failed');
    } finally {
      setPassLoading(false);
    }
  }, [pass]);

  return (
    <div className="space-y-8">
      <form onSubmit={updateProfile} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Optional" />
        </div>
        <Button type="submit" disabled={loading} className="min-w-40">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Profile</>}
        </Button>
      </form>

      {showPassword && (
        <form onSubmit={changePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <Input type="password" value={pass.currentPassword} onChange={e => setPass(p => ({ ...p, currentPassword: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <Input type="password" value={pass.newPassword} onChange={e => setPass(p => ({ ...p, newPassword: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <Input type="password" value={pass.confirmPassword} onChange={e => setPass(p => ({ ...p, confirmPassword: e.target.value }))} required />
            </div>
          </div>
          <Button type="submit" disabled={passLoading} className="min-w-40">
            {passLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Changing...</> : <><Save className="h-4 w-4 mr-2" />Change Password</>}
          </Button>
        </form>
      )}
    </div>
  );
};
