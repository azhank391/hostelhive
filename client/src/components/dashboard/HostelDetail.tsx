'use client';

import React, { useEffect, useState } from 'react';
import { useHostel } from '@/context/HostelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BuildingIcon, UsersIcon, BedIcon, AlertCircleIcon, MessageSquareIcon, ShareIcon, EditIcon, CopyIcon, CheckIcon, MapPinIcon, MailIcon, CreditCardIcon } from 'lucide-react';
import Link from 'next/link';
import { hostelApi } from '@/lib/api';
import toast from '@/lib/toast';

interface HostelDetailProps {
  id: string;
}

interface UpdateHostelData {
  name: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  country?: string;
  city?: string;
  address?: string;
  isActive: boolean;
}

export const HostelDetail: React.FC<HostelDetailProps> = ({ id }) => {
  const { currentHostel, hostels, loadingState, refreshHostels } = useHostel();
  const { user } = useAuth();
  const [hostel, setHostel] = useState<any>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form state for update modal
  const [updateForm, setUpdateForm] = useState<UpdateHostelData>({
    name: '',
    email: '',
    plan: 'free',
    country: '',
    city: '',
    address: '',
    isActive: true
  });

  // 🚀 IMPROVED: Function to generate subdomain from hostel name
  const generateSubdomain = (hostelName: string): string => {
    if (!hostelName) return '';
    
    // Convert "Hostel 21" to "hostel21"
    return hostelName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters but keep spaces
      .replace(/\s+/g, '') // Remove all spaces
      .substring(0, 20); // Limit length
  };

  // 🚀 IMPROVED: Function to check subdomain uniqueness
  const checkSubdomainUniqueness = async (subdomain: string): Promise<boolean> => {
    try {
      // For now, we'll check against the current hostel's subdomain
      // In a real implementation, this would call your backend API
      if (!subdomain || subdomain === hostel.subdomain) {
        return true; // Same subdomain is considered "unique" for updates
      }
      
      // Check if any other hostel has this subdomain
      const allHostels = hostels.filter(h => h.id !== hostel.id);
      const subdomainExists = allHostels.some(h => h.subdomain === subdomain);
      
      return !subdomainExists;
    } catch (error) {
      console.error('Failed to check subdomain uniqueness:', error);
      return false;
    }
  };

  // 🚀 NEW: Function to fetch hostel details from API if not in context
  const fetchHostelDetails = async (hostelId: string) => {
    try {
      const response = await hostelApi.getHostelDetails(hostelId);
      setHostel(response);
    } catch (error: any) {
      console.error('Failed to fetch hostel details:', error);
    }
  };

  // 🚀 IMPROVED: Function to update hostel details with auto-subdomain generation
  const handleUpdateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      // 🚀 IMPROVED: Generate new subdomain if name changed
      let newSubdomain = hostel.subdomain;
      if (updateForm.name !== hostel.name) {
        const generatedSubdomain = generateSubdomain(updateForm.name);
        console.log('🚀 DEBUG: Name changed from', hostel.name, 'to', updateForm.name);
        console.log('🚀 DEBUG: Generated subdomain:', generatedSubdomain);
        
        if (generatedSubdomain) {
          // Check if generated subdomain is unique
          const isUnique = await checkSubdomainUniqueness(generatedSubdomain);
          console.log('🚀 DEBUG: Is subdomain unique?', isUnique);
          
          if (isUnique) {
            newSubdomain = generatedSubdomain;
            console.log('🚀 DEBUG: Using generated subdomain:', newSubdomain);
          } else {
            // If not unique, add a number suffix
            let counter = 1;
            let finalSubdomain = generatedSubdomain;
            while (!(await checkSubdomainUniqueness(finalSubdomain))) {
              finalSubdomain = `${generatedSubdomain}${counter}`;
              counter++;
              if (counter > 100) break; // Prevent infinite loop
            }
            newSubdomain = finalSubdomain;
            console.log('🚀 DEBUG: Using fallback subdomain:', newSubdomain);
          }
        } else {
          console.log('🚀 DEBUG: No subdomain generated, keeping current:', newSubdomain);
        }
      } else {
        console.log('🚀 DEBUG: Name unchanged, keeping current subdomain:', newSubdomain);
      }

      console.log('Final subdomain to update:', newSubdomain);

      // 🚀 IMPROVED: If email is blank, use the previous email value
      const updateData = {
        ...updateForm,
        email: updateForm.email.trim() || hostel.email, // Keep previous email if blank
        subdomain: newSubdomain // Include the new subdomain
      };
      
      const response = await hostelApi.updateHostel(id, updateData);
      setHostel(response);
      await refreshHostels(); // Refresh context data
      setShowUpdateModal(false);
      toast.success(`Hostel updated successfully! New subdomain: ${newSubdomain}`);
    } catch (error: any) {
      console.error('Failed to update hostel:', error);
      toast.error('Failed to update hostel. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 🚀 IMPROVED: Function to share hostel link
  const handleShareHostel = async () => {
    const hostelUrl = `${window.location.origin}/dashboard/hostels/${id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Hostel: ${hostel.name}`,
          text: `Check out ${hostel.name} hostel`,
          url: hostelUrl
        });
      } else {
        await navigator.clipboard.writeText(hostelUrl);
        setCopied(true);
        toast.success('Hostel link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share hostel link');
    }
  };

  // 🚀 IMPROVED: Function to open update modal
  const openUpdateModal = () => {
    setUpdateForm({
      name: hostel.name || '',
      email: hostel.email || '',
      plan: (hostel.plan as 'free' | 'pro' | 'enterprise') || 'free',
      country: hostel.location?.country || '',
      city: hostel.location?.city || '',
      address: hostel.location?.address || '',
      isActive: hostel.isActive || false
    });
    setShowUpdateModal(true);
  };

  useEffect(() => {
    // Find the hostel by ID from the context
    const foundHostel = hostels.find(h => h.id === id);
    if (foundHostel) {
      setHostel(foundHostel);
    } else if (currentHostel && currentHostel.id === id) {
      setHostel(currentHostel);
    } else {
      // 🚀 NEW: If not found in context, fetch from API
      fetchHostelDetails(id);
    }
  }, [id, hostels, currentHostel]);

  if (loadingState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-medium text-gray-900 mt-6">Loading hostel details...</h2>
          <p className="text-gray-600 mt-2">Please wait while we fetch the information</p>
        </div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <AlertCircleIcon className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="text-xl font-medium text-gray-900 mt-6">Hostel Not Found</h2>
          <p className="mt-2 text-gray-600">
            The requested hostel could not be found or you don't have access to it.
          </p>
          <div className="mt-6">
            <Link href="/dashboard">
              <Button variant="outline" className="px-6 py-2">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 🚀 IMPROVED: Enhanced top cards with better styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <BuildingIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-100">Status</p>
                <p className="text-2xl font-bold text-white">
                  {hostel.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <UsersIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-100">Plan</p>
                <p className="text-2xl font-bold text-white capitalize">
                  {hostel.plan}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <BedIcon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-100">Subdomain</p>
                  <p className="text-2xl font-bold text-white">
                    {hostel.subdomain || 'N/A'}
                  </p>
                </div>
              </div>
              {/* 🚀 IMPROVED: Share button with better styling */}
              <Button
                onClick={handleShareHostel}
                variant="outline"
                size="sm"
                className="flex items-center bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:text-purple-600 transition-all duration-200"
                title="Share hostel link"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <ShareIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <MessageSquareIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-orange-100">Created</p>
                <p className="text-2xl font-bold text-white">
                  {new Date(hostel.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* 🚀 IMPROVED: Enhanced Hostel Information Card */}
        <div className="grid grid-cols-1 gap-8">
          <Card className="p-8 bg-white shadow-xl border-0 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Hostel Information</h3>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Hostel Name</p>
                  <p className="text-2xl font-bold text-gray-900">{hostel.name}</p>
                </div>
                {/* 🚀 IMPROVED: Update button with better styling */}
                <Button
                  onClick={openUpdateModal}
                  size="lg"
                  className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                >
                  <EditIcon className="h-5 w-5 mr-2" />
                  Update Hostel Details
                </Button>
              </div>
              
              {hostel.email && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
                  <p className="text-lg text-gray-900 font-medium">{hostel.email}</p>
                </div>
              )}
              
              {hostel.subdomain && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-sm font-medium text-purple-600 mb-1">Subdomain</p>
                  <p className="text-lg text-gray-900 font-medium font-mono">{hostel.subdomain}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-sm font-medium text-green-600 mb-1">Plan</p>
                  <p className="text-lg text-gray-900 font-medium capitalize">{hostel.plan}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    hostel.isActive 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {hostel.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              {(hostel.location?.country || hostel.location?.city || hostel.location?.address) && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-medium text-blue-600 mb-3">Location</p>
                  <div className="space-y-2">
                    {hostel.location?.country && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-gray-700">{hostel.location.country}</span>
                      </div>
                    )}
                    {hostel.location?.city && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-gray-700">{hostel.location.city}</span>
                      </div>
                    )}
                    {hostel.location?.address && (
                      <div className="flex items-start">
                        <MapPinIcon className="h-4 w-4 text-blue-500 mr-2 mt-1" />
                        <span className="text-gray-700">{hostel.location.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* 🚀 IMPROVED: Enhanced Update Hostel Modal */}
        {showUpdateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl border-0">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Update Hostel Details</h3>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
              
              <form onSubmit={handleUpdateHostel} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <BuildingIcon className="inline h-4 w-4 mr-2 text-blue-500" />
                    Hostel Name *
                  </label>
                  <input
                    type="text"
                    value={updateForm.name}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  />
                  <p className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
                    💡 Changing the name will automatically update the subdomain
                  </p>
                  {updateForm.name !== hostel.name && updateForm.name && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        🔄 New subdomain will be: <span className="font-mono text-green-900">{generateSubdomain(updateForm.name)}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MailIcon className="inline h-4 w-4 mr-2 text-green-500" />
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={updateForm.email}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Leave blank to keep current email"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Leave blank to keep the current email address
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CreditCardIcon className="inline h-4 w-4 mr-2 text-purple-500" />
                    Plan *
                  </label>
                  <select
                    value={updateForm.plan}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, plan: e.target.value as 'free' | 'pro' | 'enterprise' }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    required
                  >
                    <option value="free">Free Plan (Up to 10 students)</option>
                    <option value="pro">Pro Plan (Up to 100 students)</option>
                    <option value="enterprise">Enterprise Plan (Unlimited students)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MapPinIcon className="inline h-4 w-4 mr-2 text-orange-500" />
                      Country
                    </label>
                    <input
                      type="text"
                      value={updateForm.country}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                      placeholder="e.g., United States"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <MapPinIcon className="inline h-4 w-4 mr-2 text-orange-500" />
                      City
                    </label>
                    <input
                      type="text"
                      value={updateForm.city}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                      placeholder="e.g., New York"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPinIcon className="inline h-4 w-4 mr-2 text-orange-500" />
                    Address
                  </label>
                  <textarea
                    value={updateForm.address}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="Enter full address"
                  />
                </div>

                <div className="flex items-center p-4 bg-blue-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={updateForm.isActive}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg"
                  />
                  <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-900">
                    Active
                  </label>
                </div>

                <div className="flex space-x-4 pt-6">
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  >
                    {isUpdating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Hostel'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
