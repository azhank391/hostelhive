'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BarChart3Icon, TrendingUpIcon, UsersIcon, BuildingIcon, GlobeIcon } from 'lucide-react'

interface AnalyticsData {
  userGrowth: Array<{
    month: string
    users: number
  }>
  hostelGrowth: Array<{
    month: string
    hostels: number
  }>
  regionalDistribution: Array<{
    country: string
    count: number
  }>
  planDistribution: Array<{
    plan: string
    count: number
  }>
}

export const SuperadminAnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch analytics data from superadmin API
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="text-gray-600">System-wide insights and performance metrics</p>
            </div>
            <Button>
              <BarChart3Icon className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Growth Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-blue-600" />
              User Growth
            </h3>
            <div className="space-y-3">
              {analyticsData?.userGrowth ? (
                analyticsData.userGrowth.map((item) => (
                  <div key={item.month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{item.month}</span>
                    <span className="font-semibold text-blue-600">{item.users} users</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>No growth data available</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BuildingIcon className="h-5 w-5 mr-2 text-green-600" />
              Hostel Growth
            </h3>
            <div className="space-y-3">
              {analyticsData?.hostelGrowth ? (
                analyticsData.hostelGrowth.map((item) => (
                  <div key={item.month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{item.month}</span>
                    <span className="font-semibold text-green-600">{item.hostels} hostels</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BuildingIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>No growth data available</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <GlobeIcon className="h-5 w-5 mr-2 text-purple-600" />
              Regional Distribution
            </h3>
            <div className="space-y-3">
              {analyticsData?.regionalDistribution ? (
                analyticsData.regionalDistribution.map((region) => (
                  <div key={region.country} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{region.country}</span>
                    <span className="font-semibold text-purple-600">{region.count} hostels</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <GlobeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>No regional data available</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3Icon className="h-5 w-5 mr-2 text-indigo-600" />
              Plan Distribution
            </h3>
            <div className="space-y-3">
              {analyticsData?.planDistribution ? (
                analyticsData.planDistribution.map((plan) => (
                  <div key={plan.plan} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{plan.plan}</span>
                    <span className="font-semibold text-indigo-600">{plan.count} hostels</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3Icon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>No plan data available</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SuperadminAnalyticsPage
