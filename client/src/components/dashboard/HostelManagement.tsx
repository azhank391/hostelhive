'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { PlusIcon, FilterIcon, SearchIcon, BuildingIcon, RefreshCwIcon, TrendingUpIcon, MapPinIcon, UsersIcon, BedIcon, TrashIcon, EditIcon, EyeIcon, ShareIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import HostelCard from '@/components/dashboard/HostelCard'
import { CreateHostelModal } from '@/components/modals/CreateHostelModal'
import { Input } from '@/components/ui/Input'
import toast from '@/lib/toast'
import { useHostel } from '@/context/HostelContext'
import { superadminApi } from '@/lib/api'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionGate } from '@/components/PermissionGate'

interface Hostel {
  id: string;
  name: string;
  email: string;
  subdomain: string;
  plan: string;
  isActive: boolean;
  isPaid: boolean;
  createdAt: string;
  updatedAt?: string;
  location?: {
    country?: string;
    city?: string;
    address?: string;
  };
  stats?: HostelStats;
}

interface HostelStats {
  totalRooms: number;
  occupiedRooms: number;
  totalStudents: number;
  pendingComplaints: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

interface FilterCriteria {
  plan: string;
  status: string;
  payment: string;
  location: string;
}

/**
 * 🚀 COMPACT HostelManagement Component
 * 
 * Features:
 * ✅ Compact, space-efficient design
 * ✅ Smaller cards and spacing
 * ✅ Maintains functionality while reducing size
 * ✅ Better for smaller screens and dense layouts
 */
export const HostelManagement = React.memo(() => {
  const { hostels: availableHostels, refreshHostels, loadingState } = useHostel()
  const { user, isLoading } = useAuth()
  const { hasPermission } = usePermissions()
  
  // Permission checks
  const canViewHostels = hasPermission('hostel_read') || hasPermission('hostel_read')
  const canCreateHostels = hasPermission('hostel_create')
  const canUpdateHostels = hasPermission('hostel_update')
  const canDeleteHostels = hasPermission('hostel_delete')
  const canManageHostelSettings = hasPermission('hostel_settings_update')
  
  // State management
  const [hostels, setHostels] = useState<Hostel[]>([])
  const [hostelStats, setHostelStats] = useState<Record<string, HostelStats>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    plan: 'all',
    status: 'all',
    payment: 'all',
    location: 'all'
  })
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)

  // 🎯 PERFORMANCE: Memoized filtering and search
  const filteredHostels = useMemo(() => {
    let filtered = hostels

    // Search filter
    if (searchTerm.trim()) {
      const lowercaseQuery = searchTerm.toLowerCase()
      filtered = filtered.filter(hostel =>
        (hostel.name && hostel.name.toLowerCase().includes(lowercaseQuery)) ||
        (hostel.email && hostel.email.toLowerCase().includes(lowercaseQuery)) ||
        (hostel.subdomain && hostel.subdomain.toLowerCase().includes(lowercaseQuery)) ||
        (hostel.location?.city && hostel.location.city.toLowerCase().includes(lowercaseQuery))
      )
    }

    // Plan filter
    if (filterCriteria.plan !== 'all') {
      filtered = filtered.filter(hostel => hostel.plan && hostel.plan === filterCriteria.plan)
    }

    // Status filter
    if (filterCriteria.status !== 'all') {
      filtered = filtered.filter(hostel => 
        filterCriteria.status === 'active' ? hostel.isActive : !hostel.isActive
      )
    }

    // Payment filter
    if (filterCriteria.payment !== 'all') {
      filtered = filtered.filter(hostel => 
        filterCriteria.payment === 'paid' ? hostel.isPaid : !hostel.isPaid
      )
    }

    // Location filter
    if (filterCriteria.location !== 'all') {
      filtered = filtered.filter(hostel => 
        hostel.location?.country && hostel.location.country.toLowerCase().includes(filterCriteria.location.toLowerCase())
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [hostels, searchTerm, filterCriteria])

  // 🎯 PERFORMANCE: Memoized summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      totalHostels: hostels.length,
      activeHostels: hostels.filter(h => h.isActive !== undefined ? h.isActive : false).length,
      paidHostels: hostels.filter(h => h.isPaid !== undefined ? h.isPaid : false).length,
      totalRevenue: 0,
      totalStudents: 0,
      totalRooms: 0,
      avgOccupancy: 0
    }

    Object.values(hostelStats).forEach(hostelStat => {
      stats.totalRevenue += hostelStat.monthlyRevenue || 0
      stats.totalStudents += hostelStat.totalStudents || 0
      stats.totalRooms += hostelStat.totalRooms || 0
    })

    stats.avgOccupancy = stats.totalRooms > 0 
      ? Math.round((Object.values(hostelStats).reduce((acc, stat) => acc + (stat.occupancyRate || 0), 0) / Object.keys(hostelStats).length) || 0)
      : 0

    return stats
  }, [hostels, hostelStats])

  // 🎯 PERFORMANCE: Memoized unique plan and location lists for filters
  const filterOptions = useMemo(() => {
    const plans = Array.from(new Set(hostels.map(h => h.plan).filter(Boolean)))
    const countries = Array.from(new Set(hostels.map(h => h.location?.country).filter(Boolean)))
    
    return { plans, countries }
  }, [hostels])

  // 🚀 PERFORMANCE: Optimized batch data fetching
  const fetchHostelStats = useCallback(async () => {
    if (!Array.isArray(hostels) || hostels.length === 0) return

    try {
      // Import the API to fetch real stats
      const { hostelApi } = await import('@/lib/api');
      
      // Batch fetch stats for all hostels using real API
      const statsPromises = hostels.map(async (hostel) => {
        try {
          const response = await hostelApi.getDashboardMetrics(hostel.id);
          const realStats = response;
          
          // Transform backend stats to match our interface
          const transformedStats: HostelStats = {
            totalRooms: realStats.stats.totalRooms || 0,
            occupiedRooms: realStats.stats.occupiedRooms || 0,
            totalStudents: realStats.stats.totalStudents || 0,
            pendingComplaints: realStats.stats.pendingComplaints || 0,
            monthlyRevenue: 0, // Not available in backend yet
            occupancyRate: realStats.stats.totalRooms > 0 
              ? Math.round((realStats.stats.occupiedRooms / realStats.stats.totalRooms) * 100)
              : 0
          }

          return { hostelId: hostel.id, stats: transformedStats }
        } catch (error) {
          console.error(`Failed to fetch stats for hostel ${hostel.id}:`, error)
          // Return default stats if API fails
          return { 
            hostelId: hostel.id, 
            stats: {
              totalRooms: 0,
              occupiedRooms: 0,
              totalStudents: 0,
              pendingComplaints: 0,
              monthlyRevenue: 0,
              occupancyRate: 0
            }
          }
        }
      })

      const results = await Promise.allSettled(statsPromises)
      const newStats: Record<string, HostelStats> = {}

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          newStats[result.value.hostelId] = result.value.stats
        }
      })

      setHostelStats(newStats)
    } catch (error) {
      console.error('Error fetching hostel stats:', error)
      toast.error('Failed to load hostel statistics')
    }
  }, [hostels])

  // 🚀 PERFORMANCE: Optimized main data fetching
  const fetchHostels = useCallback(async () => {
    try {
      // Prevent multiple simultaneous calls
      if (isFetching) {
        return;
      }
      
      setIsFetching(true)
      setLoading(true)
      setError('')
      
      // 🚀 NEW: Fetch ALL hostels (active and inactive) for owner dashboard
      const { apiClient } = await import('@/lib/api-client');
      const response = await apiClient.get<{ hostels: Hostel[] }>('/auth/hostels/all');
      
      const allHostels = response.hostels || [];
      const hostelsWithStats = allHostels.map((hostel: Hostel) => ({
        ...hostel,
        stats: hostelStats[hostel.id] || undefined
      })) as Hostel[]
      
      setHostels(hostelsWithStats)
    } catch (err) {
      console.error('Error fetching hostels:', err)
      setError('Failed to load hostels')
      toast.error('Failed to load hostels')
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }, [hostelStats])

  // 🎯 PERFORMANCE: Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshHostels()
      await fetchHostelStats()
      toast.success('Hostels refreshed successfully!')
    } catch (err) {
      toast.error('Failed to refresh hostels')
    } finally {
      setRefreshing(false)
    }
  }, [refreshHostels, fetchHostelStats])

  // 🎯 PERFORMANCE: Memoized event handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleFilterChange = useCallback((key: keyof FilterCriteria, value: string) => {
    setFilterCriteria(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleToggleFilter = useCallback(() => {
    setShowFilter(prev => !prev)
  }, [])

  const handleCreateHostel = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false)
  }, [])

  const handleHostelCreated = useCallback(async () => {
    setShowCreateModal(false)
    await fetchHostels()
    toast.success('Hostel created successfully!')
  }, [fetchHostels])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setFilterCriteria({
      plan: 'all',
      status: 'all',
      payment: 'all',
      location: 'all'
    })
  }, [])

  // 🚀 NEW: Handle hostel status toggle with optimistic updates
  const handleStatusToggle = useCallback(async (hostelId: string, newStatus: boolean) => {
    try {
      // Import the API to update hostel status
      const { hostelApi } = await import('@/lib/api');
      
      // Optimistic update - update local state immediately
      setHostels(prevHostels => 
        prevHostels.map(hostel => 
          hostel.id === hostelId 
            ? { ...hostel, isActive: newStatus }
            : hostel
        )
      );
      
      // Update the backend
      await hostelApi.updateHostel(hostelId, { isActive: newStatus });
      
      // Refresh the context to ensure consistency
      await refreshHostels();
      
    } catch (error) {
      console.error('Failed to update hostel status:', error);
      
      // Revert optimistic update on error
      setHostels(prevHostels => 
        prevHostels.map(hostel => 
          hostel.id === hostelId 
            ? { ...hostel, isActive: !newStatus }
            : hostel
        )
      );
      
      throw error; // Re-throw to show error in UI
    }
  }, [refreshHostels])

  // Initial data fetch - fetch all hostels directly
  useEffect(() => {
    if (canViewHostels) {
      fetchHostels()
    }
  }, [fetchHostels, canViewHostels])

  // Fetch stats when hostels change
  useEffect(() => {
    if (canViewHostels && Array.isArray(hostels) && hostels.length > 0 && Object.keys(hostelStats).length === 0) {
      fetchHostelStats()
    }
  }, [hostels, hostelStats, fetchHostelStats, canViewHostels])

  // Show loading state while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if user has permission to view hostels
  if (!canViewHostels) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <BuildingIcon className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-500">You don't have permission to view hostels.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-lg font-medium text-gray-900 mt-4">Loading hostels...</h2>
          <p className="text-gray-600 mt-2">Please wait while we fetch your hostel information</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-xl p-6 max-w-md mx-4 shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-3">
              <BuildingIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-base font-semibold text-red-800 mb-2">Error loading hostels</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <Button onClick={fetchHostels} variant="outline" size="lg" className="w-full">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 🚀 COMPACT: Smaller Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <BuildingIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hostel Management</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Manage all your hostels, monitor performance, and track key metrics in one centralized dashboard
          </p>
        </div>

        {/* 🚀 COMPACT: Smaller Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <BuildingIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Hostels</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalHostels}</p>
                <p className="text-xs text-green-600 font-medium">{summaryStats.activeHostels} active</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalStudents}</p>
                <p className="text-xs text-gray-500">Across all hostels</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <BedIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Occupancy</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.avgOccupancy}%</p>
                <p className="text-xs text-gray-500">{summaryStats.totalRooms} total rooms</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-0 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <TrendingUpIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paid Hostels</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.paidHostels}</p>
                <p className="text-xs text-orange-600 font-medium">Revenue generating</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 COMPACT: Smaller Action Bar */}
        <div className="bg-white rounded-xl shadow-md border-0 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search hostels by name, email, subdomain, or location..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 py-2 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex gap-2 w-full lg:w-auto">
              <Button
                onClick={handleToggleFilter}
                variant="outline"
                className="flex items-center px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Filters
                {Object.values(filterCriteria).some(v => v !== 'all') && (
                  <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {Object.values(filterCriteria).filter(v => v !== 'all').length}
                  </span>
                )}
              </Button>
              
              <Button 
                onClick={handleRefresh}
                variant="outline"
                disabled={refreshing}
                className="flex items-center px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200"
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <PermissionGate permission="hostel_create">
                <Button 
                  onClick={handleCreateHostel} 
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Hostel
                </Button>
              </PermissionGate>
            </div>
          </div>

          {/* 🚀 COMPACT: Smaller Advanced Filters */}
          {showFilter && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Plan</label>
                  <select
                    value={filterCriteria.plan}
                    onChange={(e) => handleFilterChange('plan', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="all">All Plans</option>
                    {filterOptions.plans.map(plan => (
                      <option key={plan} value={plan}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={filterCriteria.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment</label>
                  <select
                    value={filterCriteria.payment}
                    onChange={(e) => handleFilterChange('payment', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="all">All Payment</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Location</label>
                  <select
                    value={filterCriteria.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="all">All Locations</option>
                    {filterOptions.countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {(searchTerm || Object.values(filterCriteria).some(v => v !== 'all')) && (
                <div className="mt-3 flex justify-center">
                  <Button 
                    onClick={clearFilters} 
                    variant="outline" 
                    size="sm"
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all duration-200"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🚀 COMPACT: Smaller Results Section */}
        <div>
          {filteredHostels.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                <BuildingIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || Object.values(filterCriteria).some(v => v !== 'all') 
                  ? 'No hostels found' 
                  : 'No hostels yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || Object.values(filterCriteria).some(v => v !== 'all')
                  ? 'Try adjusting your search or filters to find what you\'re looking for'
                  : 'Get started by creating your first hostel to begin managing your properties'}
              </p>
              {!searchTerm && !Object.values(filterCriteria).some(v => v !== 'all') && (
                <PermissionGate permission="hostel_create">
                  <Button 
                    onClick={handleCreateHostel}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Your First Hostel
                  </Button>
                </PermissionGate>
              )}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-base text-gray-700 font-medium">
                  Showing {filteredHostels.length} of {hostels.length} hostels
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHostels.map((hostel) => {
                  // Build custom actions based on permissions
                  const customActions = []
                  
                  // View Details - always available if can view hostels
                  if (canViewHostels) {
                    customActions.push({
                      label: 'View Details',
                      icon: <EyeIcon className="w-4 h-4" />,
                      action: (hostelId: string) => {
                        window.location.href = `/dashboard/hostels/${hostelId}/detail`
                      },
                      variant: 'primary' as const
                    })
                  }
                  
                  // Edit - only if can update hostels
                  if (canUpdateHostels) {
                    customActions.push({
                      label: 'Edit',
                      icon: <EditIcon className="w-4 h-4" />,
                      action: (hostelId: string) => {
                        window.location.href = `/dashboard/hostels/${hostelId}/detail`
                      },
                      variant: 'outline' as const
                    })
                  }
                  
                  // Delete - only if can delete hostels
                  if (canDeleteHostels) {
                    customActions.push({
                      label: 'Delete',
                      icon: <TrashIcon className="w-4 h-4" />,
                      action: (hostelId: string) => {
                        // TODO: Implement delete confirmation modal
                        console.log('Delete hostel:', hostelId)
                      },
                      variant: 'outline' as const
                    })
                  }

                  return (
                    <HostelCard
                      key={hostel.id}
                      id={hostel.id}
                      name={hostel.name}
                      location={hostel.location?.city || hostel.location?.country || 'Unknown'}
                      image="/icons/default-hostel.svg"
                      totalRooms={hostelStats[hostel.id]?.totalRooms || 0}
                      occupiedRooms={hostelStats[hostel.id]?.occupiedRooms || 0}
                      totalStudents={hostelStats[hostel.id]?.totalStudents || 0}
                      status={hostel.isActive ? 'active' : 'inactive'}
                      showQuickActions={canUpdateHostels} // Only show status toggle if can update
                      onStatusToggle={canUpdateHostels ? handleStatusToggle : undefined}
                      customActions={customActions}
                    />
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Create Hostel Modal */}
        {showCreateModal && canCreateHostels && (
          <CreateHostelModal
            isOpen={showCreateModal}
            onClose={handleCloseCreateModal}
            onSuccess={handleHostelCreated}
          />
        )}
      </div>
    </div>
  )
})

HostelManagement.displayName = 'HostelManagement'

export default HostelManagement
