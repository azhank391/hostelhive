'use client'

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useHostel } from '@/context/HostelContext';
import { api } from '@/lib/http';
import { notification } from '@/lib/toast';
import { STORAGE_KEYS } from '@/lib/config';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { 
  Settings, 
  User, 
  Building2, 
  Moon, 
  Sun, 
  Save, 
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';

interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface HostelFormData {
  name: string;
  country: string;
  city: string;
  address: string;
  email: string;
}

export default function HostelSettingsPage() {
  const params = useParams();
  const { user, updateUser } = useAuth();
  const { currentHostel, updateHostel, refreshHostels } = useHostel();
  const hostelId = params.hostelId as string;

  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  // Form states
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: '',
    email: '',
    phone: ''
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [hostelForm, setHostelForm] = useState<HostelFormData>({
    name: '',
    country: '',
    city: '',
    address: '',
    email: ''
  });

  // Loading states
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isHostelLoading, setIsHostelLoading] = useState(false);
  
  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize forms and theme
  useEffect(() => {
    console.log('🔍 DEBUG: Settings page useEffect triggered');
    console.log('🔍 DEBUG: User:', user);
    console.log('🔍 DEBUG: Current hostel:', currentHostel);
    
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }

    if (currentHostel) {
      // Extract location data from the hostel object
      const location = currentHostel.location;
      console.log('🔍 DEBUG: Hostel data:', currentHostel);
      console.log('🔍 DEBUG: Location data:', location);
      
      setHostelForm({
        name: currentHostel.name || '',
        country: location?.country || '',
        city: location?.city || '',
        address: location?.address || '',
        email: currentHostel.email || ''
      });
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    console.log('🔍 DEBUG: Saved theme:', savedTheme);
    setIsDarkTheme(savedTheme === 'dark');

    // Debug: Check authentication state
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    console.log('🔍 DEBUG: Settings page - User:', user);
    console.log('🔍 DEBUG: Settings page - Current hostel:', currentHostel);
    console.log('🔍 DEBUG: Settings page - Token exists:', !!token);
  }, [user, currentHostel]);

  // Apply theme
  useEffect(() => {
    console.log('🔍 DEBUG: Applying theme:', isDarkTheme ? 'dark' : 'light');
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkTheme]);

  // Apply initial theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Refresh hostel data when page loads to ensure we have the latest data
  useEffect(() => {
    if (user && hostelId) {
      console.log('🔍 DEBUG: Refreshing hostel data for hostelId:', hostelId);
      refreshHostels();
    }
  }, [user, hostelId, refreshHostels]);

  const handleThemeToggle = () => {
    console.log('🔍 DEBUG: Theme toggle clicked, current theme:', isDarkTheme ? 'dark' : 'light');
    const newTheme = !isDarkTheme;
    console.log('🔍 DEBUG: Setting new theme to:', newTheme ? 'dark' : 'light');
    setIsDarkTheme(newTheme);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsProfileLoading(true);
      
      // Debug: Check if token exists
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('🔍 DEBUG: Profile update - Token exists:', !!token);
      console.log('🔍 DEBUG: Profile update - User:', user);
      
      const response = await api.put(`/auth/profile`, {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone
      });

      if (response.data.success) {
        updateUser({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone
        });
        notification.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (error.response?.status === 401) {
        notification.error('Authentication failed. Please log in again.');
        // Redirect to login
        window.location.href = '/auth/login';
      } else {
        notification.error('Failed to update profile');
      }
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notification.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      notification.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsPasswordLoading(true);
      
      // Debug: Check if token exists
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('🔍 DEBUG: Password change - Token exists:', !!token);
      
      const response = await api.put(`/auth/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.data.success) {
        notification.success('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      if (error.response?.status === 401) {
        notification.error('Authentication failed. Please log in again.');
        // Redirect to login
        window.location.href = '/auth/login';
      } else {
        notification.error('Failed to change password');
      }
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleHostelUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHostel) return;

    try {
      setIsHostelLoading(true);
      
      const updatedHostel = await updateHostel(currentHostel.id, hostelForm);
      
      if (updatedHostel) {
        notification.success('Hostel information updated successfully');
      }
    } catch (error) {
      console.error('Failed to update hostel:', error);
      notification.error('Failed to update hostel information');
    } finally {
      setIsHostelLoading(false);
    }
  };

  if (!user || !currentHostel) {
    return (
      <div className="flex items-center justify-center min-h-[400px] dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground dark:text-gray-300">Please log in and select a hostel to view settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 dark:bg-gray-900 dark:text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Settings</h1>
          <p className="text-muted-foreground dark:text-gray-300">
            Manage your profile, hostel information, and preferences
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {currentHostel.name}
          </Badge>
        </div>
      </div>

      {/* Theme Toggle */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <h3 className="flex items-center gap-2 dark:text-white">
            <Settings className="h-5 w-5" />
            Appearance
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium dark:text-white">Dark Theme</p>
              <p className="text-sm text-muted-foreground dark:text-gray-300">
                Switch between light and dark appearance
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleThemeToggle}
              className="flex items-center gap-2"
            >
              {isDarkTheme ? (
                <>
                  <Moon className="h-4 w-4" />
                  Dark
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  Light
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <h3 className="flex items-center gap-2 dark:text-white">
            <User className="h-5 w-5" />
            Profile Settings
          </h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-2 dark:text-white">Full Name</label>
                 <Input
                   type="text"
                   value={profileForm.name}
                   onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-2 dark:text-white">Email</label>
                 <Input
                   type="email"
                   value={profileForm.email}
                   onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                   required
                 />
               </div>
             </div>
             <div>
               <label className="block text-sm font-medium mb-2 dark:text-white">Phone Number</label>
               <Input
                 type="tel"
                 value={profileForm.phone || ''}
                 onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                 placeholder="Optional"
               />
             </div>
            <Button type="submit" disabled={isProfileLoading}>
              {isProfileLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <h3 className="flex items-center gap-2 dark:text-white">
            <User className="h-5 w-5" />
            Change Password
          </h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
                         <div>
               <label className="block text-sm font-medium mb-2 dark:text-white">Current Password</label>
               <div className="relative">
                 <Input
                   type={showCurrentPassword ? "text" : "password"}
                   value={passwordForm.currentPassword}
                   onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                   required
                 />
                 <Button
                   type="button"
                   variant="ghost"
                   size="sm"
                   className="absolute right-0 top-0 h-full px-3"
                   onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                 >
                   {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                 </Button>
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-2 dark:text-white">New Password</label>
                 <div className="relative">
                   <Input
                     type={showNewPassword ? "text" : "password"}
                     value={passwordForm.newPassword}
                     onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                     required
                   />
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     className="absolute right-0 top-0 h-full px-3"
                     onClick={() => setShowNewPassword(!showNewPassword)}
                   >
                     {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                   </Button>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium mb-2 dark:text-white">Confirm New Password</label>
                 <div className="relative">
                   <Input
                     type={showConfirmPassword ? "text" : "password"}
                     value={passwordForm.confirmPassword}
                     onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                     required
                   />
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     className="absolute right-0 top-0 h-full px-3"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                   >
                     {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                   </Button>
                 </div>
               </div>
             </div>
            <Button type="submit" disabled={isPasswordLoading}>
              {isPasswordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Hostel Information */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <h3 className="flex items-center gap-2 dark:text-white">
            <Building2 className="h-5 w-5" />
            Hostel Information
          </h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleHostelUpdate} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-2 dark:text-white">Hostel Name</label>
                 <Input
                   type="text"
                   value={hostelForm.name}
                   onChange={(e) => setHostelForm(prev => ({ ...prev, name: e.target.value }))}
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-2 dark:text-white">Email</label>
                 <Input
                   type="email"
                   value={hostelForm.email}
                   onChange={(e) => setHostelForm(prev => ({ ...prev, email: e.target.value }))}
                   required
                 />
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium mb-2 dark:text-white">Country</label>
                 <Input
                   type="text"
                   value={hostelForm.country}
                   onChange={(e) => setHostelForm(prev => ({ ...prev, country: e.target.value }))}
                   required
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-2 dark:text-white">City</label>
                 <Input
                   type="text"
                   value={hostelForm.city}
                   onChange={(e) => setHostelForm(prev => ({ ...prev, city: e.target.value }))}
                   required
                 />
               </div>
             </div>
             <div>
               <label className="block text-sm font-medium mb-2 dark:text-white">Address</label>
               <Textarea
                 value={hostelForm.address}
                 onChange={(e) => setHostelForm(prev => ({ ...prev, address: e.target.value }))}
                 required
                 rows={3}
               />
             </div>
            <Button type="submit" disabled={isHostelLoading}>
              {isHostelLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating Hostel...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Hostel Information
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
