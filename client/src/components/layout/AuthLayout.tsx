import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <header className="py-4 px-6 shadow-sm bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-white font-bold text-2xl">
              Hostel<span className="text-green-400">Hive</span>
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </header>
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {children}
        </div>
      </div>
      <footer className="py-4 px-6 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} HostelHive. All rights reserved.</p>
      </footer>
    </div>
  );
}