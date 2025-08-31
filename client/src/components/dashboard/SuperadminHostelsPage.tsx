'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BuildingIcon, UsersIcon, MapPinIcon, CreditCardIcon } from 'lucide-react'

interface Hostel {
  id: string
  name: string
  email: string
  subdomain: string
  plan: string
  isActive: boolean
  isPaid: boolean
  createdAt: string
  location?: {
    country: string
    city: string
  }
}

export const SuperadminHostelsPage = () => {
  const [hostels, setHostels] = useState<Hostel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch hostels from superadmin API
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hostels...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Hostels</h1>
              <p className="text-gray-600">Manage all registered hostels in the system</p>
            </div>
            <Button>
              <BuildingIcon className="h-4 w-4 mr-2" />
              Add New Hostel
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hostels.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <BuildingIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p>No hostels found</p>
                <p className="text-sm">Hostels will appear here once registered</p>
              </div>
            ) : (
              hostels.map((hostel) => (
                <div key={hostel.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{hostel.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      hostel.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {hostel.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      {hostel.email}
                    </div>
                    <div className="flex items-center">
                      <BuildingIcon className="h-4 w-4 mr-2" />
                      {hostel.subdomain}
                    </div>
                    {hostel.location && (
                      <div className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-2" />
                        {hostel.location.city}, {hostel.location.country}
                      </div>
                    )}
                    <div className="flex items-center">
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      <span className={`font-medium ${
                        hostel.isPaid ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {hostel.plan} Plan {hostel.isPaid ? '(Paid)' : '(Unpaid)'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SuperadminHostelsPage
