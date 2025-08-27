import React from 'react';
interface StepProps {
  number: number;
  title: string;
  description: string;
}
function Step({
  number,
  title,
  description
}: StepProps) {
  return <div className="flex">
      <div className="mr-6">
        <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold">
          {number}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>;
}
export function HowItWorksSection() {
  const steps = [{
    title: 'Sign Up as Owner',
    description: 'Register your account in 30 seconds'
  }, {
    title: 'Create Your Hostel',
    description: 'Set up your hostel profile and subdomain'
  }, {
    title: 'Add Rooms & Staff',
    description: 'Configure rooms and invite wardens'
  }, {
    title: 'Onboard Students',
    description: 'Add students and manage operations'
  }];
  return <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How HostelHive Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get your hostel up and running in four simple steps
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"></div>
            <div className="space-y-12 relative">
              {steps.map((step, index) => <div key={index} className="relative">
                  <Step number={index + 1} title={step.title} description={step.description} />
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </section>;
}