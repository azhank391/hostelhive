'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DollarSignIcon, CreditCardIcon, TrendingUpIcon, AlertTriangleIcon } from 'lucide-react'

interface BillingData {
  totalRevenue: number
  monthlyRevenue: number
  paidHostels: number
  unpaidHostels: number
  conversionRate: number
  planDistribution: Array<{
    plan: string
    count: number
    revenue: number
  }>
}

export const SuperadminBillingPage = () => {
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch billing data from superadmin API
    // Reference setBillingData to avoid unused-var lint error until wired
    void setBillingData
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing data...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Billing Overview</h1>
              <p className="text-gray-600">Track revenue and subscription management</p>
            </div>
            <Button>
              <CreditCardIcon className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <DollarSignIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${billingData?.totalRevenue || 0}</p>
                  <p className="text-sm text-gray-500">All time</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <TrendingUpIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${billingData?.monthlyRevenue || 0}</p>
                  <p className="text-sm text-gray-500">This month</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <CreditCardIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Paid Hostels</p>
                  <p className="text-2xl font-bold text-gray-900">{billingData?.paidHostels || 0}</p>
                  <p className="text-sm text-gray-500">Active subscriptions</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <AlertTriangleIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{billingData?.conversionRate || 0}%</p>
                  <p className="text-sm text-gray-500">Free to paid</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Revenue Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
            <div className="space-y-4">
              {billingData?.planDistribution ? (
                billingData.planDistribution.map((plan) => (
                  <div key={plan.plan} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{plan.plan}</span>
                      <span className="text-sm text-gray-500 ml-2">({plan.count} hostels)</span>
                    </div>
                    <span className="font-semibold text-green-600">${plan.revenue}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p>No billing data available</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Paid Hostels:</span>
                <span className="font-semibold text-green-600">{billingData?.paidHostels || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unpaid Hostels:</span>
                <span className="font-semibold text-orange-600">{billingData?.unpaidHostels || 0}</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Total Hostels:</span>
                  <span className="font-bold text-gray-900">
                    {(billingData?.paidHostels || 0) + (billingData?.unpaidHostels || 0)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SuperadminBillingPage
