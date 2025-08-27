import React from 'react';
import { Building2Icon, GlobeIcon, UsersIcon, HomeIcon, GraduationCapIcon, TicketIcon, ClipboardCheckIcon, BarChartIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({
  icon,
  title,
  description
}: FeatureCardProps) {
  return <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-[#3B82F6] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>;
}

export function FeaturesSection() {
  const features = [{
    icon: <Building2Icon size={24} />,
    title: 'Multi-Property Management',
    description: 'Manage unlimited hostels from one dashboard'
  }, {
    icon: <GlobeIcon size={24} />,
    title: 'Custom Subdomains',
    description: 'Branded portals: yourhostel.hostelhive.com'
  }, {
    icon: <UsersIcon size={24} />,
    title: 'Role-Based Access',
    description: 'Owners, wardens, and students - all connected'
  }, {
    icon: <HomeIcon size={24} />,
    title: 'Room & Occupancy Management',
    description: 'Real-time room allocation and tracking'
  }, {
    icon: <GraduationCapIcon size={24} />,
    title: 'Student Portal',
    description: 'Self-service portal for students'
  }, {
    icon: <TicketIcon size={24} />,
    title: 'Complaint Management',
    description: 'Streamlined complaint resolution'
  }, {
    icon: <ClipboardCheckIcon size={24} />,
    title: 'Visitor Logging',
    description: 'Digital visitor management system'
  }, {
    icon: <BarChartIcon size={24} />,
    title: 'Financial Tracking',
    description: 'Complete billing and payment tracking'
  }];
  
  return <section id="features" className="py-16 bg-[#F9FAFB]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Everything You Need to Manage Your Hostel
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive suite of tools designed specifically for modern
            hostel management
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />)}
        </div>
      </div>
    </section>;
}