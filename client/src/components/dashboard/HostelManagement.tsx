'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { PlusIcon, FilterIcon, SearchIcon, BuildingIcon, RefreshCwIcon, TrendingUpIcon, MapPinIcon, UsersIcon, BedIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import HostelCard from '@/components/dashboard/HostelCard'
import { CreateHostelModal } from '@/components/modals/CreateHostelModal'
import { Input } from '@/components/ui/Input'
import toast from '@/lib/toast'
import { useHostel } from '@/context/HostelContext'
import { superadminApi } from '@/lib/api'

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
 * 🚀 OPTIMIZED HostelManagement Component
 * 
 * Performance Improvements:
 * ✅ React.memo for re-render prevention
 * ✅ useMemo for expensive filtering and calculations
 * ✅ useCallback for stable function references
 * ✅ Batch data fetching for hostel statistics
 * ✅ Optimized search and filtering operations
 * ✅ Context-aware data management
 * ✅ Enhanced error handling with recovery
 */
export const HostelManagement = React.memo(() => {
  const { hostels: availableHostels, refreshHostels, loadingState } = useHostel()
  
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
        (hostel.location?.city && hostel.location.city.toLowerCase().includes(lowercaseQuery)) ||
        (hostel.location?.country && hostel.location.country.toLowerCase().includes(lowercaseQuery))
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
      
      // Wait for HostelContext to finish loading
      if (loadingState === 'loading' || loadingState === 'idle') {
        return;
      }
      
      // Use hostels from HostelContext for better performance
      // Handle case where availableHostels might be undefined
      const safeHostels = Array.isArray(availableHostels) ? availableHostels : []
      const hostelsWithStats = safeHostels.map(hostel => ({
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
  }, [availableHostels, loadingState])

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

  // Initial data fetch - wait for HostelContext to be ready
  useEffect(() => {
    // Only fetch hostels after HostelContext has finished loading
    if (loadingState === 'loaded') {
      fetchHostels()
    }
  }, [fetchHostels, loadingState])

  // Fetch stats when hostels change
  useEffect(() => {
    if (Array.isArray(hostels) && hostels.length > 0 && Object.keys(hostelStats).length === 0) {
      fetchHostelStats()
    }
  }, [hostels, hostelStats, fetchHostelStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hostels...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md mx-auto">
        <h3 className="text-sm font-medium text-red-800 mb-2">Error loading hostels</h3>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <Button onClick={fetchHostels} variant="outline" size="sm" className="w-full">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hostel Management</h1>
          <p className="text-gray-600">
            {summaryStats.totalHostels} total hostels • {summaryStats.activeHostels} active • {summaryStats.paidHostels} paid
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            disabled={refreshing}
            className="flex items-center justify-center"
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={handleCreateHostel} className="flex items-center justify-center">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Hostel
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <BuildingIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Hostels</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalHostels}</p>
              <p className="text-sm text-green-600">{summaryStats.activeHostels} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalStudents}</p>
              <p className="text-sm text-gray-500">Across all hostels</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <BedIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Occupancy</p>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.avgOccupancy}%</p>
              <p className="text-sm text-gray-500">{summaryStats.totalRooms} total rooms</p>
            </div>
          </div>
        </div>


      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search hostels by name, email, subdomain, or location..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleToggleFilter}
            variant="outline"
            className="flex items-center"
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            Filters
            {Object.values(filterCriteria).some(v => v !== 'all') && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(filterCriteria).filter(v => v !== 'all').length}
              </span>
            )}
          </Button>
          {(searchTerm || Object.values(filterCriteria).some(v => v !== 'all')) && (
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilter && (
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={filterCriteria.plan}
                onChange={(e) => handleFilterChange('plan', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Plans</option>
                {filterOptions.plans.map(plan => (
                  <option key={plan} value={plan}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterCriteria.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
              <select
                value={filterCriteria.payment}
                onChange={(e) => handleFilterChange('payment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Payment</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={filterCriteria.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Locations</option>
                {filterOptions.countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        {filteredHostels.length === 0 ? (
          <div className="text-center py-12">
            <BuildingIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm || Object.values(filterCriteria).some(v => v !== 'all') 
                ? 'No hostels found' 
                : 'No hostels yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filterCriteria).some(v => v !== 'all')
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first hostel'}
            </p>
            {!searchTerm && !Object.values(filterCriteria).some(v => v !== 'all') && (
              <div className="mt-6">
                <Button onClick={handleCreateHostel}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Hostel
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                Showing {filteredHostels.length} of {hostels.length} hostels
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHostels.map((hostel) => (
                <HostelCard
                  key={hostel.id}
                  id={hostel.id}
                  name={hostel.name}
                  location={hostel.location?.city || 'Unknown'}
                  image="/icons/default-hostel.svg"
                  totalRooms={hostelStats[hostel.id]?.totalRooms || 0}
                  occupiedRooms={hostelStats[hostel.id]?.occupiedRooms || 0}
                  totalStudents={hostelStats[hostel.id]?.totalStudents || 0}
                  status={hostel.isActive ? 'active' : 'inactive'}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Hostel Modal */}
      {showCreateModal && (
        <CreateHostelModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onSuccess={handleHostelCreated}
        />
      )}
    </div>
  )
})

HostelManagement.displayName = 'HostelManagement'

export default HostelManagement
