'use client';
import React, { useCallback } from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckIcon } from 'lucide-react';
import { PRICING_PLANS } from '@/config/pricing';
import { useAuth } from '@/contexts/AuthContext';
import { useHostel } from '@/context/HostelContext';
import { useRouter } from 'next/navigation';
interface PricingFeatureProps {
  children: React.ReactNode;
}
function PricingFeature({
  children
}: PricingFeatureProps) {
  return <div className="flex items-start mb-4">
      <CheckIcon size={18} className="text-[#10B981] mr-2 mt-0.5 flex-shrink-0" />
      <span className="text-gray-600">{children}</span>
    </div>;
}
interface PricingTierProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}
function PricingTier({
  name,
  price,
  description,
  features,
  isPopular = false
}: PricingTierProps) {
  return <Card className={`flex flex-col h-full ${isPopular ? 'border-2 border-[#3B82F6] relative' : ''}`}>
      {isPopular && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge variant="primary">Most Popular</Badge>
        </div>}
      <CardHeader className={`border-b ${isPopular ? 'bg-blue-50' : ''}`}>
        <h3 className="text-xl font-bold mb-2">{name}</h3>
        <div className="mb-2">
          <span className="text-3xl font-bold">{price}</span>
          {price !== 'Free' && <span className="text-gray-600">/month</span>}
        </div>
        <p className="text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          {features.map((feature, index) => <PricingFeature key={index}>{feature}</PricingFeature>)}
        </div>
      </CardContent>
      {/* This generic tier component is used only for static rendering; explicit plan routing handled below */}
  <CardFooter>{null}</CardFooter>
    </Card>;
}
export function PricingSection() {
  const { user } = useAuth();
  const { currentHostel } = useHostel();
  const router = useRouter();

  const handleSelectPlan = useCallback((planId: string) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('HOSTELHIVE_SELECTED_PLAN', planId);
      }
    } catch {}
    // If logged in and has a hostel, go straight to billing with pre-selected plan
    if (user && currentHostel?.id) {
      router.push(`/dashboard/hostels/${currentHostel.id}/billing?plan=${encodeURIComponent(planId)}`);
      return;
    }
    // Otherwise, send to register-owner and carry plan forward
    router.push(`/auth/register-owner?plan=${encodeURIComponent(planId)}`);
  }, [user, currentHostel?.id, router]);
  return <section id="pricing" className="py-16 bg-[#F9FAFB]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your hostel&apos;s needs
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free card */}
          <div className="flex">
            <Card className="flex flex-col h-full">
              <CardHeader className="border-b">
                <h3 className="text-xl font-bold mb-2">Free Plan</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold">Free</span>
                </div>
                <p className="text-gray-600">Perfect for small hostels</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <PricingFeature>10 Rooms maximum</PricingFeature>
                  <PricingFeature>20 Students</PricingFeature>
                  <PricingFeature>1 Warden</PricingFeature>
                  <PricingFeature>No Visitor Log</PricingFeature>
                  <PricingFeature>No Complaints</PricingFeature>
                  <PricingFeature>No Staff</PricingFeature>
                  <PricingFeature>1 Max Hostel</PricingFeature>
                  <PricingFeature>Basic admin panel</PricingFeature>
                  <PricingFeature>Community support</PricingFeature>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" fullWidth onClick={() => handleSelectPlan('free')}>
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          </div>

          {PRICING_PLANS.map((plan) => (
            <div key={plan.id} className="flex">
              <Card className={`flex flex-col h-full ${plan.isPopular ? 'border-2 border-[#3B82F6] relative' : ''}`}>
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className={`border-b ${plan.isPopular ? 'bg-blue-50' : ''}`}>
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold">${plan.priceMonthly}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600">{plan.isPopular ? 'Most Popular' : 'Paid plan'}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    {plan.features.map((f, idx) => (
                      <PricingFeature key={idx}>{f}</PricingFeature>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant={plan.isPopular ? 'primary' : 'outline'} fullWidth onClick={() => handleSelectPlan(plan.id)}>
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>;
}