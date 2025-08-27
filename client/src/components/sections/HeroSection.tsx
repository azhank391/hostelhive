import React from 'react';
import Image from 'next/image';
import { Button } from '../ui/Button';
import { PlayIcon } from '../ui/icons';

export function HeroSection() {
  return (
    <section className="py-12 md:py-24 bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          {/* Content Section */}
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Transform Your Hostel Management
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              The complete SaaS platform for modern hostel operations. Manage
              multiple properties, streamline operations, and enhance student
              experience.
            </p>
            <p className="text-lg font-medium text-[#3B82F6] mb-8">
              Trusted by 25+ hostels across Pakistan
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg">Start Free Trial</Button>
              <Button variant="outline" size="lg" className="flex items-center justify-center gap-2">
                <PlayIcon size={18} />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Image Section */}
          <div className="md:w-1/2">
            <div className="relative">
              <div className="bg-[#3B82F6] rounded-lg shadow-xl overflow-hidden">
                <Image 
                  src="https://images.unsplash.com/photo-1596079890744-c1a0462d0975?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="HostelHive Dashboard Preview" 
                  width={800}
                  height={600}
                  className="w-full h-auto opacity-80 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#3B82F6]/50" />
              </div>
              
              {/* Floating Icon */}
              <div className="absolute -bottom-6 -right-6 bg-[#10B981] rounded-full p-4 shadow-lg">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}