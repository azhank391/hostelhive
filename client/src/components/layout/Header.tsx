'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { MenuIcon, XIcon } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <header className="sticky top-0 z-50 w-full bg-gray-900 shadow-sm border-b border-gray-700">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-white font-bold text-2xl">
              Hostel<span className="text-green-400">Hive</span>
            </span>
          </Link>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-gray-300 hover:text-white font-medium transition-colors">
            Home
          </Link>
          <a href="#features" className="text-gray-300 hover:text-white font-medium transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-gray-300 hover:text-white font-medium transition-colors">
            Pricing
          </a>
          <a href="#" className="text-gray-300 hover:text-white font-medium transition-colors">
            About
          </a>
          <a href="#" className="text-gray-300 hover:text-white font-medium transition-colors">
            Contact
          </a>
          <a href="#" className="text-gray-300 hover:text-white font-medium transition-colors">
            Blog
          </a>
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/auth/login">
            <Button variant="outline" size="sm" className="text-white border-gray-600 hover:bg-gray-800 hover:border-gray-500">
              Login
            </Button>
          </Link>
          <Link href="/auth/register-owner">
            <Button size="sm" className="bg-green-600 hover:bg-green-700">Get Started</Button>
          </Link>
        </div>
        {/* Mobile menu button */}
        <button className="md:hidden text-gray-300 hover:text-white transition-colors" onClick={toggleMenu} aria-label="Toggle menu">
          {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>
      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 border-t border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              <Link href="/" className="text-gray-300 hover:text-white font-medium py-2 transition-colors">
                Home
              </Link>
              <a href="#features" className="text-gray-300 hover:text-white font-medium py-2 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-300 hover:text-white font-medium py-2 transition-colors">
                Pricing
              </a>
              <a href="#" className="text-gray-300 hover:text-white font-medium py-2 transition-colors">
                About
              </a>
              <a href="#" className="text-gray-300 hover:text-white font-medium py-2 transition-colors">
                Contact
              </a>
              <a href="#" className="text-gray-300 hover:text-white font-medium py-2 transition-colors">
                Blog
              </a>
              <div className="flex flex-col space-y-3 pt-4">
                <Link href="/auth/login">
                  <Button variant="outline" fullWidth>
                    Login
                  </Button>
                </Link>
                <Link href="/auth/register-owner">
                  <Button fullWidth>Get Started</Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}