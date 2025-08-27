import React from 'react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckIcon } from 'lucide-react';
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
      <CardFooter>
        <Button variant={isPopular ? 'primary' : 'outline'} fullWidth>
          Get Started
        </Button>
      </CardFooter>
    </Card>;
}
export function PricingSection() {
  const pricingTiers = [{
    name: 'Free Plan',
    price: 'Free',
    description: 'Perfect for small hostels',
    features: ['5 Rooms maximum', '20 Students', 'Basic admin panel', 'Community support']
  }, {
    name: 'Pro Plan',
    price: '$29',
    description: 'Most Popular',
    features: ['Up to 500 students', 'Unlimited rooms', 'Visitor logs', 'Analytics dashboard', 'Email support'],
    isPopular: true
  }, {
    name: 'Enterprise Plan',
    price: '$99',
    description: 'For large institutions',
    features: ['Unlimited everything', 'Priority support', 'Custom integrations', 'Dedicated account manager']
  }];
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
          {pricingTiers.map((tier, index) => <div key={index} className="flex">
              <PricingTier name={tier.name} price={tier.price} description={tier.description} features={tier.features} isPopular={tier.isPopular} />
            </div>)}
        </div>
      </div>
    </section>;
}