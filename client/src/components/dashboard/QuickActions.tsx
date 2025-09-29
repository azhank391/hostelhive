'use client'

import React, { useState, useCallback, useMemo } from 'react'
// Link not used here
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  BuildingIcon, 
  UsersIcon, 
  AlertCircleIcon,
  EyeIcon,
  DollarSignIcon,
  FileTextIcon,
  SettingsIcon,
  TrendingUpIcon,
  CalendarIcon,
  PhoneIcon,
  BellIcon,
  ShieldIcon,
  MapPinIcon
} from 'lucide-react'
import { Modal } from '@/components/modals/Modal'
import { useAuth } from '@/contexts/AuthContext'
import { useHostel } from '@/context/HostelContext'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  roles: string[]
  color: string
  priority: number
  category: 'management' | 'reports' | 'settings' | 'emergency'
  requiresPermission?: string
  badge?: {
    text: string
    color: string
  }
}

interface QuickActionsProps {
  showCategories?: boolean
  maxActions?: number
  layout?: 'grid' | 'list'
  showSearch?: boolean
  customActions?: QuickAction[]
}

/**
 * 🚀 OPTIMIZED QuickActions Component
 * 
 * Performance Improvements:
 * ✅ React.memo for re-render prevention
 * ✅ useMemo for expensive filtering and role-based calculations
 * ✅ useCallback for stable function references
 * ✅ Role-based action filtering for personalized experience
 * ✅ Category-based organization for better UX
 * ✅ Search functionality for quick action discovery
 * ✅ Priority-based sorting for most relevant actions
 * ✅ Enhanced visual design with icons and colors
 * ✅ Modal support for complex actions
 */
export const OptimizedQuickActions = React.memo(({
  showCategories = true,
  maxActions = 12,
  layout = 'grid',
  showSearch = false,
  customActions = []
}: QuickActionsProps) => {
  const { user } = useAuth()
  const { currentHostel } = useHostel()
  const router = useRouter()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null)

  // 🎯 PERFORMANCE: Memoized quick actions based on user role
  const baseQuickActions = useMemo<QuickAction[]>(() => [
    {
      id: 'add-student',
      title: 'Add New Student',
      description: 'Register a new student to the hostel',
      icon: <PlusIcon className="h-5 w-5" />,
      href: '/dashboard/students/new',
      roles: ['admin', 'owner', 'warden'],
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      priority: 1,
      category: 'management'
    },
    {
      id: 'manage-rooms',
      title: 'Manage Rooms',
      description: 'View, edit, and allocate rooms',
      icon: <BuildingIcon className="h-5 w-5" />,
      href: '/dashboard/rooms',
      roles: ['admin', 'owner', 'warden'],
      color: 'text-green-600 bg-green-50 border-green-200',
      priority: 2,
      category: 'management'
    },
    {
      id: 'student-list',
      title: 'Student Directory',
      description: 'View all registered students',
      icon: <UsersIcon className="h-5 w-5" />,
      href: '/dashboard/students',
      roles: ['admin', 'owner', 'warden'],
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      priority: 3,
      category: 'management'
    },
    {
      id: 'complaints',
      title: 'View Complaints',
      description: 'Handle student complaints and issues',
      icon: <AlertCircleIcon className="h-5 w-5" />,
      href: '/dashboard/complaints',
      roles: ['admin', 'owner', 'warden'],
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      priority: 4,
      category: 'management',
      badge: {
        text: 'New',
        color: 'bg-red-500 text-white'
      }
    },
    {
      id: 'visitor-logs',
      title: 'Visitor Management',
      description: 'Manage visitor check-ins and logs',
      icon: <EyeIcon className="h-5 w-5" />,
      href: '/dashboard/visitors',
      roles: ['admin', 'owner', 'warden'],
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      priority: 5,
      category: 'management'
    },
    {
      id: 'payments',
      title: 'Payment Reports',
      description: 'View payment status and history',
      icon: <DollarSignIcon className="h-5 w-5" />,
      href: '/dashboard/payments',
      roles: ['admin', 'owner'],
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      priority: 6,
      category: 'reports'
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description: 'View hostel performance metrics',
      icon: <TrendingUpIcon className="h-5 w-5" />,
      href: '/dashboard/analytics',
      roles: ['admin', 'owner'],
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      priority: 7,
      category: 'reports'
    },
    {
      id: 'monthly-report',
      title: 'Monthly Report',
      description: 'Generate monthly hostel report',
      icon: <FileTextIcon className="h-5 w-5" />,
      href: '/dashboard/reports/monthly',
      roles: ['admin', 'owner'],
      color: 'text-pink-600 bg-pink-50 border-pink-200',
      priority: 8,
      category: 'reports'
    },
    {
      id: 'hostel-settings',
      title: 'Hostel Settings',
      description: 'Configure hostel preferences',
      icon: <SettingsIcon className="h-5 w-5" />,
      href: '/dashboard/settings',
      roles: ['admin', 'owner'],
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      priority: 9,
      category: 'settings'
    },
    {
      id: 'events',
      title: 'Schedule Event',
      description: 'Plan hostel events and activities',
      icon: <CalendarIcon className="h-5 w-5" />,
      href: '/dashboard/events',
      roles: ['admin', 'owner', 'warden'],
      color: 'text-violet-600 bg-violet-50 border-violet-200',
      priority: 10,
      category: 'management'
    },
    {
      id: 'emergency',
      title: 'Emergency Contact',
      description: 'Quick access to emergency services',
      icon: <PhoneIcon className="h-5 w-5" />,
      onClick: () => {
        setModalContent({
          title: 'Emergency Contacts',
          content: (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800">Emergency Services</h4>
                <p className="text-red-700">Police: 100 | Fire: 101 | Ambulance: 108</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800">Hostel Emergency</h4>
                <p className="text-blue-700">Warden: +91-9876543210</p>
                <p className="text-blue-700">Admin: +91-9876543211</p>
              </div>
            </div>
          )
        })
        setShowModal(true)
      },
      roles: ['admin', 'owner', 'warden', 'student'],
      color: 'text-red-600 bg-red-50 border-red-200',
      priority: 11,
      category: 'emergency'
    },
    {
      id: 'notifications',
      title: 'Send Notification',
      description: 'Broadcast message to students',
      icon: <BellIcon className="h-5 w-5" />,
      href: '/dashboard/notifications',
      roles: ['admin', 'owner', 'warden'],
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      priority: 12,
      category: 'management'
    },
    // Student-specific actions
    {
      id: 'my-room',
      title: 'My Room Info',
      description: 'View your room details and roommates',
      icon: <MapPinIcon className="h-5 w-5" />,
      href: '/dashboard/student/room',
      roles: ['student'],
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      priority: 1,
      category: 'management'
    },
    {
      id: 'submit-complaint',
      title: 'Submit Complaint',
      description: 'Report an issue or request help',
      icon: <AlertCircleIcon className="h-5 w-5" />,
      href: '/dashboard/student/complaints/new',
      roles: ['student'],
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      priority: 2,
      category: 'management'
    },
    {
      id: 'my-complaints',
      title: 'My Complaints',
      description: 'Track your submitted complaints',
      icon: <FileTextIcon className="h-5 w-5" />,
      href: '/dashboard/student/complaints',
      roles: ['student'],
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      priority: 3,
      category: 'management'
    },
    {
      id: 'visitor-request',
      title: 'Visitor Request',
      description: 'Request visitor access permission',
      icon: <EyeIcon className="h-5 w-5" />,
      href: '/dashboard/student/visitors',
      roles: ['student'],
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      priority: 4,
      category: 'management'
    }
  ], [])

  // 🎯 PERFORMANCE: Memoized filtered actions based on user role and search
  const filteredActions = useMemo(() => {
    let actions = [...baseQuickActions, ...customActions]

    // Filter by user role
    if (user?.role) {
      actions = actions.filter(action => action.roles.includes(user.role.toLowerCase()))
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const lowercaseQuery = searchTerm.toLowerCase()
      actions = actions.filter(action =>
        action.title.toLowerCase().includes(lowercaseQuery) ||
        action.description.toLowerCase().includes(lowercaseQuery)
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      actions = actions.filter(action => action.category === selectedCategory)
    }

    // Sort by priority and limit results
    return actions
      .sort((a, b) => a.priority - b.priority)
      .slice(0, maxActions)
  }, [baseQuickActions, customActions, user?.role, searchTerm, selectedCategory, maxActions])

  // 🎯 PERFORMANCE: Memoized categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(baseQuickActions.map(action => action.category))
    )
    return uniqueCategories.map(category => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1),
      count: baseQuickActions.filter(action => action.category === category).length
    }))
  }, [baseQuickActions])

  // 🎯 PERFORMANCE: Memoized event handlers
  const handleActionClick = useCallback((action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      router.push(action.href)
    }
  }, [router])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setModalContent(null)
  }, [])

  if (!currentHostel && user?.role !== 'student') {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="text-center py-8">
          <ShieldIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-600">Please select a hostel to view available actions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500">
              {filteredActions.length} action{filteredActions.length !== 1 ? 's' : ''} available
            </p>
          </div>
          
          {showSearch && (
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search actions..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Category Filters */}
        {showCategories && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-6">
        {filteredActions.length === 0 ? (
          <div className="text-center py-8">
            <SettingsIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">No actions found</h4>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search term' : 'No actions available for your role'}
            </p>
          </div>
        ) : (
          <div className={`${
            layout === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          }`}>
            {filteredActions.map(action => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`w-full text-left p-4 rounded-lg border-2 hover:shadow-md transition-all duration-200 ${action.color} hover:scale-105`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-0.5">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{action.title}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{action.description}</p>
                      {action.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-white bg-opacity-50 rounded">
                          {action.category}
                        </span>
                      )}
                    </div>
                  </div>
                  {action.badge && (
                    <span className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${action.badge.color}`}>
                      {action.badge.text}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Modal */}
      {showModal && modalContent && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={modalContent.title}
        >
          {modalContent.content}
        </Modal>
      )}
    </div>
  )
})

OptimizedQuickActions.displayName = 'OptimizedQuickActions'

export default OptimizedQuickActions
