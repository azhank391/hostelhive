"use client";
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { redirect } from 'next/navigation';
import { useBilling } from '@/hooks/useBilling';
import { useStripe } from '@/contexts/StripeContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    priceMonthly: 29,
    stripePriceIdMonthly: 'price_monthly_basic', // TODO: replace with real Stripe price ID
    features: ['Up to 100 students', 'Basic reporting', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Professional',
    priceMonthly: 59,
    stripePriceIdMonthly: 'price_monthly_pro', // TODO: replace with real Stripe price ID
    features: ['Up to 500 students', 'Advanced reporting', 'Priority support', 'API access'],
  },
];

export default function BillingPage() {
  return <BillingPageClient />;
}

function BillingPageClient() {
  const { user } = useAuth();
  const { hasPermission, loading } = usePermissions();
  const { subscriptionStatus, createCheckoutSession } = useBilling();
  const { stripePromise } = useStripe();

  if (loading) {
    return <div className="p-8 text-gray-600">Loading billing...</div>;
  }

  if (!user) {
    redirect('/login');
    return null;
  }

  if (!hasPermission('view_billing')) {
    return (
      <div className="p-8">
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 text-sm mb-4">You do not have permission to view billing information.</p>
        </div>
      </div>
    );
  }

  const handleSubscribe = async (priceId: string, planId: string) => {
    try {
      const sessionId = await createCheckoutSession(priceId, planId);
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });
      if (error) console.error('Stripe redirect error:', error);
    } catch (error) {
      console.error('Subscribe error:', error);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-1 text-sm">Choose a plan to activate your account.</p>
      </header>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <h3>Current Subscription</h3>
        </CardHeader>
        <CardContent>
          <p>Status: {subscriptionStatus?.subscription_status || 'No subscription'}</p>
          <p>Plan: {subscriptionStatus?.plan_id || 'None'}</p>
          {subscriptionStatus?.trial_end && (
            <p>Trial ends: {new Date(subscriptionStatus.trial_end).toLocaleDateString()}</p>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <h3>{plan.name}</h3>
              <p className="text-2xl font-bold">${plan.priceMonthly}/month</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, i) => (
                  <li key={i}>✓ {feature}</li>
                ))}
              </ul>
              <Button onClick={() => handleSubscribe(plan.stripePriceIdMonthly, plan.id)} className="w-full">
                Subscribe to {plan.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
